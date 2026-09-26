/**
 * Núcleo do Worker, sem dependência de `self`/postMessage: recebe um `Buscador` (URL assinada no
 * navegador, disco/R2 em Node) e um cache opcional de bytes (Cache API no navegador), carrega só os
 * grupos que a estratégia referencia e executa o mesmo `executar()` do servidor — mesmo hash.
 *
 * Cache em dois níveis: memória (bytes por chave, reaproveitados entre runs) e persistente
 * (`CacheBytes`, ex.: Cache API), ambos por chave versionada `<versao>/<dir>/<grupo>.bin`.
 */
import { aplicarHoldout, carregarDataset, filtroDoUniverso, infoCompeticoes, resolverAliases, type Buscador, type Manifest } from '../data/dataset'
import { catalogoDe, ErroEstrategia, prepararEstrategia, type Catalogo } from '../engine/estrategia'
import { executarCompilada } from '../engine/run'
import type { Estrategia, RunResult } from '../engine/tipos'

export interface CacheBytes {
  ler: (chave: string) => Promise<Uint8Array | null>
  gravar: (chave: string, bytes: Uint8Array) => Promise<void>
}

export type FaseProgresso = 'baixando' | 'decodificando' | 'executando' | 'validando' | 'varrendo'
export interface Progresso { fase: FaseProgresso; feitos: number; total: number }

export interface OpcoesSessao {
  catalogo: { campos: { key: string; tipo: string }[] }
  manifest: Manifest
  buscar: Buscador
  cache?: CacheBytes
  /** limite do cache em memória (bytes); acima disso as entradas mais antigas saem */
  memoriaMax?: number
  aoProgresso?: (p: Progresso) => void
}

export interface OpcoesExecucao { bootstrap?: number; maxApostas?: number; extras?: boolean; validacao?: boolean; tentativasPrevias?: number }

export class Sessao {
  private readonly catalogo: Catalogo
  private readonly memoria = new Map<string, Uint8Array>()
  private memoriaBytes = 0
  private readonly memoriaMax: number
  readonly manifest: Manifest

  constructor(private readonly op: OpcoesSessao) {
    this.catalogo = catalogoDe(op.catalogo.campos)
    this.manifest = op.manifest
    this.memoriaMax = op.memoriaMax ?? 256 * 1024 * 1024
  }

  get versao(): string { return this.manifest.versao }

  /** Valida sem executar (para a UI mostrar erros e a contagem de campos ao digitar). */
  validar(estrategia: Estrategia): { ok: boolean; erros: string[]; avisos: string[]; camposUsados: string[]; indicadores: { nome: string; tipo: string }[] } {
    try {
      const ec = prepararEstrategia(estrategia, this.catalogo)
      return { ok: true, erros: [], avisos: ec.avisos.map((a) => a.mensagem), camposUsados: ec.camposUsados, indicadores: ec.indicadores.map((i) => ({ nome: i.nome, tipo: i.tipo })) }
    } catch (e) {
      if (e instanceof ErroEstrategia) return { ok: false, erros: e.erros, avisos: [], camposUsados: [], indicadores: [] }
      throw e
    }
  }

  private async buscarComCache(chave: string, stats: { doCache: number }): Promise<Uint8Array> {
    const mem = this.memoria.get(chave)
    if (mem) { stats.doCache++; return mem }
    let bytes = (await this.op.cache?.ler(chave)) ?? null
    if (bytes) stats.doCache++
    else { bytes = await this.op.buscar(chave); void this.op.cache?.gravar(chave, bytes)?.catch(() => undefined) }
    this.memoria.set(chave, bytes); this.memoriaBytes += bytes.length
    while (this.memoriaBytes > this.memoriaMax && this.memoria.size > 1) {
      const primeira = this.memoria.keys().next().value as string
      const b = this.memoria.get(primeira) as Uint8Array
      this.memoria.delete(primeira); this.memoriaBytes -= b.length
    }
    return bytes
  }

  async executar(estrategia: Estrategia, opcoes: OpcoesExecucao = {}): Promise<{ resultado: RunResult; carga: { chunks: number; bytes: number; ms: number; doCache: number } }> {
    const ec = prepararEstrategia(estrategia, this.catalogo)
    const { universo, holdout } = aplicarHoldout(resolverAliases(estrategia.universo, this.manifest), estrategia.validacao?.holdout, this.manifest)
    const stats = { doCache: 0 }
    const t0 = Date.now()
    const carga = await carregarDataset({
      manifest: this.manifest, campos: ec.camposUsados, filtro: filtroDoUniverso(universo, this.manifest),
      buscar: (k) => this.buscarComCache(k, stats), paralelo: 6,
      aoProgresso: (feitos, total) => this.op.aoProgresso?.({ fase: 'baixando', feitos, total }),
    })
    this.op.aoProgresso?.({ fase: 'executando', feitos: 0, total: 1 })
    const { info, nomes } = infoCompeticoes(this.manifest)
    const resultado = executarCompilada({ ...ec, estrategia: { ...estrategia, universo } }, carga.dataset, {
      catalogo: this.catalogo, competicoesInfo: info, nomesCompeticoes: nomes, nomesTimes: new Map(Object.entries(this.manifest.times ?? {})),
      bootstrap: opcoes.bootstrap, maxApostas: opcoes.maxApostas, extras: opcoes.extras ?? true,
      validacao: opcoes.validacao, tentativasPrevias: opcoes.tentativasPrevias, holdout,
      aoProgresso: (fase, feitos, total) => this.op.aoProgresso?.({ fase: fase as FaseProgresso, feitos, total }),
    })
    return { resultado, carga: { chunks: carga.chunks, bytes: carga.bytes, ms: Date.now() - t0, doCache: stats.doCache } }
  }

  limpar(): void { this.memoria.clear(); this.memoriaBytes = 0 }
}

/**
 * Buscador do navegador: pede URLs assinadas ao site (em lotes) e baixa do R2. Agrupa os pedidos
 * feitos no mesmo tick para uma única chamada a `/api/laboratorio/dataset?chaves=`.
 */
export function buscadorAssinado(endpoint: string, fetchFn: typeof fetch = fetch): Buscador {
  let pendentes: { chave: string; resolve: (u: string) => void; reject: (e: Error) => void }[] = []
  let agendado = false
  const despachar = async () => {
    agendado = false
    const lote = pendentes; pendentes = []
    try {
      const chaves = Array.from(new Set(lote.map((p) => p.chave)))
      const urls: Record<string, string> = {}
      for (let i = 0; i < chaves.length; i += 200) {
        const parte = chaves.slice(i, i + 200)
        const r = await fetchFn(`${endpoint}?chaves=${encodeURIComponent(parte.join(','))}`, { credentials: 'same-origin' })
        if (!r.ok) throw new Error(`URLs assinadas: HTTP ${r.status}`)
        Object.assign(urls, ((await r.json()) as { urls: Record<string, string> }).urls)
      }
      for (const p of lote) { const u = urls[p.chave]; if (u) p.resolve(u); else p.reject(new Error(`Sem URL para ${p.chave}`)) }
    } catch (e) { for (const p of lote) p.reject(e as Error) }
  }
  const urlDe = (chave: string) => new Promise<string>((resolve, reject) => {
    pendentes.push({ chave, resolve, reject })
    if (!agendado) { agendado = true; void Promise.resolve().then(despachar) }
  })
  return async (chave) => {
    const url = await urlDe(chave)
    let r: Response
    try { r = await fetchFn(url) } catch (e) {
      // sem status HTTP = o navegador bloqueou (quase sempre CORS do bucket para esta origem)
      const origem = typeof location !== 'undefined' ? location.origin : 'esta origem'
      throw new Error(`Download do dataset bloqueado pelo navegador para ${origem}: confira a política CORS do bucket R2 (AllowedOrigins precisa incluir ${origem}). Detalhe: ${(e as Error).message}`)
    }
    if (!r.ok) throw new Error(`${chave}: HTTP ${r.status}`)
    return new Uint8Array(await r.arrayBuffer())
  }
}

/** Cache persistente sobre a Cache API do navegador (chaves versionadas → imutáveis). */
export function cacheApi(nome = 'lab-chunks-v1'): CacheBytes | undefined {
  if (typeof caches === 'undefined') return undefined
  const req = (chave: string) => `https://lab.cache/${chave}`
  return {
    ler: async (chave) => { try { const c = await caches.open(nome); const r = await c.match(req(chave)); return r ? new Uint8Array(await r.arrayBuffer()) : null } catch { return null } },
    gravar: async (chave, bytes) => { try { const c = await caches.open(nome); await c.put(req(chave), new Response(bytes as Uint8Array<ArrayBuffer>, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(bytes.length) } })) } catch { /* sem espaço/privado: ignora */ } },
  }
}
