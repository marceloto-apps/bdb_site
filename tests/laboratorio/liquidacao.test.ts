import { describe, it, expect } from 'vitest'
import { liquidar, resultadoDe } from '@/lib/laboratorio/engine/liquidacao'
import { liquidarAposta, type BacktestBetSide, type BacktestMarket } from '@/lib/ferramentas/backtest/settlement'
import { rng } from '@/lib/laboratorio/engine/matematica'
import type { Mercado } from '@/lib/laboratorio/engine/tipos'

const P = (ftH: number, ftA: number, extra: Partial<{ htH: number; htA: number; cornersH: number; cornersA: number }> = {}) => ({ ftH, ftA, ...extra })

describe('1X2, dupla chance, BTTS', () => {
  it('1x2', () => {
    expect(resultadoDe('1x2', 'home', null, P(2, 1))).toBe('WIN')
    expect(resultadoDe('1x2', 'draw', null, P(1, 1))).toBe('WIN')
    expect(resultadoDe('1x2', 'away', null, P(0, 1))).toBe('WIN')
    expect(resultadoDe('1x2', 'home', null, P(1, 1))).toBe('LOSS')
  })
  it('dupla chance', () => {
    expect(resultadoDe('dc', '1x', null, P(1, 1))).toBe('WIN')
    expect(resultadoDe('dc', 'x2', null, P(2, 1))).toBe('LOSS')
    expect(resultadoDe('dc', '12', null, P(1, 1))).toBe('LOSS')
    expect(resultadoDe('dc', '12', null, P(0, 3))).toBe('WIN')
  })
  it('btts', () => {
    expect(resultadoDe('btts', 'yes', null, P(1, 1))).toBe('WIN')
    expect(resultadoDe('btts', 'no', null, P(1, 0))).toBe('WIN')
    expect(resultadoDe('btts', 'yes', null, P(0, 0))).toBe('LOSS')
  })
  it('placar ausente → VOID com pnl 0', () => {
    expect(liquidar('1x2', 'home', null, 2, 1, P(NaN, 1))).toEqual({ resultado: 'VOID', pnl: 0 })
    expect(liquidar('ht_1x2', 'home', null, 2, 1, P(2, 1))).toEqual({ resultado: 'VOID', pnl: 0 })
    expect(liquidar('corners', 'over', 9.5, 2, 1, P(2, 1))).toEqual({ resultado: 'VOID', pnl: 0 })
  })
  it('seleção inválida para o mercado → VOID', () => {
    expect(resultadoDe('1x2', 'over', null, P(2, 1))).toBe('VOID')
    expect(resultadoDe('btts', 'home', null, P(2, 1))).toBe('VOID')
  })
})

describe('over/under com quartos', () => {
  it('meia linha', () => {
    expect(resultadoDe('ou', 'over', 2.5, P(2, 1))).toBe('WIN')
    expect(resultadoDe('ou', 'under', 2.5, P(2, 1))).toBe('LOSS')
  })
  it('linha inteira devolve no empate', () => {
    expect(resultadoDe('ou', 'over', 3, P(2, 1))).toBe('REFUND')
    expect(resultadoDe('ou', 'under', 3, P(1, 1))).toBe('WIN')
  })
  it('quartos: meio ganho e meia perda', () => {
    expect(resultadoDe('ou', 'over', 2.75, P(2, 1))).toBe('HALF_WIN')
    expect(resultadoDe('ou', 'over', 2.25, P(1, 1))).toBe('HALF_LOSS')
    expect(resultadoDe('ou', 'under', 2.25, P(1, 1))).toBe('HALF_WIN')
    expect(resultadoDe('ou', 'under', 2.75, P(2, 1))).toBe('HALF_LOSS')
    expect(resultadoDe('ou', 'over', 2.75, P(3, 1))).toBe('WIN')
  })
  it('pnl dos parciais', () => {
    expect(liquidar('ou', 'over', 2.75, 2.0, 10, P(2, 1)).pnl).toBeCloseTo(5)
    expect(liquidar('ou', 'over', 2.25, 2.0, 10, P(1, 1)).pnl).toBeCloseTo(-5)
    expect(liquidar('ou', 'over', 3, 2.0, 10, P(2, 1)).pnl).toBe(0)
  })
  it('escanteios e 1º tempo usam os totais certos', () => {
    expect(resultadoDe('corners', 'over', 9.5, P(0, 0, { cornersH: 6, cornersA: 4 }))).toBe('WIN')
    expect(resultadoDe('ht_ou', 'over', 0.5, P(3, 3, { htH: 0, htA: 0 }))).toBe('LOSS')
    expect(resultadoDe('ht_ou', 'under', 1.5, P(3, 3, { htH: 1, htA: 0 }))).toBe('WIN')
  })
})

describe('handicap asiático (linha = handicap do mandante)', () => {
  it('meias e inteiras', () => {
    expect(resultadoDe('ah', 'home', -0.5, P(1, 0))).toBe('WIN')
    expect(resultadoDe('ah', 'home', -1, P(1, 0))).toBe('REFUND')
    expect(resultadoDe('ah', 'away', -1, P(1, 0))).toBe('REFUND')
    expect(resultadoDe('ah', 'away', 0.5, P(1, 0))).toBe('LOSS')
    expect(resultadoDe('ah', 'away', 0.5, P(0, 0))).toBe('LOSS') // mandante +0.5 vence o empate
    expect(resultadoDe('ah', 'away', -0.5, P(0, 0))).toBe('WIN')
  })
  it('quartos', () => {
    expect(resultadoDe('ah', 'home', -0.75, P(1, 0))).toBe('HALF_WIN')
    expect(resultadoDe('ah', 'home', -1.25, P(1, 0))).toBe('HALF_LOSS')
    expect(resultadoDe('ah', 'away', 0.75, P(0, 1))).toBe('HALF_WIN') // visitante dá 0.75 e vence por 1
    expect(resultadoDe('ah', 'away', 0.75, P(0, 2))).toBe('WIN')
    expect(resultadoDe('ah', 'away', -1.25, P(0, 1))).toBe('WIN')
    expect(resultadoDe('ah', 'away', 1.25, P(0, 1))).toBe('HALF_LOSS')
  })
  it('1º tempo', () => {
    expect(resultadoDe('ht_ah', 'home', -0.25, P(3, 0, { htH: 0, htA: 0 }))).toBe('HALF_LOSS')
  })
})

describe('handicap europeu e placar exato', () => {
  it('eh aplica o inteiro ao mandante e liquida como 1X2', () => {
    expect(resultadoDe('eh', 'home', -1, P(2, 0))).toBe('WIN')
    expect(resultadoDe('eh', 'draw', -1, P(2, 1))).toBe('WIN')
    expect(resultadoDe('eh', 'away', -1, P(2, 1))).toBe('LOSS')
    expect(resultadoDe('eh', 'away', 1, P(0, 0))).toBe('LOSS')
    expect(resultadoDe('eh', 'home', 0.5 as never, P(2, 1))).toBe('VOID')
  })
  it('cs: grade 0–3 e other', () => {
    expect(resultadoDe('cs', '2_1', null, P(2, 1))).toBe('WIN')
    expect(resultadoDe('cs', '2_1', null, P(1, 2))).toBe('LOSS')
    expect(resultadoDe('cs', 'other', null, P(4, 1))).toBe('WIN')
    expect(resultadoDe('cs', 'other', null, P(3, 3))).toBe('LOSS')
    expect(resultadoDe('cs', 'x', null, P(1, 1))).toBe('VOID')
  })
})

describe('paridade com liquidarAposta (backtest atual)', () => {
  const mapa: Record<string, { mercado: BacktestMarket; lado: Record<string, BacktestBetSide> }> = {
    '1x2': { mercado: '1X2', lado: { home: 'HOME', draw: 'DRAW', away: 'AWAY' } },
    btts: { mercado: 'BTTS', lado: { yes: 'YES', no: 'NO' } },
    ou: { mercado: 'OVER_UNDER', lado: { over: 'OVER', under: 'UNDER' } },
    ah: { mercado: 'ASIAN_HANDICAP', lado: { home: 'HOME', away: 'AWAY' } },
  }
  it('2.000 apostas aleatórias dão o mesmo resultado e pnl (±1e-4 pelo arredondamento do legado)', () => {
    const r = rng(2024)
    const linhas = [-2, -1.75, -1.5, -1.25, -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4]
    let comparadas = 0
    for (let k = 0; k < 2000; k++) {
      const mercados = Object.keys(mapa)
      const mercado = mercados[Math.floor(r() * mercados.length)] as keyof typeof mapa
      const lados = Object.keys(mapa[mercado].lado)
      const sel = lados[Math.floor(r() * lados.length)]
      const linha = mercado === 'ou' ? linhas[Math.floor(r() * linhas.length)] + 2 : linhas[Math.floor(r() * linhas.length)]
      const ftH = Math.floor(r() * 5), ftA = Math.floor(r() * 5)
      const odd = 1.5 + r() * 2, stake = 1 + Math.floor(r() * 50)
      const novo = liquidar(mercado as Mercado, sel, mercado === '1x2' || mercado === 'btts' ? null : linha, odd, stake, { ftH, ftA })
      const legado = liquidarAposta({ market: mapa[mercado].mercado, betSide: mapa[mercado].lado[sel], line: linha, stake, odd, fthg: ftH, ftag: ftA })
      expect(novo.resultado).toBe(legado.outcome)
      expect(Math.abs(novo.pnl - legado.pnl)).toBeLessThan(1e-4)
      comparadas++
    }
    expect(comparadas).toBe(2000)
  })
})
