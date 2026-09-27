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
import { explorar, prepararExploracao, type OpcoesExploracao, type ResultadoExploracao } from '../engine/explorar'
import type { Estrategia, RunResult } from '../engine/tipos'
import { casasDasEntradas } from '../engine/universo'

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

  /** Avisa o buscador das chaves que vão faltar na memória (ele pode assinar as URLs em lote). */
  private async prepararChaves(chaves: string[]): Promise<void> {
    const faltam = chaves.filter((k) => !this.memoria.has(k))
    if (faltam.length) await this.op.buscar.preparar?.(faltam)
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
      manifest: this.manifest, campos: ec.camposUsados, filtro: filtroDoUniverso(universo, this.manifest, casasDasEntradas(estrategia.entradas)),
      buscar: (k) => this.buscarComCache(k, stats), preparar: (chaves) => this.prepararChaves(chaves), paralelo: 6,
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

  /** Explorador de vantagens: apostas básicas em todo o universo, por liga × temporada (× faixa de estatística). */
  async explorar(opcoes: OpcoesExploracao): Promise<{ resultado: ResultadoExploracao; carga: { chunks: number; bytes: number; ms: number; doCache: number } }> {
    const universo = resolverAliases(opcoes.universo, this.manifest)
    const prep = prepararExploracao({ ...opcoes, universo }, this.catalogo)
    const stats = { doCache: 0 }
    const t0 = Date.now()
    const carga = await carregarDataset({
      manifest: this.manifest, campos: prep.camposUsados, filtro: filtroDoUniverso(universo, this.manifest, casasDasEntradas(opcoes.apostas)),
      buscar: (k) => this.buscarComCache(k, stats), preparar: (chaves) => this.prepararChaves(chaves), paralelo: 6,
      aoProgresso: (feitos, total) => this.op.aoProgresso?.({ fase: 'baixando', feitos, total }),
    })
    this.op.aoProgresso?.({ fase: 'executando', feitos: 0, total: 1 })
    const { info, nomes } = infoCompeticoes(this.manifest)
    const resultado = explorar(prep, carga.dataset, { competicoesInfo: info, nomesCompeticoes: nomes })
    return { resultado, carga: { chunks: carga.chunks, bytes: carga.bytes, ms: Date.now() - t0, doCache: stats.doCache } }
  }

  limpar(): void { this.memoria.clear(); this.memoriaBytes = 0 }
}

/** Erros sem resposta HTTP (`TypeError: Failed to fetch`) e 5xx/429 são transitórios: vale repetir. */
const ehTransitorio = (e: unknown) => e instanceof TypeError || (e instanceof Error && /HTTP (5\d\d|429)/.test(e.message))

async function comRetentativas<T>(fn: () => Promise<T>, tentativas = 3, esperaMs = 400): Promise<T> {
  let ultimo: unknown
  for (let k = 0; k < tentativas; k++) {
    try { return await fn() } catch (e) {
      ultimo = e
      if (!ehTransitorio(e) || k === tentativas - 1) break
      await new Promise((r) => setTimeout(r, esperaMs * 2 ** k))
    }
  }
  throw ultimo
}

const TAMANHO_LOTE_POST = 500
const TAMANHO_LOTE_GET = 100
/** margem antes da expiração da URL assinada (o servidor dá 15 min) */
const MARGEM_EXPIRACAO_MS = 60_000

/**
 * Buscador do navegador: pede URLs assinadas ao site e baixa do R2.
 *
 * - `preparar(chaves)` (chamado pelo `carregarDataset` antes do primeiro download) assina todas as
 *   chaves da carga em poucas chamadas `POST /api/laboratorio/dataset` (lotes de 500), em vez de uma
 *   chamada por chunk. Se o servidor não aceitar POST (deploy antigo), cai para GET em lotes de 100.
 * - Chaves que não foram preparadas ainda são agrupadas por tick, como antes.
 * - Falhas de rede (`Failed to fetch`) e 5xx são repetidas 3 vezes com espera; o erro final diz o que
 *   aconteceu em vez do texto cru do navegador.
 */
export function buscadorAssinado(endpoint: string, fetchFn: typeof fetch = fetch): Buscador {
  const assinadas = new Map<string, { url: string; expira: number }>()
  const guardar = (urls: Record<string, string>, expiraEm?: string) => {
    const expira = (expiraEm ? Date.parse(expiraEm) : Date.now() + 15 * 60_000) - MARGEM_EXPIRACAO_MS
    for (const [k, u] of Object.entries(urls)) assinadas.set(k, { url: u, expira })
  }
  const valida = (chave: string) => { const a = assinadas.get(chave); return a && a.expira > Date.now() ? a.url : null }
  const erroDeRede = (e: unknown, oQue: string) => new Error(`Falha de rede ao ${oQue} (${e instanceof Error ? e.message : String(e)}). Verifique a conexão e tente de novo; se persistir, saia e entre na conta outra vez.`)
  const erroHttp = (status: number, oQue: string) => new Error(status === 401 || status === 403 ? `Sessão expirada ou sem acesso ao Laboratório ao ${oQue} (HTTP ${status}): entre na conta de novo.` : `${oQue}: HTTP ${status}`)

  let usarPost = true
  const pedirLote = async (parte: string[]): Promise<void> => {
    const oQue = 'pedir URLs assinadas'
    const r = await comRetentativas(async () => {
      const resp = usarPost
        ? await fetchFn(endpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chaves: parte }) })
        : await fetchFn(`${endpoint}?chaves=${encodeURIComponent(parte.join(','))}`, { credentials: 'same-origin' })
      if (!resp.ok) { if (resp.status >= 500 || resp.status === 429) throw new Error(`${oQue}: HTTP ${resp.status}`); throw erroHttp(resp.status, oQue) }
      return resp
    }).catch((e) => { throw e instanceof TypeError ? erroDeRede(e, oQue) : e })
    const j = (await r.json()) as { urls: Record<string, string>; expiraEm?: string }
    guardar(j.urls, j.expiraEm)
  }
  const pedir = async (chaves: string[]): Promise<void> => {
    const faltam = chaves.filter((k) => !valida(k))
    if (!faltam.length) return
    if (usarPost) {
      // sonda o POST com o primeiro lote; 404/405 = servidor antigo → GET
      try { await pedirLote(faltam.slice(0, TAMANHO_LOTE_POST)) } catch (e) {
        if (e instanceof Error && /HTTP (404|405)/.test(e.message)) usarPost = false; else throw e
      }
    }
    const tam = usarPost ? TAMANHO_LOTE_POST : TAMANHO_LOTE_GET
    const restantes = faltam.filter((k) => !valida(k))
    for (let i = 0; i < restantes.length; i += tam) await pedirLote(restantes.slice(i, i + tam))
  }

  // chaves pedidas sem preparo: agrupa as do mesmo tick numa chamada só
  let pendentes: { chave: string; resolve: (u: string) => void; reject: (e: Error) => void }[] = []
  let agendado = false
  const despachar = async () => {
    agendado = false
    const lote = pendentes; pendentes = []
    try {
      await pedir(Array.from(new Set(lote.map((p) => p.chave))))
      for (const p of lote) { const u = valida(p.chave); if (u) p.resolve(u); else p.reject(new Error(`Sem URL para ${p.chave}`)) }
    } catch (e) { for (const p of lote) p.reject(e as Error) }
  }
  const urlDe = (chave: string) => {
    const pronta = valida(chave)
    if (pronta) return Promise.resolve(pronta)
    return new Promise<string>((resolve, reject) => {
      pendentes.push({ chave, resolve, reject })
      if (!agendado) { agendado = true; void Promise.resolve().then(despachar) }
    })
  }

  const buscar: Buscador = async (chave) => {
    const oQue = `baixar ${chave}`
    return comRetentativas(async () => {
      const url = await urlDe(chave)
      const r = await fetchFn(url)
      if (!r.ok) throw new Error(`${oQue}: HTTP ${r.status}`)
      return new Uint8Array(await r.arrayBuffer())
    }).catch((e) => {
      if (e instanceof TypeError) {
        // sem status HTTP após as tentativas = o navegador bloqueou (quase sempre CORS do bucket para esta origem)
        const origem = typeof location !== 'undefined' ? location.origin : 'esta origem'
        throw new Error(`Download do dataset bloqueado pelo navegador para ${origem}: confira a política CORS do bucket R2 (AllowedOrigins precisa incluir ${origem}). Detalhe: ${e.message}`)
      }
      throw e
    })
  }
  buscar.preparar = pedir
  return buscar
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
