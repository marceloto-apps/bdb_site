import { gzipSync } from 'node:zlib'
import { NULO_I32, type ChunkHeader, type ColunaHeader } from '@/lib/laboratorio/data/chunk'

/** Codificador de teste espelhando bdb_ingest/src/lib/laboratorio/chunk.ts (formato 1). */
export function codificar(grupo: string, colunas: { nome: string; tipo: string; valores: (number | string | null)[] }[]): Uint8Array {
  const escala = (t: string) => (t === 'odd' ? 1000 : ['prob', 'pct', 'rate', 'ratio'].includes(t) ? 10000 : t === 'line' ? 4 : ['goals', 'xg'].includes(t) ? 1000 : ['count', 'points', 'elo'].includes(t) ? 100 : 1)
  const hdr: ColunaHeader[] = []
  const blobs: Buffer[] = []
  let offset = 0
  const n = colunas[0].valores.length
  for (const c of colunas) {
    const arr = new Int32Array(n)
    let dic: string[] | undefined
    let naoNulos = 0
    if (c.tipo === 'id' || c.tipo === 'text') {
      dic = []
      for (let i = 0; i < n; i++) { const v = c.valores[i]; if (v === null) { arr[i] = NULO_I32; continue } let k = dic.indexOf(String(v)); if (k < 0) { k = dic.length; dic.push(String(v)) } arr[i] = k; naoNulos++ }
    } else if (c.tipo === 'date') {
      for (let i = 0; i < n; i++) { const v = c.valores[i]; if (v === null) { arr[i] = NULO_I32; continue } arr[i] = Math.round(new Date(v as string).getTime() / 60000); naoNulos++ }
    } else {
      const e = escala(c.tipo)
      for (let i = 0; i < n; i++) { const v = c.valores[i]; if (v === null) { arr[i] = NULO_I32; continue } arr[i] = Math.round((v as number) * e); naoNulos++ }
    }
    if (naoNulos === 0) continue
    const gz = gzipSync(Buffer.from(arr.buffer))
    hdr.push({ nome: c.nome, tipo: c.tipo, escala: escala(c.tipo), offset, tamanho: gz.length, n, dicionario: dic, naoNulos })
    blobs.push(gz); offset += gz.length
  }
  const header: ChunkHeader = { formato: 1, grupo, linhas: n, colunas: hdr }
  const hb = Buffer.from(JSON.stringify(header))
  const len = Buffer.alloc(4); len.writeUInt32LE(hb.length)
  return new Uint8Array(Buffer.concat([len, hb, ...blobs]))
}

