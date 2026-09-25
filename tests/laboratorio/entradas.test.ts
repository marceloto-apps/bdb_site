import { describe, it, expect } from 'vitest'
import { camposDaEntrada, camposReferencia, chavesOdd, resolvedorEntrada, resolvedorReferencia, SELECOES_POR_MERCADO, type EntradaCompilada } from '@/lib/laboratorio/engine/entradas'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'
import { resolver } from '@/lib/laboratorio/engine/ast'
import { parseExpressao } from '@/lib/laboratorio/engine/parser'
import type { ContextoCompilacao } from '@/lib/laboratorio/engine/compile'
import type { Entrada } from '@/lib/laboratorio/engine/tipos'
import { datasetSintetico } from './sintetico'

const cat = catalogoPadrao()
const ds = datasetSintetico({ n: 100 })
const ctx = (): ContextoCompilacao => ({ dataset: ds, parametros: {}, indicadores: new Map(), camposAusentes: new Set() })
const ast = (f: string) => resolver(parseExpressao(f), { ehCampo: cat.ehCampo, indicadores: new Set() })
const ec = (entrada: Entrada, extra: Partial<EntradaCompilada> = {}): EntradaCompilada => ({ entrada, id: 'e1', selecaoFixa: typeof entrada.selecao === 'string' ? entrada.selecao : null, selecaoAst: null, linhaFixa: entrada.linha === undefined ? (['ou', 'ah', 'corners', 'ht_ou', 'ht_ah', 'eh'].includes(entrada.mercado) ? 'main' : null) : typeof entrada.linha === 'number' ? entrada.linha : 'main', linhaAst: null, condicaoAst: null, ...extra })

describe('chavesOdd → colunas do catálogo', () => {
  it('todas as combinações válidas apontam para campos existentes', () => {
    let n = 0
    for (const mercado of Object.keys(SELECOES_POR_MERCADO) as (keyof typeof SELECOES_POR_MERCADO)[]) for (const casa of ['bet365', 'pinnacle'] as const) for (const snap of ['open', 'close'] as const) for (const sel of SELECOES_POR_MERCADO[mercado]) {
      const linhas = mercado === 'eh' ? [-1, 2] : mercado === 'ou' ? ['main', 2.5] : mercado === 'ht_ou' ? ['main', 0.5] : ['main']
      for (const l of linhas) {
        const ch = chavesOdd(mercado, casa, snap, sel, l as never)
        if (!ch) continue
        n++
        expect(cat.ehCampo(ch.odd), ch.odd).toBe(true)
        if (ch.linha) expect(cat.ehCampo(ch.linha), ch.linha).toBe(true)
      }
    }
    expect(n).toBe(96) // 1x2/btts/ou/ah/corners nas 2 casas × 2 snapshots + ht_* bet365 × 2 + dc/eh/cs bet365 close
  })
  it('linhas fixas inexistentes e handicap europeu inválido devolvem null', () => {
    expect(chavesOdd('ou', 'bet365', 'close', 'over', 5.5)).toBeNull()
    expect(chavesOdd('ah', 'bet365', 'close', 'home', 'main')).toEqual({ odd: 'odds.bet365.close.ah.home_main', linha: 'odds.bet365.close.ah.main_line' })
    expect(chavesOdd('eh', 'bet365', 'close', 'home', 0)).toBeNull()
    expect(chavesOdd('eh', 'bet365', 'close', 'home', -2)?.odd).toBe('odds.bet365.close.eh.h_m2')
    expect(chavesOdd('1x2', 'bet365', 'close', 'over', null)).toBeNull()
  })
})

describe('resolvedorEntrada', () => {
  it('1x2 fixo com preço bet365 close', () => {
    const r = resolvedorEntrada(ec({ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }), ctx())
    const o = r(0)
    expect(o).not.toBeNull()
    expect(o!.odd).toBe(ds.numericas.get('odds.bet365.close.1x2.h')![0])
    expect(o!.oddLiquidacao).toBe(o!.odd)
    expect(o!.linha).toBeNull()
  })
  it('slippage reduz a odd e filtros de odd excluem', () => {
    const base = ds.numericas.get('odds.bet365.close.1x2.h')![0]
    const r = resolvedorEntrada(ec({ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' }, slippage: 0.1 }), ctx())
    expect(r(0)!.odd).toBeCloseTo(1 + (base - 1) * 0.9, 12)
    const r2 = resolvedorEntrada(ec({ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' }, oddMin: base + 0.01 }), ctx())
    expect(r2(0)).toBeNull()
  })
  it('O/U main lê a linha principal; linha fixa 2.5 usa a coluna própria; linha 3.5 ausente → null', () => {
    const r = resolvedorEntrada(ec({ mercado: 'ou', selecao: 'over', preco: { casa: 'bet365', snapshot: 'close' } }), ctx())
    expect(r(1)!.linha).toBe(2.5)
    const r2 = resolvedorEntrada(ec({ mercado: 'ou', selecao: 'over', linha: 2.5, preco: { casa: 'bet365', snapshot: 'close' } }), ctx())
    expect(r2(1)!.odd).toBe(ds.numericas.get('odds.bet365.close.ou.over_2_5')![1])
    const r3 = resolvedorEntrada(ec({ mercado: 'ou', selecao: 'over', linha: 3.5, preco: { casa: 'bet365', snapshot: 'close' } }), ctx())
    expect(r3(1)).toBeNull()
  })
  it('AH com linha fixa diferente da principal → null; igual → odd main', () => {
    const r = resolvedorEntrada(ec({ mercado: 'ah', selecao: 'home', linha: -1, preco: { casa: 'bet365', snapshot: 'close' } }), ctx())
    expect(r(0)).toBeNull()
    const r2 = resolvedorEntrada(ec({ mercado: 'ah', selecao: 'home', linha: -0.5, preco: { casa: 'bet365', snapshot: 'close' } }), ctx())
    expect(r2(0)!.odd).toBe(ds.numericas.get('odds.bet365.close.ah.home_main')![0])
  })
  it('seleção por expressão e condição da perna', () => {
    const r = resolvedorEntrada(ec({ mercado: '1x2', selecao: { formula: 'x' }, preco: { casa: 'bet365', snapshot: 'close' } }, { selecaoFixa: null, selecaoAst: ast('if(odds.bet365.close.1x2.h < odds.bet365.close.1x2.a, home, away)'), condicaoAst: ast('match.round > 1') }), ctx())
    const h = ds.numericas.get('odds.bet365.close.1x2.h')!, a = ds.numericas.get('odds.bet365.close.1x2.a')!, round = ds.numericas.get('match.round')!
    const i = round.findIndex((v) => v > 1)
    expect(r(i)!.selecao).toBe(h[i] < a[i] ? 'home' : 'away')
    expect(r(round.findIndex((v) => v === 1))).toBeNull()
  })
  it('linha por expressão arredonda para quarto', () => {
    const r = resolvedorEntrada(ec({ mercado: 'ou', selecao: 'over', linha: { formula: 'x' }, preco: { casa: 'bet365', snapshot: 'close' } }, { linhaFixa: null, linhaAst: ast('2.4') }), ctx())
    expect(r(0)!.linha).toBe(2.5)
  })
  it('preço de decisão open e liquidação close', () => {
    const r = resolvedorEntrada(ec({ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'open' }, liquidacao: { casa: 'bet365', snapshot: 'close' } }), ctx())
    const o = r(2)!
    expect(o.odd).toBe(ds.numericas.get('odds.bet365.open.1x2.h')![2])
    expect(o.oddLiquidacao).toBe(ds.numericas.get('odds.bet365.close.1x2.h')![2])
  })
  it('Pinnacle não tem dupla chance → null; bet365 tem', () => {
    expect(resolvedorEntrada(ec({ mercado: 'dc', selecao: '1x', preco: { casa: 'pinnacle', snapshot: 'close' } }), ctx())(0)).toBeNull()
    expect(resolvedorEntrada(ec({ mercado: 'dc', selecao: '1x', preco: { casa: 'bet365', snapshot: 'close' } }), ctx())(0)!.odd).toBe(ds.numericas.get('odds.bet365.close.dc.1x')![0])
  })
})

describe('referência (q̂ e odd de fechamento)', () => {
  it('1x2: no-vig proporcional da Pinnacle; fallback bet365 rotulado', () => {
    const ref = resolvedorReferencia('1x2', ctx())
    const r = ref(0, 'home', null)
    expect(r.src).toBe('pinnacle')
    const h = ds.numericas.get('odds.pinnacle.close.1x2.h')![0], d = ds.numericas.get('odds.pinnacle.close.1x2.d')![0], a = ds.numericas.get('odds.pinnacle.close.1x2.a')![0]
    expect(r.q).toBeCloseTo((1 / h) / (1 / h + 1 / d + 1 / a), 12)
    expect(r.odd).toBe(h)
    const semPin = ref(6, 'home', null) // i % 7 === 6 não tem Pinnacle
    expect(semPin.src).toBe('bet365')
  })
  it('O/U: só quando a linha coincide; AH idem; dc soma probabilidades do 1x2', () => {
    const ou = resolvedorReferencia('ou', ctx())
    expect(ou(0, 'over', 2.5).src).toBe('pinnacle')
    expect(ou(0, 'over', 3.5).src).toBeNull()
    const ah = resolvedorReferencia('ah', ctx())
    expect(ah(0, 'home', -0.5).q).toBeGreaterThan(0)
    expect(ah(0, 'home', -1).src).toBeNull()
    const dc = resolvedorReferencia('dc', ctx())
    const p1x = dc(0, '1x', null)
    const um = resolvedorReferencia('1x2', ctx())
    expect(p1x.q).toBeCloseTo(um(0, 'home', null).q + um(0, 'draw', null).q, 12)
  })
  it('sem nenhuma casa → q NaN', () => {
    expect(resolvedorReferencia('corners', ctx())(0, 'over', 9.5).q).toBeNaN()
  })
})

describe('campos que as entradas pedem', () => {
  it('camposDaEntrada cobre todas as seleções e a linha principal', () => {
    const c = camposDaEntrada({ mercado: 'ou', selecao: 'over', preco: { casa: 'pinnacle', snapshot: 'close' } })
    expect(c).toEqual(expect.arrayContaining(['odds.pinnacle.close.ou.over_main', 'odds.pinnacle.close.ou.under_main', 'odds.pinnacle.close.ou.main_line']))
    expect(camposDaEntrada({ mercado: 'ou', selecao: 'over', linha: 2.5, preco: { casa: 'pinnacle', snapshot: 'close' } })).toEqual(['odds.pinnacle.close.ou.over_2_5', 'odds.pinnacle.close.ou.under_2_5'])
  })
  it('camposReferencia só usa campos do catálogo', () => {
    for (const m of Object.keys(SELECOES_POR_MERCADO) as (keyof typeof SELECOES_POR_MERCADO)[]) for (const k of camposReferencia(m)) expect(cat.ehCampo(k), k).toBe(true)
  })
})
