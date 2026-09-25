/**
 * Métricas núcleo (§6.1–6.5): resultado, caminho/risco, esperado × real e CLV, inferência básica
 * (t, p-valor, z de Buchdahl, bootstrap em blocos por dia) e segmentação.
 * Todas as funções recebem a lista de apostas já em ordem cronológica.
 */
import * as M from './matematica'
import type { Aposta, Caminho, Clv, Drawdown, Inferencia, Kpis, Segmento } from './tipos'

const r4 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1e4) / 1e4 : x)

// ────────────────────────────────────────────────────────────────────────────
// 6.1 Resultado
// ────────────────────────────────────────────────────────────────────────────

export function calcularKpis(apostas: Aposta[], bancoInicial: number, unidadeFlat: number): Kpis {
  let turnover = 0, lucro = 0, wins = 0, halfWins = 0, refunds = 0, halfLosses = 0, losses = 0, voids = 0
  let somaOdd = 0, somaOddPond = 0, nOdd = 0, ganhos = 0, perdas = 0, lucroFlat = 0, nFlat = 0
  for (const a of apostas) {
    switch (a.resultado) {
      case 'WIN': wins++; break
      case 'HALF_WIN': halfWins++; break
      case 'REFUND': refunds++; break
      case 'HALF_LOSS': halfLosses++; break
      case 'LOSS': losses++; break
      case 'VOID': voids++; continue
    }
    turnover += a.stake
    lucro += a.pnl
    somaOdd += a.odd; somaOddPond += a.odd * a.stake; nOdd++
    if (a.pnl > 0) ganhos += a.pnl; else if (a.pnl < 0) perdas -= a.pnl
    // lucro a stake flat: mesmo resultado com stake = unidade
    lucroFlat += a.stake > 0 ? (a.pnl / a.stake) * unidadeFlat : 0
    nFlat++
  }
  const n = apostas.length - voids
  const decididas = n - refunds
  const hitRate = decididas > 0 ? (wins + 0.5 * halfWins) / decididas : NaN
  const oddMedia = nOdd ? somaOdd / nOdd : NaN
  const oddMediaPonderada = turnover > 0 ? somaOddPond / turnover : NaN
  const nPerdas = losses + halfLosses, nGanhos = wins + halfWins
  return {
    n, turnover: r4(turnover), lucro: r4(lucro),
    yield: r4(turnover > 0 ? lucro / turnover : NaN),
    roiBanco: r4(bancoInicial > 0 ? lucro / bancoInicial : NaN),
    lucroFlat: r4(lucroFlat), yieldFlat: r4(nFlat > 0 ? lucroFlat / (nFlat * unidadeFlat) : NaN),
    hitRate: r4(hitRate), wins, halfWins, refunds, halfLosses, losses, voids,
    oddMedia: r4(oddMedia), oddMediaPonderada: r4(oddMediaPonderada),
    breakEvenHit: r4(oddMedia > 1 ? 1 / oddMedia : NaN),
    profitFactor: r4(perdas > 0 ? ganhos / perdas : ganhos > 0 ? Infinity : NaN),
    payoff: r4(nGanhos > 0 && nPerdas > 0 ? (ganhos / nGanhos) / (perdas / nPerdas) : NaN),
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 6.2 Caminho e risco
// ────────────────────────────────────────────────────────────────────────────

export function calcularCaminho(apostas: Aposta[], bancoInicial: number): Caminho {
  const n = apostas.length
  const banco = new Float64Array(n), cumulativo = new Float64Array(n), underwater = new Float64Array(n)
  let cum = 0, pico = 0, picoIdx = -1
  let mdd = 0, mddPct = 0, mddInicio = -1, mddFundo = -1, mddFim: number | null = null
  const drawdowns: Drawdown[] = []
  let atual: Drawdown | null = null
  let seqDerrotas = 0, maiorSeq = 0, semMaximo = 0, maiorSemMaximo = 0
  const retornos = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const a = apostas[i]
    cum += a.pnl
    cumulativo[i] = cum
    banco[i] = bancoInicial + cum
    retornos[i] = a.stake > 0 ? a.pnl / a.stake : 0
    if (cum >= pico) {
      if (atual) { atual.fim = i; atual.recuperacao = i - atual.fundo; drawdowns.push(atual); atual = null }
      pico = cum; picoIdx = i; semMaximo = 0
    } else {
      semMaximo++
      if (semMaximo > maiorSemMaximo) maiorSemMaximo = semMaximo
      const dd = pico - cum
      const base = bancoInicial + pico
      const ddPct = base > 0 ? dd / base : NaN
      if (!atual) atual = { inicio: picoIdx, fundo: i, fim: null, profundidade: dd, profundidadePct: ddPct, duracao: i - picoIdx, recuperacao: null }
      if (dd > atual.profundidade) { atual.profundidade = dd; atual.profundidadePct = ddPct; atual.fundo = i }
      atual.duracao = i - atual.inicio
      if (dd > mdd) { mdd = dd; mddPct = ddPct; mddInicio = picoIdx; mddFundo = i; mddFim = null }
    }
    underwater[i] = cum - pico
    if (a.pnl < 0) { seqDerrotas++; if (seqDerrotas > maiorSeq) maiorSeq = seqDerrotas } else if (a.pnl > 0) seqDerrotas = 0
  }
  if (atual) drawdowns.push(atual)
  // fim do MDD: primeiro índice após o fundo em que o cumulativo volta ao pico anterior
  if (mddFundo >= 0) {
    const alvo = cumulativo[mddInicio >= 0 ? mddInicio : 0]
    for (let i = mddFundo + 1; i < n; i++) if (cumulativo[i] >= alvo) { mddFim = i; break }
  }
  drawdowns.sort((a, b) => b.profundidade - a.profundidade)
  const media = M.media(retornos), sd = M.desvioPadrao(retornos)
  let sdNeg = 0
  for (let i = 0; i < n; i++) if (retornos[i] < 0) sdNeg += retornos[i] * retornos[i]
  const downside = n > 1 ? Math.sqrt(sdNeg / n) : NaN
  return {
    banco, cumulativo, underwater,
    mdd: r4(mdd), mddPct: r4(mddPct),
    mddDuracao: mddFundo >= 0 ? (mddFim ?? n - 1) - mddInicio : 0,
    mddRecuperacao: mddFim !== null ? mddFim - mddFundo : null,
    drawdowns: drawdowns.slice(0, 5).map((d) => ({ ...d, profundidade: r4(d.profundidade), profundidadePct: r4(d.profundidadePct) })),
    maiorSequenciaDerrotas: maiorSeq, maiorSemNovoMaximo: maiorSemMaximo,
    sharpe: r4(sd > 0 ? media / sd : NaN),
    sortino: r4(downside > 0 ? media / downside : NaN),
    calmar: r4(mdd > 0 ? cum / mdd : NaN),
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 6.3 Esperado × real e CLV
// ────────────────────────────────────────────────────────────────────────────

export function calcularClv(apostas: Aposta[]): Clv {
  const n = apostas.length
  const esperadoCumulativo = new Float64Array(n), clvCumulativo = new Float64Array(n)
  let esp = 0, clvCum = 0, nRef = 0, somaEv = 0, somaBruto = 0, somaNovig = 0, somaPontos = 0, beat = 0, soft = 0, turnoverRef = 0
  const clvs: number[] = []
  for (let i = 0; i < n; i++) {
    const a = apostas[i]
    const temRef = !Number.isNaN(a.qRef) && a.resultado !== 'VOID'
    if (temRef) {
      nRef++
      somaEv += a.ev
      esp += a.ev * a.stake
      turnoverRef += a.stake
      if (!Number.isNaN(a.clvBruto)) somaBruto += a.clvBruto
      somaNovig += a.clvNovig
      somaPontos += a.clvPontos
      if (a.clvNovig > 0) beat++
      clvCum += a.clvNovig * a.stake
      clvs.push(a.clvNovig)
      if (a.refSrc === 'bet365') soft++
    }
    esperadoCumulativo[i] = esp
    clvCumulativo[i] = clvCum
  }
  const sd = M.desvioPadrao(clvs)
  return {
    nComRef: nRef,
    evMedio: r4(nRef ? somaEv / nRef : NaN),
    yieldEsperado: r4(turnoverRef > 0 ? esp / turnoverRef : NaN),
    lucroEsperado: r4(esp),
    esperadoCumulativo,
    clvBrutoMedio: r4(nRef ? somaBruto / nRef : NaN),
    clvNovigMedio: r4(nRef ? somaNovig / nRef : NaN),
    clvPontosMedio: r4(nRef ? somaPontos / nRef : NaN),
    beatRate: r4(nRef ? beat / nRef : NaN),
    clvCumulativo,
    tClv: r4(nRef > 1 && sd > 0 ? (somaNovig / nRef) / (sd / Math.sqrt(nRef)) : NaN),
    refSoft: r4(nRef ? soft / nRef : 0),
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 6.4 Inferência
// ────────────────────────────────────────────────────────────────────────────

export function calcularInferencia(apostas: Aposta[], kpis: Kpis, reamostras: number, seed: number): Inferencia {
  const ativas = apostas.filter((a) => a.resultado !== 'VOID' && a.stake > 0)
  const n = ativas.length
  const ret = new Float64Array(n)
  const margens: number[] = []
  for (let i = 0; i < n; i++) {
    ret[i] = ativas[i].pnl / ativas[i].stake
    // margem implícita da odd de decisão contra a referência: 1/odd − q̂ (só quando há q̂)
    const a = ativas[i]
    if (!Number.isNaN(a.qRef)) margens.push(1 / a.odd - a.qRef)
  }
  const margemMedia = margens.length ? M.media(margens) : NaN
  // H0: yield = −margem (apostador sem edge perde a margem). Sem referência: H0 yield = 0.
  const h0 = Number.isFinite(margemMedia) ? -margemMedia : 0
  const media = M.media(ret), sd = M.desvioPadrao(ret)
  const t = n > 1 && sd > 0 ? (media - h0) / (sd / Math.sqrt(n)) : NaN
  const p = M.pValorT(t, n - 1)
  const zB = n > 0 && kpis.oddMedia > 1 ? (kpis.yieldFlat * Math.sqrt(n)) / Math.sqrt(kpis.oddMedia - 1) : NaN
  // nº mínimo para z = 1.96 no yield observado e odd média: n = (1.96²·(odd−1))/yield²
  const nMin = kpis.yieldFlat > 0 && kpis.oddMedia > 1 ? Math.ceil((1.96 * 1.96 * (kpis.oddMedia - 1)) / (kpis.yieldFlat * kpis.yieldFlat)) : Infinity

  let ic95Yield: [number, number] | null = null, ic95Mdd: [number, number] | null = null, ic95Clv: [number, number] | null = null
  if (reamostras > 0 && n >= 10) {
    const r = M.rng(seed)
    // blocos = dias
    const porDia = new Map<number, number[]>()
    for (let i = 0; i < n; i++) { const d = Math.floor(ativas[i].data / 86400000); let a = porDia.get(d); if (!a) { a = []; porDia.set(d, a) } a.push(i) }
    const blocos = Array.from(porDia.values())
    const ys = new Float64Array(reamostras), mdds = new Float64Array(reamostras), clvs = new Float64Array(reamostras)
    for (let b = 0; b < reamostras; b++) {
      let lucro = 0, turnover = 0, cum = 0, pico = 0, mdd = 0, clv = 0, nClv = 0
      for (let k = 0; k < blocos.length; k++) {
        const bloco = blocos[Math.floor(r() * blocos.length)]
        for (const i of bloco) {
          const a = ativas[i]
          lucro += a.pnl; turnover += a.stake
          cum += a.pnl; if (cum > pico) pico = cum; const dd = pico - cum; if (dd > mdd) mdd = dd
          if (!Number.isNaN(a.qRef)) { clv += a.clvNovig; nClv++ }
        }
      }
      ys[b] = turnover > 0 ? lucro / turnover : NaN
      mdds[b] = mdd
      clvs[b] = nClv ? clv / nClv : NaN
    }
    const ord = (x: Float64Array) => Float64Array.from(x).filter((v) => !Number.isNaN(v)).sort()
    const oy = ord(ys), om = ord(mdds), oc = ord(clvs)
    if (oy.length) ic95Yield = [r4(M.quantil(oy, 0.025)), r4(M.quantil(oy, 0.975))]
    if (om.length) ic95Mdd = [r4(M.quantil(om, 0.025)), r4(M.quantil(om, 0.975))]
    if (oc.length) ic95Clv = [r4(M.quantil(oc, 0.025)), r4(M.quantil(oc, 0.975))]
  }
  return { margemMedia: r4(margemMedia), tYield: r4(t), pValor: r4(p), zBuchdahl: r4(zB), nMinimo: nMin, ic95Yield, ic95Mdd, ic95Clv, reamostras, amostraPequena: n < 300 }
}

// ────────────────────────────────────────────────────────────────────────────
// 6.5 Segmentação
// ────────────────────────────────────────────────────────────────────────────

export const ORDEM_ODD = ['< 1.50', '1.50–1.99', '2.00–2.99', '3.00–4.99', '≥ 5.00']

export function bucketOdd(odd: number): string {
  if (odd < 1.5) return '< 1.50'
  if (odd < 2) return '1.50–1.99'
  if (odd < 3) return '2.00–2.99'
  if (odd < 5) return '3.00–4.99'
  return '≥ 5.00'
}

export function bucketFaixa(v: number, cortes: number[], rotulo: (a: number | null, b: number | null) => string): string {
  if (Number.isNaN(v)) return 'sem referência'
  for (let i = 0; i < cortes.length; i++) if (v < cortes[i]) return rotulo(i ? cortes[i - 1] : null, cortes[i])
  return rotulo(cortes[cortes.length - 1], null)
}

const pct = (x: number) => `${Math.round(x * 100)}%`
const faixa = (a: number | null, b: number | null) => (a === null ? `< ${pct(b as number)}` : b === null ? `≥ ${pct(a)}` : `${pct(a)} a ${pct(b)}`)
const CORTES_FAIXA = [-0.05, 0, 0.05, 0.1]
const ORDEM_FAIXA = [...CORTES_FAIXA.map((c, i) => faixa(i ? CORTES_FAIXA[i - 1] : null, c)), faixa(CORTES_FAIXA[CORTES_FAIXA.length - 1], null), 'sem referência']
const ORDENS: Record<string, string[]> = { odd: ORDEM_ODD, ev: ORDEM_FAIXA, clv: ORDEM_FAIXA }

export function segmentar(apostas: Aposta[], nomes: Map<string, string> = new Map()): Record<string, Segmento[]> {
  const dims: Record<string, (a: Aposta) => string> = {
    competicao: (a) => nomes.get(a.competicao) ?? a.competicao,
    temporada: (a) => `${nomes.get(a.competicao) ?? a.competicao} · ${a.temporada}`,
    mes: (a) => new Date(a.data).toISOString().slice(0, 7),
    odd: (a) => bucketOdd(a.odd),
    mercado: (a) => a.mercado,
    entrada: (a) => a.entradaId,
    selecao: (a) => `${a.mercado} ${a.selecao}${a.linha !== null ? ` ${a.linha}` : ''}`,
    favorito: (a) => (a.mercado === '1x2' || a.mercado === 'ht_1x2' ? (a.odd <= 2 ? 'favorito (odd ≤ 2)' : 'zebra (odd > 2)') : 'n/a'),
    ev: (a) => bucketFaixa(a.ev, CORTES_FAIXA, faixa),
    clv: (a) => bucketFaixa(a.clvNovig, CORTES_FAIXA, faixa),
  }
  const out: Record<string, Segmento[]> = {}
  for (const [dim, f] of Object.entries(dims)) {
    const grupos = new Map<string, Aposta[]>()
    for (const a of apostas) { if (a.resultado === 'VOID') continue; const k = f(a); let g = grupos.get(k); if (!g) { g = []; grupos.set(k, g) } g.push(a) }
    const segs: Segmento[] = []
    for (const [chave, g] of Array.from(grupos)) {
      let turnover = 0, lucro = 0, w = 0, dec = 0, somaOdd = 0, clv = 0, nClv = 0
      for (const a of g) {
        turnover += a.stake; lucro += a.pnl; somaOdd += a.odd
        if (a.resultado !== 'REFUND') { dec++; if (a.resultado === 'WIN') w++; else if (a.resultado === 'HALF_WIN') w += 0.5 }
        if (!Number.isNaN(a.qRef)) { clv += a.clvNovig; nClv++ }
      }
      segs.push({ chave, n: g.length, turnover: r4(turnover), lucro: r4(lucro), yield: r4(turnover > 0 ? lucro / turnover : NaN), hitRate: r4(dec ? w / dec : NaN), oddMedia: r4(somaOdd / g.length), clvNovigMedio: r4(nClv ? clv / nClv : NaN) })
    }
    const ordem = ORDENS[dim]
    segs.sort((a, b) => (ordem ? ordem.indexOf(a.chave) - ordem.indexOf(b.chave) : dim === 'mes' ? a.chave.localeCompare(b.chave) : b.n - a.n))
    out[dim] = segs
  }
  return out
}
