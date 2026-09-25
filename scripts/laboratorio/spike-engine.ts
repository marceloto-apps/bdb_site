/**
 * Fase 0 — spike de desempenho do engine do Backtest Livre.
 * docs/Backtest_Livre_Plano.md §5.3 (metas) e §8 (Fase 0).
 *
 * Mede, com dados sintéticos do tamanho real (55.496 jogos), num worker_thread (V8, o mesmo motor
 * do Chrome/Edge):
 *   1. tamanho do chunk colunar (Float32 vs Int32 escalado) bruto e comprimido (gzip)
 *   2. decodificação preguiçosa de N colunas referenciadas vs decodificação total
 *   3. avaliação vetorizada de uma regra compilada (AST → closure)
 *   4. liquidação + curva + drawdown
 *   5. bootstrap em blocos (2.000 reamostras) e Monte Carlo (2.000 caminhos)
 *   6. varredura de 200 combinações de parâmetros
 *
 * Uso: npx tsx scripts/laboratorio/spike-engine.ts [linhas] [colunas]
 */
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import { gzipSync, gunzipSync } from 'zlib'

// ────────────────────────────────────────────────────────────────────────────
// Formato de chunk (protótipo): header JSON + blobs gzip por coluna
// ────────────────────────────────────────────────────────────────────────────

interface ColunaHeader { nome: string; tipo: 'f32' | 'i32'; escala: number; offset: number; tamanho: number; n: number }
interface ChunkHeader { linhas: number; colunas: ColunaHeader[] }

function codificarChunk(nomes: string[], colunas: (Float32Array | Int32Array)[], escalas: number[]): { buffer: Buffer; header: ChunkHeader; bruto: number } {
  const blobs: Buffer[] = []
  const hdr: ColunaHeader[] = []
  let offset = 0
  let bruto = 0
  for (let i = 0; i < colunas.length; i++) {
    const col = colunas[i]
    const raw = Buffer.from(col.buffer, col.byteOffset, col.byteLength)
    bruto += raw.length
    const gz = gzipSync(raw, { level: 6 })
    hdr.push({ nome: nomes[i], tipo: col instanceof Float32Array ? 'f32' : 'i32', escala: escalas[i], offset, tamanho: gz.length, n: col.length })
    blobs.push(gz)
    offset += gz.length
  }
  const header: ChunkHeader = { linhas: colunas[0].length, colunas: hdr }
  const headerBuf = Buffer.from(JSON.stringify(header))
  const len = Buffer.alloc(4)
  len.writeUInt32LE(headerBuf.length)
  return { buffer: Buffer.concat([len, headerBuf, ...blobs]), header, bruto }
}

function lerHeader(buf: Buffer): { header: ChunkHeader; base: number } {
  const hlen = buf.readUInt32LE(0)
  const header = JSON.parse(buf.subarray(4, 4 + hlen).toString()) as ChunkHeader
  return { header, base: 4 + hlen }
}

function decodificarColuna(buf: Buffer, base: number, col: ColunaHeader): Float64Array {
  const raw = gunzipSync(buf.subarray(base + col.offset, base + col.offset + col.tamanho))
  const out = new Float64Array(col.n)
  if (col.tipo === 'f32') {
    const f = new Float32Array(raw.buffer, raw.byteOffset, col.n)
    for (let i = 0; i < col.n; i++) out[i] = f[i]
  } else {
    const v = new Int32Array(raw.buffer, raw.byteOffset, col.n)
    const s = col.escala
    for (let i = 0; i < col.n; i++) out[i] = v[i] === -2147483648 ? NaN : v[i] / s
  }
  return out
}

// ────────────────────────────────────────────────────────────────────────────
// Dados sintéticos com aparência real (odds ~ 1.2–12 com 2 casas, taxas 0–1, contagens)
// ────────────────────────────────────────────────────────────────────────────

function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

type Perfil = { tipo: 'odd' | 'prob' | 'count' | 'rate' | 'line'; nulos: number }

function gerarColuna(n: number, perfil: Perfil, r: () => number, modo: 'f32' | 'i32'): { col: Float32Array | Int32Array; escala: number } {
  const escala = perfil.tipo === 'odd' ? 100 : perfil.tipo === 'prob' || perfil.tipo === 'rate' ? 10000 : perfil.tipo === 'line' ? 4 : 100
  const vals = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    if (r() < perfil.nulos) { vals[i] = NaN; continue }
    switch (perfil.tipo) {
      case 'odd': vals[i] = Math.round((1.2 + Math.exp(r() * 2.3) - 1) * 100) / 100; break
      case 'prob': vals[i] = Math.round(r() * 10000) / 10000; break
      case 'rate': vals[i] = Math.round((r() * 3) * 100) / 100; break
      case 'line': vals[i] = Math.round(r() * 16) / 4; break
      case 'count': vals[i] = Math.floor(r() * 25); break
    }
  }
  if (modo === 'f32') return { col: Float32Array.from(vals), escala: 1 }
  const out = new Int32Array(n)
  for (let i = 0; i < n; i++) out[i] = Number.isNaN(vals[i]) ? -2147483648 : Math.round(vals[i] * escala)
  return { col: out, escala }
}

function gerarDataset(linhas: number, colunas: number, modo: 'f32' | 'i32', ausentes = 0.3) {
  const r = rng(42)
  const nomes: string[] = []
  const cols: (Float32Array | Int32Array)[] = []
  const escalas: number[] = []
  const perfis: Perfil['tipo'][] = ['odd', 'odd', 'prob', 'rate', 'rate', 'count', 'line']
  for (let j = 0; j < colunas; j++) {
    // as 10 primeiras são o "núcleo" sempre presente (odds/stats básicas); as demais têm 30% de chance de faltar na liga
    if (j >= 10 && r() < ausentes) continue // coluna ausente nesta liga: não ocupa espaço
    const tipo = perfis[j % perfis.length]
    const { col, escala } = gerarColuna(linhas, { tipo, nulos: 0.08 }, r, modo)
    nomes.push(`c${j}`)
    cols.push(col)
    escalas.push(escala)
  }
  return { nomes, cols, escalas }
}

// ────────────────────────────────────────────────────────────────────────────
// Mini engine: AST → closure vetorizada, liquidação, métricas
// ────────────────────────────────────────────────────────────────────────────

type No =
  | { t: 'num'; v: number }
  | { t: 'param'; nome: string }
  | { t: 'col'; nome: string }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '>' | '<' | '>=' | '<=' | 'and' | 'or'; a: No; b: No }
  | { t: 'fn'; nome: 'implied' | 'abs'; args: No[] }

function compilar(no: No, cols: Map<string, Float64Array>, params: Record<string, number>): (i: number) => number {
  switch (no.t) {
    case 'num': { const v = no.v; return () => v }
    case 'param': { const v = params[no.nome]; return () => v }
    case 'col': { const c = cols.get(no.nome); if (!c) throw new Error(`coluna ${no.nome}`); return (i) => c[i] }
    case 'fn': {
      const a = compilar(no.args[0], cols, params)
      if (no.nome === 'implied') return (i) => 1 / a(i)
      return (i) => Math.abs(a(i))
    }
    case 'bin': {
      const a = compilar(no.a, cols, params)
      const b = compilar(no.b, cols, params)
      switch (no.op) {
        case '+': return (i) => a(i) + b(i)
        case '-': return (i) => a(i) - b(i)
        case '*': return (i) => a(i) * b(i)
        case '/': return (i) => a(i) / b(i)
        case '>': return (i) => (a(i) > b(i) ? 1 : 0)
        case '<': return (i) => (a(i) < b(i) ? 1 : 0)
        case '>=': return (i) => (a(i) >= b(i) ? 1 : 0)
        case '<=': return (i) => (a(i) <= b(i) ? 1 : 0)
        case 'and': return (i) => (a(i) && b(i) ? 1 : 0)
        case 'or': return (i) => (a(i) || b(i) ? 1 : 0)
      }
    }
  }
}

// edge = odd_bet365_open × novig_pinnacle_close − 1 > $p1  and  xg_home_l10 >= $p2  and  close/open < 0.93
const REGRA: No = {
  t: 'bin', op: 'and',
  a: {
    t: 'bin', op: 'and',
    a: { t: 'bin', op: '>', a: { t: 'bin', op: '-', a: { t: 'bin', op: '*', a: { t: 'col', nome: 'c0' }, b: { t: 'col', nome: 'c2' } }, b: { t: 'num', v: 1 } }, b: { t: 'param', nome: 'p1' } },
    b: { t: 'bin', op: '>=', a: { t: 'col', nome: 'c3' }, b: { t: 'param', nome: 'p2' } },
  },
  b: { t: 'bin', op: '<', a: { t: 'bin', op: '/', a: { t: 'col', nome: 'c1' }, b: { t: 'col', nome: 'c8' } }, b: { t: 'num', v: 1.3 } },
}

function colunasReferenciadas(no: No, acc = new Set<string>()): Set<string> {
  if (no.t === 'col') acc.add(no.nome)
  else if (no.t === 'bin') { colunasReferenciadas(no.a, acc); colunasReferenciadas(no.b, acc) }
  else if (no.t === 'fn') no.args.forEach((a) => colunasReferenciadas(a, acc))
  return acc
}

function avaliarMascara(fn: (i: number) => number, n: number): Uint8Array {
  const m = new Uint8Array(n)
  for (let i = 0; i < n; i++) m[i] = fn(i) ? 1 : 0
  return m
}

function liquidar(mask: Uint8Array, odd: Float64Array, r: () => number) {
  // outcome sintético: vence com prob ≈ 1/odd (mercado justo)
  const idx: number[] = []
  for (let i = 0; i < mask.length; i++) if (mask[i] && !Number.isNaN(odd[i])) idx.push(i)
  const pnl = new Float64Array(idx.length)
  const dia = new Int32Array(idx.length)
  for (let k = 0; k < idx.length; k++) {
    const o = odd[idx[k]]
    pnl[k] = r() < 1 / o ? o - 1 : -1
    dia[k] = idx[k] >> 4 // ~16 jogos por "dia"
  }
  return { pnl, dia, n: idx.length }
}

function metricas(pnl: Float64Array) {
  let cum = 0, pico = 0, mdd = 0, soma = 0
  for (let i = 0; i < pnl.length; i++) {
    soma += pnl[i]
    cum += pnl[i]
    if (cum > pico) pico = cum
    const dd = pico - cum
    if (dd > mdd) mdd = dd
  }
  return { lucro: soma, yield: pnl.length ? soma / pnl.length : 0, mdd }
}

function bootstrapBlocos(pnl: Float64Array, dia: Int32Array, reamostras: number, r: () => number) {
  // blocos = dias; reamostra dias com reposição
  const porDia = new Map<number, number[]>()
  for (let i = 0; i < pnl.length; i++) {
    let a = porDia.get(dia[i]); if (!a) { a = []; porDia.set(dia[i], a) }
    a.push(i)
  }
  const dias = Array.from(porDia.values())
  const yields = new Float64Array(reamostras)
  for (let b = 0; b < reamostras; b++) {
    let soma = 0, n = 0
    for (let d = 0; d < dias.length; d++) {
      const bloco = dias[Math.floor(r() * dias.length)]
      for (let k = 0; k < bloco.length; k++) { soma += pnl[bloco[k]]; n++ }
    }
    yields[b] = soma / n
  }
  const s = Array.from(yields).sort((x, y) => x - y)
  return { ic95: [s[Math.floor(0.025 * reamostras)], s[Math.floor(0.975 * reamostras)]] }
}

function monteCarlo(odds: Float64Array, caminhos: number, r: () => number) {
  const mdds = new Float64Array(caminhos)
  for (let p = 0; p < caminhos; p++) {
    let cum = 0, pico = 0, mdd = 0
    for (let i = 0; i < odds.length; i++) {
      cum += r() < 1 / odds[i] ? odds[i] - 1 : -1
      if (cum > pico) pico = cum
      const dd = pico - cum
      if (dd > mdd) mdd = dd
    }
    mdds[p] = mdd
  }
  const s = Array.from(mdds).sort((x, y) => x - y)
  return { mddP50: s[Math.floor(0.5 * caminhos)], mddP95: s[Math.floor(0.95 * caminhos)] }
}

// ────────────────────────────────────────────────────────────────────────────
// Worker
// ────────────────────────────────────────────────────────────────────────────

const ms = (t: bigint) => Number(process.hrtime.bigint() - t) / 1e6

function rodarWorker(buffer: Buffer, modo: string) {
  const res: Record<string, number | string> = { modo }
  let t = process.hrtime.bigint()
  const { header, base } = lerHeader(buffer)
  res.headerMs = +ms(t).toFixed(1)

  // decodificação preguiçosa: só as colunas da regra + odd de liquidação
  const refs = colunasReferenciadas(REGRA)
  refs.add('c0')
  t = process.hrtime.bigint()
  const cols = new Map<string, Float64Array>()
  for (const nome of Array.from(refs)) {
    const ch = header.colunas.find((c) => c.nome === nome)
    if (ch) cols.set(nome, decodificarColuna(buffer, base, ch))
  }
  res.decodePreguicosaMs = +ms(t).toFixed(1)
  res.colunasDecodificadas = cols.size

  // decodificação total (pior caso)
  t = process.hrtime.bigint()
  let tot = 0
  for (const ch of header.colunas) tot += decodificarColuna(buffer, base, ch).length
  res.decodeTotalMs = +ms(t).toFixed(1)
  res.colunasTotais = header.colunas.length
  res.valoresDecodificados = tot

  // regra 1×
  const params = { p1: 0.02, p2: 1.4 }
  t = process.hrtime.bigint()
  const fn = compilar(REGRA, cols, params)
  const mask = avaliarMascara(fn, header.linhas)
  res.regraMs = +ms(t).toFixed(2)
  let sel = 0
  for (let i = 0; i < mask.length; i++) sel += mask[i]
  res.selecionados = sel

  // liquidação + métricas
  const r = rng(7)
  t = process.hrtime.bigint()
  const liq = liquidar(mask, cols.get('c0')!, r)
  const met = metricas(liq.pnl)
  res.liquidacaoMs = +ms(t).toFixed(2)
  res.apostas = liq.n
  res.yield = +met.yield.toFixed(4)

  // bootstrap 2000
  t = process.hrtime.bigint()
  bootstrapBlocos(liq.pnl, liq.dia, 2000, r)
  res.bootstrap2000Ms = +ms(t).toFixed(0)

  // monte carlo 2000
  const oddsSel = new Float64Array(liq.n)
  { let k = 0; const o = cols.get('c0')!; for (let i = 0; i < mask.length; i++) if (mask[i] && !Number.isNaN(o[i])) oddsSel[k++] = o[i] }
  t = process.hrtime.bigint()
  monteCarlo(oddsSel, 2000, r)
  res.monteCarlo2000Ms = +ms(t).toFixed(0)

  // varredura 200 combinações (regra + liquidação + métricas)
  t = process.hrtime.bigint()
  let combos = 0
  for (let a = 0; a < 20; a++) for (let b = 0; b < 10; b++) {
    const f = compilar(REGRA, cols, { p1: -0.05 + a * 0.01, p2: 0.8 + b * 0.1 })
    const m = avaliarMascara(f, header.linhas)
    metricas(liquidar(m, cols.get('c0')!, r).pnl)
    combos++
  }
  res.varredura200Ms = +ms(t).toFixed(0)
  res.combos = combos
  return res
}

if (!isMainThread) {
  const { buffer, modo } = workerData as { buffer: ArrayBuffer; modo: string }
  parentPort!.postMessage(rodarWorker(Buffer.from(buffer), modo))
} else {
  const linhas = Number(process.argv[2] ?? 55496)
  const colunas = Number(process.argv[3] ?? 1300)
  ;(async () => {
    console.log(`Spike engine — ${linhas.toLocaleString('pt-BR')} linhas × ${colunas} colunas de catálogo (30% ausentes por liga)`)
    const resultados: Record<string, unknown>[] = []
    for (const modo of ['f32', 'i32'] as const) {
      let t = process.hrtime.bigint()
      const ds = gerarDataset(linhas, colunas, modo)
      const geracaoMs = ms(t)
      t = process.hrtime.bigint()
      const { buffer, bruto } = codificarChunk(ds.nomes, ds.cols, ds.escalas)
      const encodeMs = ms(t)
      const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      const worker = new Worker(__filename, { workerData: { buffer: ab, modo }, execArgv: process.execArgv })
      const r = await new Promise<Record<string, number | string>>((res, rej) => { worker.once('message', res); worker.once('error', rej) })
      resultados.push({
        modo,
        colunasPresentes: ds.cols.length,
        brutoMB: +(bruto / 1048576).toFixed(1),
        gzipMB: +(buffer.length / 1048576).toFixed(1),
        bytesPorLinhaGz: Math.round(buffer.length / linhas),
        geracaoMs: Math.round(geracaoMs),
        encodeMs: Math.round(encodeMs),
        ...r,
      })
    }
    console.table(resultados)
    // extrapolação: 10 ligas × 3 temporadas ≈ 380 jogos cada → 11.400 linhas
    for (const r of resultados) {
      const bpl = r.bytesPorLinhaGz as number
      console.log(`${r.modo}: universo típico (11.400 jogos) ≈ ${(bpl * 11400 / 1048576).toFixed(1)} MB gz · núcleo (55 k) ≈ ${(bpl * 55496 / 1048576).toFixed(1)} MB · universo completo com FPT (300 k) ≈ ${(bpl * 300000 / 1048576).toFixed(0)} MB`)
    }
  })().catch((e) => { console.error(e); process.exit(1) })
}
