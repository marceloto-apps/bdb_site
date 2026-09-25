/**
 * Leitor dos chunks da feature store (formato 1, bdb_ingest/src/lib/laboratorio/chunk.ts):
 * `[u32 LE tamanho do header][header JSON][bloco gzip por coluna...]`, valores Int32 escalados
 * (sentinela para nulo), dicionário para id/text, data em minutos epoch.
 *
 * Funciona no navegador (DecompressionStream) e em Node (zlib), sem dependências. Só as colunas
 * pedidas são descomprimidas.
 */

export const NULO_I32 = -2147483648
export const FORMATO_CHUNK = 1

export interface ColunaHeader {
  nome: string
  tipo: string
  escala: number
  offset: number
  tamanho: number
  n: number
  dicionario?: string[]
  naoNulos: number
}

export interface ChunkHeader {
  formato: number
  grupo: string
  linhas: number
  colunas: ColunaHeader[]
}

export type ColunaDecodificada =
  | { tipo: 'num'; valores: Float64Array }
  | { tipo: 'txt'; valores: (string | null)[] }

export const TIPOS_TEXTO = new Set(['id', 'text'])

export function lerHeader(buf: Uint8Array): { header: ChunkHeader; base: number } {
  if (buf.length < 4) throw new Error('Chunk truncado')
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  const hlen = dv.getUint32(0, true)
  if (4 + hlen > buf.length) throw new Error('Chunk truncado (header)')
  const header = JSON.parse(new TextDecoder().decode(buf.subarray(4, 4 + hlen))) as ChunkHeader
  if (header.formato !== FORMATO_CHUNK) throw new Error(`Formato de chunk não suportado: ${header.formato}`)
  return { header, base: 4 + hlen }
}

type Gunzip = (dados: Uint8Array) => Promise<Uint8Array>

let gunzipImpl: Gunzip | null = null

/** gunzip nativo: DecompressionStream no navegador/Node ≥ 18, zlib em Node como fallback. */
export async function gunzip(dados: Uint8Array): Promise<Uint8Array> {
  if (!gunzipImpl) {
    if (typeof DecompressionStream !== 'undefined') {
      gunzipImpl = async (d) => {
        const ds = new DecompressionStream('gzip')
        const w = ds.writable.getWriter()
        void w.write(d as Uint8Array<ArrayBuffer>).then(() => w.close())
        const partes: Uint8Array[] = []
        const r = ds.readable.getReader()
        let total = 0
        for (;;) { const { value, done } = await r.read(); if (done) break; partes.push(value); total += value.length }
        const out = new Uint8Array(total)
        let o = 0
        for (const p of partes) { out.set(p, o); o += p.length }
        return out
      }
    } else {
      // só em Node sem DecompressionStream; o webpack não deve tentar resolver no bundle do navegador
      const zlib = await import(/* webpackIgnore: true */ 'node:zlib')
      gunzipImpl = async (d) => new Uint8Array(zlib.gunzipSync(d))
    }
  }
  return gunzipImpl(dados)
}

/** Decodifica uma coluna a partir do bloco gzip já descomprimido. */
export function decodificarValores(raw: Uint8Array, col: ColunaHeader): ColunaDecodificada {
  const n = col.n
  // alinhamento: Int32Array exige offset múltiplo de 4
  const arr = raw.byteOffset % 4 === 0 && raw.byteLength >= n * 4
    ? new Int32Array(raw.buffer, raw.byteOffset, n)
    : new Int32Array(raw.slice(0, n * 4).buffer)
  if (col.dicionario) {
    const out: (string | null)[] = new Array(n)
    for (let i = 0; i < n; i++) { const v = arr[i]; out[i] = v === NULO_I32 ? null : col.dicionario[v] ?? null }
    return { tipo: 'txt', valores: out }
  }
  const out = new Float64Array(n)
  if (col.tipo === 'date') { for (let i = 0; i < n; i++) { const v = arr[i]; out[i] = v === NULO_I32 ? NaN : v * 60000 } }
  else { const e = col.escala || 1; for (let i = 0; i < n; i++) { const v = arr[i]; out[i] = v === NULO_I32 ? NaN : v / e } }
  return { tipo: 'num', valores: out }
}

export async function decodificarColuna(buf: Uint8Array, base: number, col: ColunaHeader): Promise<ColunaDecodificada> {
  const raw = await gunzip(buf.subarray(base + col.offset, base + col.offset + col.tamanho))
  return decodificarValores(raw, col)
}

/**
 * Decodifica as colunas pedidas de um grupo (todas quando `colunas` é omitido). Colunas pedidas
 * que não existem no chunk (esparsas) simplesmente não aparecem no resultado.
 */
export async function decodificarGrupo(buf: Uint8Array, colunas?: Iterable<string>): Promise<{ header: ChunkHeader; colunas: Map<string, ColunaDecodificada> }> {
  const { header, base } = lerHeader(buf)
  const pedidas = colunas ? new Set(colunas) : null
  const out = new Map<string, ColunaDecodificada>()
  const alvo = header.colunas.filter((c) => !pedidas || pedidas.has(c.nome))
  const decodificadas = await Promise.all(alvo.map((c) => decodificarColuna(buf, base, c)))
  alvo.forEach((c, k) => out.set(c.nome, decodificadas[k]))
  return { header, colunas: out }
}

// ────────────────────────────────────────────────────────────────────────────
// Grupos (mesma convenção do builder: §4.3 do plano)
// ────────────────────────────────────────────────────────────────────────────

const JANELAS = ['l5', 'l10', 'l20', 'season']

export function grupoDoCampo(key: string): string {
  const p = key.split('.')
  const b = p[0]
  if (b === 'match' || b === 'league') return 'match'
  if (b === 'derived') return 'derived'
  if (b === 'odds') return `odds.${p[1]}.${p[2]}`
  if (b === 'home' || b === 'away') {
    if (p[1] === 'venue' && JANELAS.includes(p[2])) return `team.${b}.venue.${p[2]}`
    if (JANELAS.includes(p[1])) return `team.${b}.${p[1]}`
    return `team.${b}.extra`
  }
  throw new Error(`Campo fora da convenção de grupos: ${key}`)
}

/** Agrupa campos por grupo de colunas (para saber quais arquivos baixar). */
export function gruposDosCampos(campos: Iterable<string>): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  for (const k of Array.from(campos)) { const g = grupoDoCampo(k); let s = out.get(g); if (!s) { s = new Set(); out.set(g, s) } s.add(k) }
  return out
}
