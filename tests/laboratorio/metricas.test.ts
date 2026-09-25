import { describe, it, expect } from 'vitest'
import { bucketOdd, calcularCaminho, calcularClv, calcularInferencia, calcularKpis, segmentar } from '@/lib/laboratorio/engine/metricas'
import { calcularKPIs } from '@/lib/ferramentas/backtest/kpis'
import type { Aposta, Resultado } from '@/lib/laboratorio/engine/tipos'

let seq = 0
const aposta = (resultado: Resultado, odd: number, stake = 1, extra: Partial<Aposta> = {}): Aposta => {
  const pnl = resultado === 'WIN' ? stake * (odd - 1) : resultado === 'HALF_WIN' ? (stake * (odd - 1)) / 2 : resultado === 'HALF_LOSS' ? -stake / 2 : resultado === 'LOSS' ? -stake : 0
  const i = seq++
  return { i, entradaId: 'e1', matchId: `m${i}`, data: Date.UTC(2025, 0, 1) + Math.floor(i / 3) * 86400000, competicao: i % 2 ? 'A' : 'B', temporada: '2025', home: 'h', away: 'a', mercado: '1x2', selecao: 'home', linha: null, odd, oddLiquidacao: odd, stake, resultado, pnl, qRef: NaN, oddRef: NaN, refSrc: null, ev: NaN, clvBruto: NaN, clvNovig: NaN, clvPontos: NaN, banco: 0, ...extra }
}

describe('KPIs', () => {
  it('paridade com calcularKPIs do backtest atual (hit rate, pnl, exposição)', () => {
    const as = [aposta('WIN', 2), aposta('LOSS', 2), aposta('HALF_WIN', 2.2, 10), aposta('REFUND', 1.9, 5), aposta('HALF_LOSS', 1.8, 4), aposta('LOSS', 3, 2)]
    const k = calcularKpis(as, 100, 1)
    const legado = calcularKPIs(as.map((a) => ({ outcome: a.resultado as 'WIN', pnl: a.pnl, stake: a.stake })))
    expect(k.lucro).toBeCloseTo(legado.totalPnL, 4)
    expect(k.hitRate).toBeCloseTo(legado.hitRate, 4)
    expect(k.wins).toBe(legado.winCount); expect(k.halfWins).toBe(legado.halfWinCount); expect(k.refunds).toBe(legado.refundCount)
    // turnover aqui é o total apostado (inclui devoluções), enquanto o legado usa exposição efetiva
    expect(k.turnover).toBe(23)
    expect(k.roiBanco).toBeCloseTo(k.lucro / 100, 4)
  })
  it('VOID não conta; break-even, profit factor, payoff, odd ponderada', () => {
    const as = [aposta('WIN', 3, 2), aposta('LOSS', 1.5, 1), aposta('VOID', 2, 1)]
    const k = calcularKpis(as, 0, 1)
    expect(k.n).toBe(2); expect(k.voids).toBe(1)
    expect(k.oddMedia).toBe(2.25); expect(k.oddMediaPonderada).toBeCloseTo((3 * 2 + 1.5) / 3, 4)
    expect(k.breakEvenHit).toBeCloseTo(1 / 2.25, 4)
    expect(k.profitFactor).toBe(4); expect(k.payoff).toBe(4)
    expect(k.lucroFlat).toBeCloseTo(2 - 1, 4)
  })
  it('sem perdas profit factor é ∞; sem apostas tudo NaN/0', () => {
    expect(calcularKpis([aposta('WIN', 2)], 0, 1).profitFactor).toBe(Infinity)
    const k = calcularKpis([], 0, 1)
    expect(k.n).toBe(0); expect(k.yield).toBeNaN()
  })
})

describe('caminho e risco', () => {
  it('drawdown máximo, duração e recuperação', () => {
    // +1, +1, −1, −1, −1, +1, +1, +1 → pico 2 em i=1, fundo −1 em i=4 (dd 3), recupera em i=7
    const seqs: Resultado[] = ['WIN', 'WIN', 'LOSS', 'LOSS', 'LOSS', 'WIN', 'WIN', 'WIN']
    const c = calcularCaminho(seqs.map((r) => aposta(r, 2)), 10)
    expect(c.mdd).toBe(3)
    expect(c.mddPct).toBeCloseTo(3 / 12, 4)
    expect(c.mddDuracao).toBe(6); expect(c.mddRecuperacao).toBe(3)
    expect(c.maiorSequenciaDerrotas).toBe(3)
    expect(c.maiorSemNovoMaximo).toBe(5)
    expect(Array.from(c.underwater)).toEqual([0, 0, -1, -2, -3, -2, -1, 0])
    expect(c.drawdowns[0].profundidade).toBe(3)
    expect(c.calmar).toBeCloseTo(2 / 3, 4)
  })
  it('sem perdas: MDD 0, Sharpe finito', () => {
    const c = calcularCaminho([aposta('WIN', 2), aposta('WIN', 3)], 0)
    expect(c.mdd).toBe(0); expect(c.drawdowns).toHaveLength(0); expect(c.sharpe).toBeGreaterThan(0)
  })
})

describe('CLV', () => {
  it('médias, beat rate e curvas cumulativas', () => {
    const as = [
      aposta('WIN', 2.2, 1, { qRef: 0.5, oddRef: 2.0, refSrc: 'pinnacle', ev: 0.1, clvBruto: 0.1, clvNovig: 0.1, clvPontos: 0.5 - 1 / 2.2 }),
      aposta('LOSS', 1.8, 1, { qRef: 0.5, oddRef: 2.0, refSrc: 'bet365', ev: -0.1, clvBruto: -0.1, clvNovig: -0.1, clvPontos: 0.5 - 1 / 1.8 }),
      aposta('LOSS', 2, 1),
    ]
    const c = calcularClv(as)
    expect(c.nComRef).toBe(2)
    expect(c.evMedio).toBeCloseTo(0, 6); expect(c.clvNovigMedio).toBeCloseTo(0, 6)
    expect(c.beatRate).toBe(0.5); expect(c.refSoft).toBe(0.5)
    expect(Array.from(c.esperadoCumulativo).map((v) => +v.toFixed(6))).toEqual([0.1, 0, 0])
    expect(c.lucroEsperado).toBeCloseTo(0, 6)
  })
})

describe('inferência', () => {
  it('estratégia sem edge em muitas apostas: p-valor alto, IC contém o yield', () => {
    // 600 apostas a odd 2 com 50% de acerto exato → yield 0, H0 yield=0 (sem referência)
    const as: Aposta[] = []
    for (let i = 0; i < 600; i++) as.push(aposta(i % 2 ? 'WIN' : 'LOSS', 2))
    const k = calcularKpis(as, 0, 1)
    const inf = calcularInferencia(as, k, 500, 1)
    expect(Math.abs(inf.tYield)).toBeLessThan(0.01)
    expect(inf.pValor).toBeGreaterThan(0.9)
    expect(inf.ic95Yield![0]).toBeLessThanOrEqual(0); expect(inf.ic95Yield![1]).toBeGreaterThanOrEqual(0)
    expect(inf.amostraPequena).toBe(false)
    expect(inf.nMinimo).toBe(Infinity)
  })
  it('estratégia com edge claro: t alto, p baixo, n mínimo finito', () => {
    const as: Aposta[] = []
    for (let i = 0; i < 400; i++) as.push(aposta(i % 5 !== 0 ? 'WIN' : 'LOSS', 1.6, 1, { qRef: 0.6, oddRef: 1.6 }))
    const k = calcularKpis(as, 0, 1)
    const inf = calcularInferencia(as, k, 200, 3)
    expect(inf.tYield).toBeGreaterThan(5); expect(inf.pValor).toBeLessThan(0.001)
    expect(inf.zBuchdahl).toBeGreaterThan(5)
    expect(Number.isFinite(inf.nMinimo)).toBe(true)
    expect(inf.margemMedia).toBeCloseTo(1 / 1.6 - 0.6, 6)
  })
  it('bootstrap desligado ou amostra pequena → sem IC', () => {
    const as = [aposta('WIN', 2), aposta('LOSS', 2)]
    const inf = calcularInferencia(as, calcularKpis(as, 0, 1), 100, 1)
    expect(inf.ic95Yield).toBeNull(); expect(inf.amostraPequena).toBe(true)
  })
  it('é determinístico para a mesma semente', () => {
    const as: Aposta[] = []
    for (let i = 0; i < 100; i++) as.push(aposta(i % 3 ? 'WIN' : 'LOSS', 1.7))
    const k = calcularKpis(as, 0, 1)
    expect(calcularInferencia(as, k, 300, 9).ic95Yield).toEqual(calcularInferencia(as, k, 300, 9).ic95Yield)
  })
})

describe('segmentação', () => {
  it('agrupa por competição, mês, bucket de odd e favorito', () => {
    seq = 0
    const as = [aposta('WIN', 1.8), aposta('LOSS', 2.5), aposta('WIN', 6), aposta('VOID', 2)]
    const s = segmentar(as, new Map([['A', 'Liga A']]))
    expect(s.competicao.map((x) => x.chave).sort()).toEqual(['B', 'Liga A'])
    expect(s.odd.map((x) => x.chave)).toEqual(['1.50–1.99', '2.00–2.99', '≥ 5.00'])
    expect(s.favorito.find((x) => x.chave.startsWith('favorito'))!.n).toBe(1)
    expect(s.mes[0].chave).toBe('2025-01')
    expect(s.competicao.reduce((a, x) => a + x.n, 0)).toBe(3)
  })
  it('bucketOdd', () => {
    expect(bucketOdd(1.2)).toBe('< 1.50'); expect(bucketOdd(4.99)).toBe('3.00–4.99'); expect(bucketOdd(5)).toBe('≥ 5.00')
  })
})
