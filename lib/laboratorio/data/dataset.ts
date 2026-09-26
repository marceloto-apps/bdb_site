/**
 * Montagem do `Dataset` em memória a partir do manifesto e dos chunks (só os grupos e colunas que
 * a estratégia referencia). Independente de onde os bytes vêm: recebe um `Buscador` (URL assinada
 * no navegador, disco ou R2 em Node).
 */
import type { Dataset, Universo } from '../engine/tipos'
import { decodificarGrupo, gruposDosCampos, type ColunaDecodificada } from './chunk'

export interface ManifestChunk {
  competitionKey: string
  seasonKey: string
  seasonLabel: string
  dir: string
  linhas: number
  de: string
  ate: string
  grupos: Record<string, { arquivo: string; bytes: number; hash: string; colunas: number }>
}

export interface ManifestCompeticao {
  key: string
  nome: string
  pais: string
  nivel: number | null
  tipo: string
  slug?: string
  soFpt: boolean
  incluidaPorPadrao: boolean
  feminino: boolean
  linhas: number
  cobertura?: Record<string, number>
}

export interface Manifest {
  versao: string
  formato: number
  catalogoVersao: string
  builderVersao: string
  geradoEm: string
  competicoes: ManifestCompeticao[]
  chunks: ManifestChunk[]
  aliases: Record<string, string>
  times: Record<string, string>
  totalLinhas: number
}

/** Busca os bytes de uma chave do dataset (`<versao>/<dir>/<grupo>.bin`). */
export type Buscador = (chave: string) => Promise<Uint8Array>

export interface OpcoesCarga {
  manifest: Manifest
  campos: Iterable<string>
  /** filtro de chunks (padrão: todos) */
  filtro?: (c: ManifestChunk) => boolean
  buscar: Buscador
  paralelo?: number
  aoProgresso?: (feitos: number, total: number) => void
}

export interface DatasetCarregado {
  dataset: Dataset
  /** grupos×chunks pedidos que não existem no manifesto (chunk esparso) */
  gruposAusentes: number
  /** campos pedidos que não apareceram em nenhum chunk */
  camposAusentes: string[]
  bytes: number
  chunks: number
}

/**
 * Normaliza as competições do universo: slug do núcleo → chave (`Competition.id`), chave FPT crua
 * → `fpt:<rawLeague>`, e aliases D12 (chave antiga → chave nova do núcleo).
 */
export function resolverAliases(u: Universo | undefined, manifest: Pick<Manifest, 'aliases' | 'competicoes'>): Universo | undefined {
  if (!u?.competicoes?.length) return u
  const aliases = manifest.aliases ?? {}
  const porSlug = new Map<string, string>()
  const chaves = new Set<string>()
  for (const c of manifest.competicoes ?? []) { chaves.add(c.key); if (c.slug) porSlug.set(c.slug, c.key) }
  const normalizar = (c: string): string => {
    if (aliases[c]) return aliases[c]
    if (chaves.has(c)) return c
    const s = porSlug.get(c); if (s) return s
    if (chaves.has(`fpt:${c}`)) return `fpt:${c}`
    return c
  }
  return { ...u, competicoes: Array.from(new Set(u.competicoes.map(normalizar))) }
}

/** Chunks que o universo pode tocar (competição, temporada e sobreposição de datas). */
export function filtroDoUniverso(u: Universo | undefined, manifest: Manifest): (c: ManifestChunk) => boolean {
  const ua = resolverAliases(u, manifest)
  const comps = ua?.competicoes?.length ? new Set(ua.competicoes) : null
  const seasons = ua?.temporadas?.length ? new Set(ua.temporadas) : null
  const labels = ua?.temporadasLabel?.length ? new Set(ua.temporadasLabel) : null
  const excluidas = ua?.temporadasExcluidas?.length ? new Set(ua.temporadasExcluidas) : null
  const de = ua?.de ? Date.parse(ua.de) : NaN
  const ate = ua?.ate ? Date.parse(ua.ate.length <= 10 ? `${ua.ate}T23:59:59.999Z` : ua.ate) : NaN
  const fem = new Set(manifest.competicoes.filter((c) => c.feminino).map((c) => c.key))
  const tipos = ua?.tipos?.length ? new Map(manifest.competicoes.map((c) => [c.key, c.tipo])) : null
  const tiposOk = ua?.tipos?.length ? new Set(ua.tipos as string[]) : null
  return (c) => {
    if (comps && !comps.has(c.competitionKey)) return false
    if (seasons && !seasons.has(c.seasonKey)) return false
    if (labels && !labels.has(c.seasonLabel)) return false
    if (excluidas && excluidas.has(c.seasonKey)) return false
    if (fem.has(c.competitionKey)) return false
    if (tipos && tiposOk && !tiposOk.has(tipos.get(c.competitionKey) ?? '')) return false
    if (!Number.isNaN(de) && Date.parse(c.ate) < de) return false
    if (!Number.isNaN(ate) && Date.parse(c.de) > ate) return false
    return true
  }
}

export async function carregarDataset(op: OpcoesCarga): Promise<DatasetCarregado> {
  const { manifest } = op
  const chunks = manifest.chunks.filter(op.filtro ?? (() => true))
  const porGrupo = gruposDosCampos(op.campos)
  const pedidos = new Set(op.campos)
  const tarefas: { chunk: ManifestChunk; grupo: string; colunas: Set<string> }[] = []
  let gruposAusentes = 0
  for (const c of chunks) for (const [g, cols] of Array.from(porGrupo)) {
    if (c.grupos[g]) tarefas.push({ chunk: c, grupo: g, colunas: cols }); else gruposAusentes++
  }
  const total = tarefas.length
  let feitos = 0, bytes = 0
  const resultados = new Map<string, Map<string, ColunaDecodificada>>() // `${dir}|${grupo}`
  const paralelo = Math.max(1, op.paralelo ?? 6)
  let k = 0
  const worker = async () => {
    for (;;) {
      const t = tarefas[k++]
      if (!t) return
      const chave = `${manifest.versao}/${t.chunk.dir}/${t.chunk.grupos[t.grupo].arquivo}`
      const buf = await op.buscar(chave)
      bytes += buf.length
      const { header, colunas } = await decodificarGrupo(buf, t.colunas)
      if (header.linhas !== t.chunk.linhas) throw new Error(`Chunk ${chave}: ${header.linhas} linhas no arquivo, ${t.chunk.linhas} no manifesto`)
      resultados.set(`${t.chunk.dir}|${t.grupo}`, colunas)
      op.aoProgresso?.(++feitos, total)
    }
  }
  await Promise.all(Array.from({ length: Math.min(paralelo, total) }, worker))

  // concatena por chunk, na ordem do manifesto
  const n = chunks.reduce((s, c) => s + c.linhas, 0)
  const numericas = new Map<string, Float64Array>()
  const textos = new Map<string, (string | null)[]>()
  const vistos = new Set<string>()
  let offset = 0
  for (const c of chunks) {
    for (const [g, cols] of Array.from(porGrupo)) {
      const dec = resultados.get(`${c.dir}|${g}`)
      if (!dec) continue
      for (const nome of Array.from(cols)) {
        const col = dec.get(nome)
        if (!col) continue
        vistos.add(nome)
        if (col.tipo === 'num') {
          let alvo = numericas.get(nome)
          if (!alvo) { alvo = new Float64Array(n).fill(NaN); numericas.set(nome, alvo) }
          alvo.set(col.valores, offset)
        } else {
          let alvo = textos.get(nome)
          if (!alvo) { alvo = new Array<string | null>(n).fill(null); textos.set(nome, alvo) }
          for (let i = 0; i < col.valores.length; i++) alvo[offset + i] = col.valores[i]
        }
      }
    }
    offset += c.linhas
  }
  const camposAusentes = Array.from(pedidos).filter((p) => !vistos.has(p))
  return { dataset: { n, numericas, textos, versao: manifest.versao, catalogoVersao: manifest.catalogoVersao }, gruposAusentes, camposAusentes, bytes, chunks: chunks.length }
}

/** Mapa competição → info (tipo, feminino) e nomes, para o run. */
export function infoCompeticoes(manifest: Manifest): { info: Map<string, { tipo?: string; feminino?: boolean }>; nomes: Map<string, string> } {
  const info = new Map<string, { tipo?: string; feminino?: boolean }>()
  const nomes = new Map<string, string>()
  for (const c of manifest.competicoes) { info.set(c.key, { tipo: c.tipo, feminino: c.feminino }); nomes.set(c.key, c.nome) }
  return { info, nomes }
}

/** Última temporada de cada competição no manifesto (holdout selado, §6.6): competição → chave da temporada. */
export function temporadasHoldout(manifest: Pick<Manifest, 'chunks'>): Map<string, string> {
  const ultima = new Map<string, { seasonKey: string; ate: string }>()
  for (const c of manifest.chunks) {
    const atual = ultima.get(c.competitionKey)
    if (!atual || c.ate > atual.ate || (c.ate === atual.ate && c.seasonKey > atual.seasonKey)) ultima.set(c.competitionKey, { seasonKey: c.seasonKey, ate: c.ate })
  }
  return new Map(Array.from(ultima.entries()).map(([k, v]) => [k, v.seasonKey]))
}

export interface HoldoutResolvido {
  universo: Universo | undefined
  holdout: { temporadas: Map<string, string>; jogosOcultos: number | null }
}

/**
 * Aplica o holdout da estratégia ao universo (já com aliases resolvidos): quando selado, exclui a
 * última temporada de cada competição e conta os jogos deixados de fora (pelos chunks do manifesto).
 */
export function aplicarHoldout(universo: Universo | undefined, modo: 'selado' | 'aberto' | undefined, manifest: Manifest): HoldoutResolvido {
  const temporadas = temporadasHoldout(manifest)
  if (modo !== 'selado') return { universo, holdout: { temporadas, jogosOcultos: null } }
  const chaves = new Set(temporadas.values())
  const passa = filtroDoUniverso(universo, manifest)
  let jogosOcultos = 0
  for (const c of manifest.chunks) if (chaves.has(c.seasonKey) && passa(c)) jogosOcultos += c.linhas
  return { universo: { ...(universo ?? {}), temporadasExcluidas: Array.from(chaves) }, holdout: { temporadas, jogosOcultos } }
}
