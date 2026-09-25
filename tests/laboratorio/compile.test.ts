import { describe, it, expect } from 'vitest'
import { avaliarColuna, avaliarMascara, compilar, type ContextoCompilacao } from '@/lib/laboratorio/engine/compile'
import { resolver, CODIGO_SELECAO } from '@/lib/laboratorio/engine/ast'
import { parseExpressao } from '@/lib/laboratorio/engine/parser'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'
import * as M from '@/lib/laboratorio/engine/matematica'
import { datasetSintetico } from './sintetico'

const cat = catalogoPadrao()
const ds = datasetSintetico({ n: 120 })
const ctx = (extra: Partial<ContextoCompilacao> = {}): ContextoCompilacao => ({ dataset: ds, parametros: { p1: 0.05 }, indicadores: new Map(), camposAusentes: new Set(), ...extra })
const ev = (f: string, i = 0, c = ctx(), inds: string[] = []) => compilar(resolver(parseExpressao(f), { ehCampo: cat.ehCampo, indicadores: new Set(inds) }), c)(i)

describe('aritmética, comparação e lógica', () => {
  it('operações básicas', () => {
    expect(ev('1 + 2 * 3')).toBe(7)
    expect(ev('2 ^ 3 ^ 2')).toBe(512)
    expect(ev('-(1 + 2)')).toBe(-3)
    expect(ev('7 / 2')).toBe(3.5)
  })
  it('divisão por zero e overflow viram NaN', () => {
    expect(ev('1 / 0')).toBeNaN()
    expect(ev('10 ^ 400')).toBeNaN()
    expect(ev('log(0)')).toBeNaN()
    expect(ev('sqrt(-1)')).toBeNaN()
  })
  it('NaN propaga na aritmética e nas comparações', () => {
    expect(ev('null + 1')).toBeNaN()
    expect(ev('null > 1')).toBeNaN()
    expect(ev('null == null')).toBeNaN()
  })
  it('and/or com lógica de três valores; not', () => {
    expect(ev('true and false')).toBe(0)
    expect(ev('false and null')).toBe(0)
    expect(ev('true and null')).toBeNaN()
    expect(ev('true or null')).toBe(1)
    expect(ev('false or null')).toBeNaN()
    expect(ev('not true')).toBe(0)
    expect(ev('not null')).toBeNaN()
  })
  it('comparações', () => {
    expect(ev('2 >= 2')).toBe(1); expect(ev('2 > 2')).toBe(0); expect(ev('1 != 2')).toBe(1); expect(ev('1 == 1')).toBe(1)
  })
})

describe('campos, parâmetros, indicadores e texto', () => {
  it('lê colunas numéricas e usa parâmetros', () => {
    expect(ev('odds.bet365.close.1x2.h', 5)).toBe(ds.numericas.get('odds.bet365.close.1x2.h')![5])
    expect(ev('$p1 * 2')).toBeCloseTo(0.1)
  })
  it('campo do catálogo ausente no dataset vira NaN e é registrado', () => {
    const c = ctx()
    expect(ev('home.l20.gf + 1', 0, c)).toBeNaN()
    expect(c.camposAusentes.has('home.l20.gf')).toBe(true)
  })
  it('indicador previamente avaliado', () => {
    const c = ctx()
    c.indicadores.set('dobro', avaliarColuna(resolver(parseExpressao('odds.bet365.close.1x2.h * 2'), { ehCampo: cat.ehCampo, indicadores: new Set() }), c))
    expect(ev('dobro / 2', 3, c, ['dobro'])).toBeCloseTo(ds.numericas.get('odds.bet365.close.1x2.h')![3])
  })
  it('comparação de texto com seleção e com string', () => {
    const fav = ds.textos.get('derived.pinnacle.fav_side')!
    const i = fav.findIndex((v) => v === 'home')
    expect(ev('derived.pinnacle.fav_side == home', i)).toBe(1)
    expect(ev('derived.pinnacle.fav_side != home', i)).toBe(0)
    expect(ev("match.competition_type == 'LEAGUE'", i)).toBe(1)
    expect(ev("match.competition == 'comp-a'", 0)).toBe(1)
    expect(ev("match.competition == 'comp-a'", 1)).toBe(0)
  })
  it('seleções como códigos', () => {
    expect(ev('if(1 > 0, home, away)')).toBe(CODIGO_SELECAO.home)
    expect(ev('home == home')).toBe(1)
    expect(ev('home == away')).toBe(0)
  })
})

describe('funções', () => {
  it('abs/min/max/round/floor/ceil/clamp/pow', () => {
    expect(ev('abs(-2)')).toBe(2); expect(ev('min(3, 1, 2)')).toBe(1); expect(ev('max(3, 1, 2)')).toBe(3)
    expect(ev('round(2.345, 2)')).toBe(2.35); expect(ev('round(2.5)')).toBe(3)
    expect(ev('floor(2.7)')).toBe(2); expect(ev('ceil(2.1)')).toBe(3)
    expect(ev('clamp(5, 0, 3)')).toBe(3); expect(ev('pow(2, 10)')).toBe(1024)
    expect(ev('min(1, null)')).toBeNaN()
  })
  it('ifnull/coalesce/isnull/if', () => {
    expect(ev('ifnull(null, 9)')).toBe(9); expect(ev('coalesce(null, null, 4, 5)')).toBe(4)
    expect(ev('isnull(null)')).toBe(1); expect(ev('isnull(1)')).toBe(0)
    expect(ev('if(null, 1, 2)')).toBeNaN(); expect(ev('if(0, 1, 2)')).toBe(2)
  })
  it('implied/fair_odd/ev/edge/kelly/quarter/zscore/novig', () => {
    expect(ev('implied(2.5)')).toBe(0.4); expect(ev('fair_odd(0.25)')).toBe(4)
    expect(ev('ev(0.5, 2.2)')).toBeCloseTo(0.1); expect(ev('edge(0.5, 2.5)')).toBeCloseTo(0.1); expect(ev('kelly(0.55, 2)')).toBeCloseTo(0.1)
    expect(ev('quarter(1.1)')).toBe(1); expect(ev('zscore(3, 1, 2)')).toBe(1); expect(ev('zscore(3, 1, 0)')).toBeNaN()
    expect(ev('novig(2, 2)')).toBeCloseTo(0.5)
    expect(ev("novig(2.1, 3.4, 3.6, 'shin')")).toBeCloseTo(M.novig([2.1, 3.4, 3.6], 'shin')[0], 12)
    expect(ev('novig(2, null)')).toBeNaN()
  })
})

describe('model(...)', () => {
  it('p_h + p_d + p_a = 1 e λ dentro dos limites', () => {
    const ph = ev('model(POISSON, MEDIA, l10).p_h', 2), pd = ev('model(POISSON, MEDIA, l10).p_d', 2), pa = ev('model(POISSON, MEDIA, l10).p_a', 2)
    expect(ph + pd + pa).toBeCloseTo(1, 9)
    const lh = ev('model(POISSON, MEDIA, l10).lambda_h', 2)
    expect(lh).toBeCloseTo((ds.numericas.get('home.l10.gf')![2] + ds.numericas.get('away.l10.ga')![2]) / 2, 12)
  })
  it('FORCAS, XG e MERCADO produzem λ coerentes; DC/ZIP/NB somam 1', () => {
    for (const m of ['POISSON', 'DC', 'ZIP', 'NB']) for (const l of ['MEDIA', 'FORCAS', 'XG', 'MERCADO']) {
      const s = ev(`model(${m}, ${l}, l10).p_h + model(${m}, ${l}, l10).p_d + model(${m}, ${l}, l10).p_a`, 4)
      expect(s).toBeCloseTo(1, 9)
    }
    expect(ev('model(POISSON, MERCADO, l10).lambda_h', 4)).toBeCloseTo(ds.numericas.get('derived.pinnacle.market_lambda_h')![4], 12)
  })
  it('p_over/p_under/p_btts/p_ah/p_cs', () => {
    expect(ev('model(POISSON, MEDIA, l10).p_over(2.5) + model(POISSON, MEDIA, l10).p_under(2.5)', 1)).toBeCloseTo(1, 9)
    expect(ev('model(POISSON, MEDIA, l10).p_btts', 1)).toBeGreaterThan(0)
    expect(ev('model(POISSON, MEDIA, l10).p_ah(-0.5, home)', 1)).toBeCloseTo(ev('model(POISSON, MEDIA, l10).p_h', 1), 9)
    expect(ev('model(POISSON, MEDIA, l10).p_cs(1, 1)', 1)).toBeGreaterThan(0)
    expect(ev('model(POISSON, MEDIA, l10).p_ah(-0.5, over)', 1)).toBeNaN()
  })
  it('janela sem dados → NaN', () => {
    expect(ev('model(POISSON, MEDIA, l20).p_h', 1)).toBeNaN()
  })
})

describe('rank e pct_rank', () => {
  it('rank 1 = maior no escopo; pct_rank em (0, 1]', () => {
    const c = ctx()
    const r = avaliarColuna(resolver(parseExpressao('rank(home.l10.gf, league_season)'), { ehCampo: cat.ehCampo, indicadores: new Set() }), c)
    const p = avaliarColuna(resolver(parseExpressao('pct_rank(home.l10.gf, league_season)'), { ehCampo: cat.ehCampo, indicadores: new Set() }), c)
    const gf = ds.numericas.get('home.l10.gf')!
    const grupo = ds.textos.get('match.season')!
    const idx = Array.from({ length: ds.n }, (_, i) => i).filter((i) => grupo[i] === grupo[0])
    const maior = idx.reduce((a, b) => (gf[b] > gf[a] ? b : a))
    expect(r[maior]).toBe(1)
    expect(p[maior]).toBe(1)
    const menor = idx.reduce((a, b) => (gf[b] < gf[a] ? b : a))
    expect(r[menor]).toBe(idx.length)
    expect(p[menor]).toBeCloseTo(1 / idx.length, 12)
  })
  it('escopo day agrupa por dia; nulos ficam nulos', () => {
    const c = ctx()
    const r = avaliarColuna(resolver(parseExpressao('rank(home.l20.gf, day)'), { ehCampo: cat.ehCampo, indicadores: new Set() }), c)
    expect(Array.from(r).every(Number.isNaN)).toBe(true)
    const r2 = avaliarColuna(resolver(parseExpressao('rank(home.l10.gf, day)'), { ehCampo: cat.ehCampo, indicadores: new Set() }), c)
    expect(Math.max(...Array.from(r2))).toBeLessThanOrEqual(4)
  })
})

describe('máscara', () => {
  it('NaN conta como falso', () => {
    const m = avaliarMascara(resolver(parseExpressao('home.l20.gf > 1 or match.round == 1'), { ehCampo: cat.ehCampo, indicadores: new Set() }), ctx())
    const round = ds.numericas.get('match.round')!
    for (let i = 0; i < ds.n; i++) expect(m[i]).toBe(round[i] === 1 ? 1 : 0)
  })
})
