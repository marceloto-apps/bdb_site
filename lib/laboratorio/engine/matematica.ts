/**
 * Matemática pura do engine: remoção de margem (4 métodos), distribuições de placar (Poisson,
 * Dixon-Coles, ZIP, binomial negativa), probabilidades de mercado a partir da matriz (inclui
 * linhas de quarto e handicap asiático), RNG determinístico, estatística básica e hash.
 *
 * Reimplementado aqui (e não importado de lib/analytics) para o engine não arrastar `@prisma/client`
 * nem `console.warn` para o Worker; os testes conferem a paridade com lib/analytics.
 */

export const MAX_GOLS = 10

// ────────────────────────────────────────────────────────────────────────────
// Margem
// ────────────────────────────────────────────────────────────────────────────

export type MetodoNovig = 'proportional' | 'power' | 'shin' | 'odds_ratio'

/** Probabilidades sem margem para um conjunto de odds (2 ou 3 resultados). */
export function novig(odds: number[], metodo: MetodoNovig = 'proportional'): number[] {
  if (odds.some((o) => !(o > 1))) return odds.map(() => NaN)
  const imp = odds.map((o) => 1 / o)
  const soma = imp.reduce((a, b) => a + b, 0)
  if (metodo === 'proportional') return imp.map((p) => p / soma)
  if (metodo === 'power') {
    // p_i = imp_i^k com Σ p_i = 1; k por bissecção (k > 1 quando há margem)
    let lo = 0.5, hi = 3
    for (let it = 0; it < 60; it++) {
      const k = (lo + hi) / 2
      const s = imp.reduce((a, p) => a + Math.pow(p, k), 0)
      if (s > 1) lo = k; else hi = k
    }
    const k = (lo + hi) / 2
    return imp.map((p) => Math.pow(p, k))
  }
  if (metodo === 'odds_ratio') {
    // Cheung: p_i = imp_i / (c + imp_i − c·imp_i), c por bissecção
    let lo = 1, hi = 5
    for (let it = 0; it < 60; it++) {
      const c = (lo + hi) / 2
      const s = imp.reduce((a, p) => a + p / (c + p - c * p), 0)
      if (s > 1) lo = c; else hi = c
    }
    const c = (lo + hi) / 2
    return imp.map((p) => p / (c + p - c * p))
  }
  // shin: p_i = (sqrt(z² + 4(1−z)·imp_i²/soma) − z) / (2(1−z)), z por iteração de ponto fixo
  const n = imp.length
  let z = 0
  for (let it = 0; it < 100; it++) {
    const s = imp.reduce((a, p) => a + Math.sqrt(z * z + 4 * (1 - z) * (p * p) / soma), 0)
    const zNovo = (s - 2) / (n - 2 || 1)
    if (n === 2) {
      // com 2 resultados Shin degenera; usa a forma fechada com z = margem²-ajustada (Clarke)
      const zz = ((soma - 1) * (soma - 1)) / (n - 1)
      z = Math.min(Math.max(zz, 0), 0.5)
      break
    }
    if (Math.abs(zNovo - z) < 1e-12) { z = zNovo; break }
    z = Math.max(0, Math.min(zNovo, 0.5))
  }
  const ps = imp.map((p) => (Math.sqrt(z * z + 4 * (1 - z) * (p * p) / soma) - z) / (2 * (1 - z)))
  const sp = ps.reduce((a, b) => a + b, 0)
  return ps.map((p) => p / sp)
}

export const implied = (odd: number): number => (odd > 1 ? 1 / odd : NaN)
export const fairOdd = (p: number): number => (p > 0 && p <= 1 ? 1 / p : NaN)
export const ev = (p: number, odd: number): number => p * odd - 1
export const edge = (p: number, odd: number): number => p - 1 / odd
export const kelly = (p: number, odd: number): number => (odd > 1 ? Math.max(0, (p * odd - 1) / (odd - 1)) : NaN)
export const quarter = (x: number): number => Math.round(x * 4) / 4

// ────────────────────────────────────────────────────────────────────────────
// Distribuições
// ────────────────────────────────────────────────────────────────────────────

const LOG_FAT: number[] = [0]
for (let i = 1; i <= 40; i++) LOG_FAT[i] = LOG_FAT[i - 1] + Math.log(i)

export function poissonPmf(lambda: number, k: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  return Math.exp(-lambda + k * Math.log(lambda) - LOG_FAT[k])
}

export function tauDixonColes(x: number, y: number, lh: number, la: number, rho: number): number {
  if (x === 0 && y === 0) return 1 - lh * la * rho
  if (x === 0 && y === 1) return 1 + lh * rho
  if (x === 1 && y === 0) return 1 + la * rho
  if (x === 1 && y === 1) return 1 - rho
  return 1
}

export function logGamma(z: number): number {
  const g = 7
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  z -= 1
  let x = c[0]
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i)
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

/** Binomial negativa parametrizada por (r, p) com média r(1−p)/p. */
export function nbPmf(k: number, r: number, p: number): number {
  return Math.exp(logGamma(k + r) - logGamma(k + 1) - logGamma(r) + r * Math.log(p) + k * Math.log(1 - p))
}

export function parametrosNB(lambda: number, variancia: number): { r: number; p: number; poisson: boolean } {
  if (!(variancia > lambda * 1.01)) return { r: 0, p: 0, poisson: true }
  const r = (lambda * lambda) / (variancia - lambda)
  return { r, p: r / (r + lambda), poisson: false }
}

export function zipPmf(lambda: number, k: number, pi: number): number {
  const base = poissonPmf(lambda, k)
  return k === 0 ? pi + (1 - pi) * base : (1 - pi) * base
}

export type Matriz = Float64Array // (MAX_GOLS+1)² linear: [h*(MAX+1)+a]
const N = MAX_GOLS + 1

export interface ParametrosMatriz {
  rho?: number
  piH?: number
  piA?: number
  varH?: number
  varA?: number
}

/** Matriz de placares normalizada para o modelo escolhido. */
export function matrizPlacares(modelo: 'POISSON' | 'DC' | 'ZIP' | 'NB', lh: number, la: number, p: ParametrosMatriz = {}): Matriz {
  const m = new Float64Array(N * N)
  const ph = new Float64Array(N), pa = new Float64Array(N)
  if (modelo === 'NB') {
    const nh = parametrosNB(lh, p.varH ?? NaN), na = parametrosNB(la, p.varA ?? NaN)
    for (let k = 0; k < N; k++) {
      ph[k] = nh.poisson ? poissonPmf(lh, k) : nbPmf(k, nh.r, nh.p)
      pa[k] = na.poisson ? poissonPmf(la, k) : nbPmf(k, na.r, na.p)
    }
  } else if (modelo === 'ZIP') {
    const piH = Number.isFinite(p.piH ?? NaN) ? (p.piH as number) : 0
    const piA = Number.isFinite(p.piA ?? NaN) ? (p.piA as number) : 0
    for (let k = 0; k < N; k++) { ph[k] = zipPmf(lh, k, piH); pa[k] = zipPmf(la, k, piA) }
  } else {
    for (let k = 0; k < N; k++) { ph[k] = poissonPmf(lh, k); pa[k] = poissonPmf(la, k) }
  }
  let rho = 0
  if (modelo === 'DC' && Number.isFinite(p.rho ?? NaN)) {
    rho = p.rho as number
    // domínio válido de ρ (Dixon & Coles 1997): mantém as 4 células positivas
    const lo = Math.max(-1 / lh, -1 / la), hi = Math.min(1 / (lh * la), 1)
    rho = Math.max(lo + 1e-6, Math.min(hi - 1e-6, rho))
  }
  let soma = 0
  for (let h = 0; h < N; h++) for (let a = 0; a < N; a++) {
    let v = ph[h] * pa[a]
    if (modelo === 'DC') v *= tauDixonColes(h, a, lh, la, rho)
    if (v < 0) v = 0
    m[h * N + a] = v; soma += v
  }
  if (soma > 0) for (let i = 0; i < m.length; i++) m[i] /= soma
  return m
}

export interface Probs1x2 { h: number; d: number; a: number }

export function prob1x2(m: Matriz): Probs1x2 {
  let h = 0, d = 0, a = 0
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const v = m[i * N + j]
    if (i > j) h += v; else if (i === j) d += v; else a += v
  }
  return { h, d, a }
}

export function probBtts(m: Matriz): number {
  let s = 0
  for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) s += m[i * N + j]
  return s
}

export function probPlacar(m: Matriz, h: number, a: number): number {
  return h >= 0 && h < N && a >= 0 && a < N ? m[h * N + a] : 0
}

/** Distribuição do total de gols e da diferença (h − a) a partir da matriz. */
export function distTotal(m: Matriz): Float64Array {
  const t = new Float64Array(2 * N - 1)
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) t[i + j] += m[i * N + j]
  return t
}
export function distDiferenca(m: Matriz): Float64Array {
  const d = new Float64Array(2 * N - 1) // índice = diff + MAX_GOLS
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) d[i - j + MAX_GOLS] += m[i * N + j]
  return d
}

/**
 * Probabilidade "efetiva" de vencer uma aposta de total (over/under) numa linha qualquer, com
 * devolução tratada como aposta anulada: p = P(ganha) + ½·P(meio ganha) − ... na convenção de
 * valor esperado por unidade: retorna E[resultado]/1 onde WIN=1, HALF_WIN=0.5, REFUND=0 (renormalizado
 * pela parte não devolvida). Devolve {pGanha, pPerde, pDevolve, pMeioGanha, pMeioPerde}.
 */
export interface ProbLinha { win: number; halfWin: number; refund: number; halfLoss: number; loss: number }

export function probLinhaTotal(m: Matriz, linha: number, lado: 'over' | 'under'): ProbLinha {
  const t = distTotal(m)
  return probLinhaSobreDist(t, 0, linha, lado === 'over' ? 'acima' : 'abaixo')
}

/** Handicap asiático: linha é sempre o handicap do MANDANTE (ex.: −0.75). */
export function probLinhaAh(m: Matriz, linha: number, lado: 'home' | 'away'): ProbLinha {
  const d = distDiferenca(m)
  // mandante vence a aposta quando diff + linha > 0; visitante quando diff + linha < 0
  return lado === 'home' ? probLinhaSobreDist(d, -MAX_GOLS, -linha, 'acima') : probLinhaSobreDist(d, -MAX_GOLS, -linha, 'abaixo')
}

/**
 * Distribuição discreta `dist[k]` com valor `k + base`; aposta "valor > L" ('acima') ou "valor < L"
 * ('abaixo'), com meias linhas (.5), inteiras (push) e quartos (dividida em duas).
 */
export function probLinhaSobreDist(dist: Float64Array, base: number, L: number, sentido: 'acima' | 'abaixo'): ProbLinha {
  const q = Math.round(L * 4)
  const simples = (linha: number): { win: number; refund: number; loss: number } => {
    let win = 0, refund = 0, loss = 0
    for (let k = 0; k < dist.length; k++) {
      const v = k + base
      const p = dist[k]
      if (v === linha) refund += p
      else if ((sentido === 'acima' && v > linha) || (sentido === 'abaixo' && v < linha)) win += p
      else loss += p
    }
    return { win, refund, loss }
  }
  if (q % 2 === 0) { // inteira ou meia
    const r = simples(L)
    return { win: r.win, halfWin: 0, refund: r.refund, halfLoss: 0, loss: r.loss }
  }
  // quarto: metade em L−0.25 e metade em L+0.25 → ambas ganham, uma ganha e a outra devolve (meio
  // ganho), uma devolve e a outra perde (meia perda) ou ambas perdem
  const out: ProbLinha = { win: 0, halfWin: 0, refund: 0, halfLoss: 0, loss: 0 }
  for (let k = 0; k < dist.length; k++) {
    const v = k + base, p = dist[k]
    const ra = classificar(v, L - 0.25, sentido), rb = classificar(v, L + 0.25, sentido)
    if (ra === 'win' && rb === 'win') out.win += p
    else if (ra === 'loss' && rb === 'loss') out.loss += p
    else if ((ra === 'win' && rb === 'refund') || (ra === 'refund' && rb === 'win')) out.halfWin += p
    else if ((ra === 'loss' && rb === 'refund') || (ra === 'refund' && rb === 'loss')) out.halfLoss += p
    else out.refund += p
  }
  return out
}

function classificar(v: number, linha: number, sentido: 'acima' | 'abaixo'): 'win' | 'refund' | 'loss' {
  if (v === linha) return 'refund'
  if ((sentido === 'acima' && v > linha) || (sentido === 'abaixo' && v < linha)) return 'win'
  return 'loss'
}

/**
 * Probabilidade de "ganhar" uma aposta com devolução, condicionada a não devolver — mesma
 * convenção do backtest atual (`projProb = pWin/(1 − pRefund)`, com pWin = WIN + HALF_WIN).
 */
export function probEfetiva(p: ProbLinha): number {
  const ativa = 1 - p.refund
  if (ativa <= 0) return NaN
  return (p.win + p.halfWin) / ativa
}

/** Valor esperado por unidade apostada a uma odd `o` dado o perfil de resultados. */
export function evLinha(p: ProbLinha, o: number): number {
  return p.win * (o - 1) + p.halfWin * ((o - 1) / 2) - p.halfLoss * 0.5 - p.loss
}

// ────────────────────────────────────────────────────────────────────────────
// RNG determinístico e estatística
// ────────────────────────────────────────────────────────────────────────────

/** mulberry32 */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function media(xs: ArrayLike<number>): number {
  let s = 0, n = 0
  for (let i = 0; i < xs.length; i++) { const v = xs[i]; if (!Number.isNaN(v)) { s += v; n++ } }
  return n ? s / n : NaN
}

export function desvioPadrao(xs: ArrayLike<number>, amostral = true): number {
  const m = media(xs)
  let s = 0, n = 0
  for (let i = 0; i < xs.length; i++) { const v = xs[i]; if (!Number.isNaN(v)) { s += (v - m) * (v - m); n++ } }
  if (n < 2) return NaN
  return Math.sqrt(s / (amostral ? n - 1 : n))
}

export function quantil(ordenado: ArrayLike<number>, q: number): number {
  const n = ordenado.length
  if (!n) return NaN
  const pos = (n - 1) * q
  const lo = Math.floor(pos), hi = Math.ceil(pos)
  return ordenado[lo] + (ordenado[hi] - ordenado[lo]) * (pos - lo)
}

/** CDF normal padrão (Abramowitz & Stegun 26.2.17, erro < 7.5e-8). */
export function normalCdf(z: number): number {
  if (!Number.isFinite(z)) return z > 0 ? 1 : 0
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989422804014327 * Math.exp(-z * z / 2)
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return z > 0 ? 1 - p : p
}

/** Inverso da CDF normal padrão (Acklam, erro relativo < 1.2e-9). */
export function normalInv(p: number): number {
  if (!(p > 0 && p < 1)) return p <= 0 ? -Infinity : p >= 1 ? Infinity : NaN
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239]
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1]
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416]
  const pl = 0.02425, ph = 1 - pl
  let q: number
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1) }
  if (p > ph) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1) }
  q = p - 0.5; const r = q * q
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

/** p-valor bicaudal de uma estatística t com `gl` graus de liberdade (t → z, Abramowitz-Stegun 26.7.8). */
export function pValorT(t: number, gl: number): number {
  if (!Number.isFinite(t) || gl <= 0) return NaN
  const z = (t * (1 - 1 / (4 * gl))) / Math.sqrt(1 + (t * t) / (2 * gl))
  return 2 * (1 - normalCdf(Math.abs(z)))
}

/** Hash de 64 bits (hex, cyrb53 estendido) — reprodutibilidade dos runs sem depender de crypto. */
export function hash64(texto: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < texto.length; i++) {
    const ch = texto.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')
}
