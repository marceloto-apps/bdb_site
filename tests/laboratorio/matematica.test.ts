import { describe, it, expect } from 'vitest'
import * as M from '@/lib/laboratorio/engine/matematica'
import { matrizPlacaresPoisson, calcularMercados } from '@/lib/analytics/poisson'
import { matrizPlacaresDixonColes, tauDixonColes } from '@/lib/analytics/dixon-coles'
import { matrizPlacaresZIP } from '@/lib/analytics/zero-inflated'
import { matrizPlacaresNB } from '@/lib/analytics/negative-binomial'
import { normalizarMatriz } from '@/lib/ferramentas/backtest/projections'

const soma = (xs: ArrayLike<number>) => Array.from(xs).reduce((a, b) => a + b, 0)

describe('remoção de margem', () => {
  const odds = [2.1, 3.4, 3.6]
  it.each(['proportional', 'power', 'shin', 'odds_ratio'] as const)('%s soma 1 e preserva a ordem', (m) => {
    const p = M.novig(odds, m)
    expect(soma(p)).toBeCloseTo(1, 9)
    expect(p[0]).toBeGreaterThan(p[1]); expect(p[1]).toBeGreaterThan(p[2])
  })
  it('proporcional = implied/soma', () => {
    const p = M.novig(odds)
    expect(p[0]).toBeCloseTo((1 / 2.1) / (1 / 2.1 + 1 / 3.4 + 1 / 3.6), 12)
  })
  it('power e shin dão favorito com probabilidade maior que o proporcional (viés favorito-zebra)', () => {
    const prop = M.novig(odds), pow = M.novig(odds, 'power'), shin = M.novig(odds, 'shin'), or = M.novig(odds, 'odds_ratio')
    expect(pow[0]).toBeGreaterThan(prop[0]); expect(shin[0]).toBeGreaterThan(prop[0]); expect(or[0]).toBeGreaterThan(prop[0])
  })
  it('sem margem todos os métodos devolvem as probabilidades originais', () => {
    const justas = [1 / 0.5, 1 / 0.3, 1 / 0.2]
    for (const m of ['proportional', 'power', 'shin', 'odds_ratio'] as const) {
      const p = M.novig(justas, m)
      expect(p[0]).toBeCloseTo(0.5, 4); expect(p[1]).toBeCloseTo(0.3, 4); expect(p[2]).toBeCloseTo(0.2, 4)
    }
  })
  it('dois resultados (shin fechado) e odds inválidas', () => {
    const p = M.novig([1.9, 1.9], 'shin')
    expect(p[0]).toBeCloseTo(0.5, 9)
    expect(M.novig([1, 2]).every(Number.isNaN)).toBe(true)
  })
  it('helpers: implied, fair_odd, ev, edge, kelly, quarter', () => {
    expect(M.implied(4)).toBe(0.25); expect(M.implied(0.5)).toBeNaN()
    expect(M.fairOdd(0.25)).toBe(4)
    expect(M.ev(0.5, 2.2)).toBeCloseTo(0.1); expect(M.edge(0.5, 2.5)).toBeCloseTo(0.1)
    expect(M.kelly(0.55, 2)).toBeCloseTo(0.1); expect(M.kelly(0.4, 2)).toBe(0)
    expect(M.quarter(-0.6)).toBe(-0.5); expect(M.quarter(2.13)).toBe(2.25)
  })
})

describe('distribuições — paridade com lib/analytics', () => {
  const lh = 1.6, la = 1.1
  const paridade = (m: M.Matriz, ref: number[][], digitos = 9) => {
    for (let h = 0; h <= 10; h++) for (let a = 0; a <= 10; a++) expect(m[h * 11 + a]).toBeCloseTo(ref[h][a], digitos)
  }
  it('Poisson', () => {
    const ref = normalizarMatriz(matrizPlacaresPoisson(lh, la))
    paridade(M.matrizPlacares('POISSON', lh, la), ref)
    expect(soma(M.matrizPlacares('POISSON', lh, la))).toBeCloseTo(1, 12)
  })
  it('Dixon-Coles (τ e matriz)', () => {
    expect(M.tauDixonColes(0, 0, lh, la, -0.1)).toBeCloseTo(tauDixonColes(0, 0, lh, la, -0.1), 12)
    expect(M.tauDixonColes(1, 1, lh, la, -0.1)).toBeCloseTo(tauDixonColes(1, 1, lh, la, -0.1), 12)
    const ref = normalizarMatriz(matrizPlacaresDixonColes(lh, la, -0.1).matriz)
    paridade(M.matrizPlacares('DC', lh, la, { rho: -0.1 }), ref)
  })
  it('ZIP', () => {
    // o legado renormaliza as marginais truncadas antes do produto: diferença ~1e-7
    const ref = normalizarMatriz(matrizPlacaresZIP(lh, la, 0.05, 0.08))
    paridade(M.matrizPlacares('ZIP', lh, la, { piH: 0.05, piA: 0.08 }), ref, 6)
  })
  it('binomial negativa (com sobredispersão e com fallback Poisson)', () => {
    const ref = normalizarMatriz(matrizPlacaresNB(lh, la, 2.2, 1.5).matriz)
    paridade(M.matrizPlacares('NB', lh, la, { varH: 2.2, varA: 1.5 }), ref)
    const refP = normalizarMatriz(matrizPlacaresNB(lh, la, 1.0, 1.0).matriz)
    paridade(M.matrizPlacares('NB', lh, la, { varH: 1.0, varA: 1.0 }), refP)
  })
  it('ρ fora do domínio válido é limitado sem gerar célula negativa', () => {
    const m = M.matrizPlacares('DC', lh, la, { rho: -5 })
    expect(Array.from(m).every((v) => v >= 0)).toBe(true)
    expect(soma(m)).toBeCloseTo(1, 9)
  })
  it('mercados: 1x2 e btts batem com calcularMercados', () => {
    const m = M.matrizPlacares('POISSON', lh, la)
    const ref = calcularMercados(normalizarMatriz(matrizPlacaresPoisson(lh, la)))
    const p = M.prob1x2(m)
    expect(p.h).toBeCloseTo(ref.casa, 9); expect(p.d).toBeCloseTo(ref.empate, 9); expect(p.a).toBeCloseTo(ref.visit, 9)
    expect(M.probBtts(m)).toBeCloseTo(ref.btts, 9)
    expect(M.probEfetiva(M.probLinhaTotal(m, 2.5, 'over'))).toBeCloseTo(ref.over25, 9)
  })
})

describe('linhas de total e handicap asiático sobre a matriz', () => {
  const m = M.matrizPlacares('POISSON', 1.5, 1.2)
  it('linha meia: win + loss = 1, sem devolução', () => {
    const p = M.probLinhaTotal(m, 2.5, 'over')
    expect(p.refund).toBe(0); expect(p.halfWin).toBe(0); expect(p.win + p.loss).toBeCloseTo(1, 12)
  })
  it('linha inteira: devolução = P(total = L); over + under + push = 1', () => {
    const o = M.probLinhaTotal(m, 3, 'over'), u = M.probLinhaTotal(m, 3, 'under')
    expect(o.refund).toBeCloseTo(M.distTotal(m)[3], 12)
    expect(o.win + o.loss + o.refund).toBeCloseTo(1, 12)
    expect(o.win).toBeCloseTo(u.loss, 12)
  })
  it('linha de quarto = média das duas metades (EV)', () => {
    const q = M.probLinhaSobreDist(M.distTotal(m), 0, 2.75, 'acima')
    const a = M.probLinhaSobreDist(M.distTotal(m), 0, 2.5, 'acima'), b = M.probLinhaSobreDist(M.distTotal(m), 0, 3, 'acima')
    const odd = 1.95
    expect(M.evLinha(q, odd)).toBeCloseTo((M.evLinha(a, odd) + M.evLinha(b, odd)) / 2, 12)
    expect(q.halfWin + q.halfLoss).toBeGreaterThan(0)
  })
  it('AH: home −0.5 ≡ P(home vence); home 0 devolve no empate; away espelha', () => {
    const h = M.probLinhaAh(m, -0.5, 'home')
    expect(h.win).toBeCloseTo(M.prob1x2(m).h, 12)
    const z = M.probLinhaAh(m, 0, 'home')
    expect(z.refund).toBeCloseTo(M.prob1x2(m).d, 12)
    const a = M.probLinhaAh(m, -0.5, 'away')
    expect(a.win).toBeCloseTo(M.prob1x2(m).d + M.prob1x2(m).a, 12)
  })
  it('AH +1.25 para o mandante: parte em +1 e +1.5', () => {
    const p = M.probLinhaAh(m, 1.25, 'home')
    const d = M.distDiferenca(m)
    // meia perda quando diff = −1 (a parte +1 devolve, a parte +1.5 ganha → meio ganho na verdade)
    expect(p.halfWin).toBeCloseTo(d[-1 + M.MAX_GOLS], 12)
    expect(p.halfLoss).toBe(0)
  })
})

describe('estatística e utilidades', () => {
  it('normalCdf e pValorT', () => {
    expect(M.normalCdf(0)).toBeCloseTo(0.5, 7)
    expect(M.normalCdf(1.96)).toBeCloseTo(0.975, 3)
    expect(M.pValorT(0, 100)).toBeCloseTo(1, 6)
    expect(M.pValorT(2.5, 500)).toBeLessThan(0.02)
    expect(M.pValorT(2, 5)).toBeGreaterThan(M.pValorT(2, 500))
  })
  it('média, desvio e quantil ignoram NaN', () => {
    expect(M.media([1, NaN, 3])).toBe(2)
    expect(M.desvioPadrao([2, 4, 4, 4, 5, 5, 7, 9], false)).toBeCloseTo(2, 12)
    expect(M.quantil([1, 2, 3, 4], 0.5)).toBe(2.5)
  })
  it('rng é determinístico e uniforme', () => {
    const a = M.rng(1), b = M.rng(1)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    const r = M.rng(99); let s = 0; for (let i = 0; i < 10000; i++) s += r()
    expect(s / 10000).toBeCloseTo(0.5, 1)
  })
  it('hash64 é estável e sensível ao conteúdo', () => {
    expect(M.hash64('abc')).toBe(M.hash64('abc'))
    expect(M.hash64('abc')).not.toBe(M.hash64('abd'))
    expect(M.hash64('abc')).toMatch(/^[0-9a-f]{16}$/)
  })
})
