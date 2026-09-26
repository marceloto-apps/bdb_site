import { describe, it, expect } from 'vitest'
import { executar } from '@/lib/laboratorio/engine/run'
import { prepararEstrategia } from '@/lib/laboratorio/engine/estrategia'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'
import { calibrar, simularMonteCarlo, tEsperadoMaximo, LIMITE_COMBOS } from '@/lib/laboratorio/engine/validacao'
import { normalInv } from '@/lib/laboratorio/engine/matematica'
import { aplicarHoldout, filtroDoUniverso, temporadasHoldout, type Manifest } from '@/lib/laboratorio/data/dataset'
import type { Estrategia } from '@/lib/laboratorio/engine/tipos'
import { datasetSintetico } from './sintetico'

const cat = catalogoPadrao()
const ds = datasetSintetico({ n: 600 })
const base = (extra: Partial<Estrategia> = {}): Estrategia => ({
  versao: 1, regra: { formula: 'odds.bet365.close.1x2.h > 1.6' },
  entradas: [{ id: 'e1', mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }],
  staking: { metodo: 'flat', unidade: 1 }, bancoInicial: 100, bootstrap: 100, seed: 3, ...extra,
})
const holdout = { temporadas: new Map([['comp-a', 'comp-a-2025'], ['comp-b', 'comp-b-2025']]), jogosOcultos: null }
const rodar = (e: Estrategia, extra: Record<string, unknown> = {}) => executar(e, ds, { catalogo: cat, validacao: true, holdout, ...extra })

describe('matemática auxiliar', () => {
  it('normalInv inverte a CDF e E[max] cresce com N', () => {
    expect(normalInv(0.5)).toBeCloseTo(0, 9)
    expect(normalInv(0.975)).toBeCloseTo(1.959964, 5)
    expect(normalInv(0.001)).toBeCloseTo(-3.090232, 5)
    expect(tEsperadoMaximo(1)).toBe(0)
    expect(tEsperadoMaximo(10)).toBeGreaterThan(1.4)
    expect(tEsperadoMaximo(100)).toBeGreaterThan(tEsperadoMaximo(10))
  })
})

describe('holdout selado', () => {
  const manifest = {
    chunks: [
      { competitionKey: 'A', seasonKey: 'A-2024', seasonLabel: '2024', dir: 'a24', linhas: 100, de: '2024-01-01', ate: '2024-12-01', grupos: {} },
      { competitionKey: 'A', seasonKey: 'A-2025', seasonLabel: '2025', dir: 'a25', linhas: 80, de: '2025-01-01', ate: '2025-11-01', grupos: {} },
      { competitionKey: 'B', seasonKey: 'B-2425', seasonLabel: '24/25', dir: 'b2425', linhas: 50, de: '2024-08-01', ate: '2025-05-01', grupos: {} },
    ],
    competicoes: [{ key: 'A', nome: 'A', pais: 'X', nivel: 1, tipo: 'LEAGUE', soFpt: false, incluidaPorPadrao: true, feminino: false, linhas: 180 }, { key: 'B', nome: 'B', pais: 'X', nivel: 1, tipo: 'LEAGUE', soFpt: false, incluidaPorPadrao: true, feminino: false, linhas: 50 }],
    aliases: {}, times: {}, versao: 'v', formato: 1, catalogoVersao: '1', builderVersao: '1', geradoEm: '', totalLinhas: 230,
  } as unknown as Manifest
  it('última temporada por competição e contagem de jogos ocultos', () => {
    const t = temporadasHoldout(manifest)
    expect(t.get('A')).toBe('A-2025'); expect(t.get('B')).toBe('B-2425')
    const r = aplicarHoldout({ competicoes: ['A'] }, 'selado', manifest)
    expect(r.universo?.temporadasExcluidas?.sort()).toEqual(['A-2025', 'B-2425'])
    expect(r.holdout.jogosOcultos).toBe(80)
    const passa = filtroDoUniverso(r.universo, manifest)
    expect(manifest.chunks.filter(passa).map((c) => c.seasonKey)).toEqual(['A-2024'])
    expect(aplicarHoldout({ competicoes: ['A'] }, 'aberto', manifest).universo?.temporadasExcluidas).toBeUndefined()
  })
  it('selado exclui a última temporada do run; aberto reporta as duas partes e a soma bate', () => {
    const tudo = rodar(base({ validacao: { holdout: 'aberto' } }))
    const selado = rodar(base({ universo: { temporadasExcluidas: ['comp-a-2025', 'comp-b-2025'] }, validacao: { holdout: 'selado' } }), { holdout: { ...holdout, jogosOcultos: 300 } })
    expect(selado.nUniverso).toBe(300)
    expect(selado.validacao?.holdout).toMatchObject({ modo: 'selado', jogosOcultos: 300, temporadas: 2 })
    expect(selado.apostas.every((a) => a.temporada === '2024')).toBe(true)
    const h = tudo.validacao!.holdout
    expect(h.modo).toBe('aberto')
    expect(h.anteriores!.n + h.holdout!.n).toBe(tudo.kpis.n)
    expect(h.anteriores!.n).toBe(selado.kpis.n)
    // o hash muda com o holdout (universo diferente) mas não com as outras opções de validação
    const semOpcoes = executar(base({ validacao: { holdout: 'aberto' } }), ds, { catalogo: cat })
    expect(semOpcoes.hash).toBe(tudo.hash)
    expect(selado.hash).not.toBe(tudo.hash)
  })
})

describe('folds e walk-forward', () => {
  it('folds por temporada cobrem todas as apostas; por ano também', () => {
    const r = rodar(base({ validacao: { folds: 'temporada' } }))
    const f = r.validacao!.folds
    expect(f.tipo).toBe('temporada')
    expect(f.itens.map((i) => i.chave)).toEqual(['2024', '2025'])
    expect(f.itens.reduce((s, i) => s + i.n, 0)).toBe(r.kpis.n)
    expect(f.positivos).toBeLessThanOrEqual(f.total)
    for (const i of f.itens) { expect(i.de).toBeLessThanOrEqual(i.ate); expect(Number.isFinite(i.yield)).toBe(true) }
    const ano = rodar(base({ validacao: { folds: 'ano' } })).validacao!.folds
    expect(ano.itens.every((i) => /^\d{4}$/.test(i.chave))).toBe(true)
  })
  it('walk-forward sem parâmetros: K−1 janelas de teste em ordem, OOS = soma dos testes', () => {
    const r = rodar(base({ validacao: { walkForward: { janelas: 4 } } }))
    const w = r.validacao!.walkForward!
    expect(w.otimizado).toBe(false)
    expect(w.janelas).toHaveLength(3)
    for (let k = 1; k < w.janelas.length; k++) expect(w.janelas[k].de).toBeGreaterThanOrEqual(w.janelas[k - 1].ate - 1)
    expect(w.nOos).toBe(w.janelas.reduce((s, j) => s + j.nTeste, 0))
    expect(w.oosCumulativo.length).toBeGreaterThan(0)
    expect(w.oosCumulativo[w.oosCumulativo.length - 1]).toBeCloseTo(w.lucroOos, 3)
  })
  it('walk-forward otimizado escolhe um parâmetro da grade por janela', () => {
    const r = rodar(base({ parametros: { p1: 1.6 }, regra: { formula: 'odds.bet365.close.1x2.h > $p1' }, validacao: { walkForward: { janelas: 3, expandindo: false }, varredura: { p1: { de: 1.4, ate: 2.2, passo: 0.2 } } } }))
    const w = r.validacao!.walkForward!
    expect(w.otimizado).toBe(true)
    expect(w.expandindo).toBe(false)
    expect(w.janelas).toHaveLength(2)
    for (const j of w.janelas) { expect(j.parametros).not.toBeNull(); expect([1.4, 1.6, 1.8, 2, 2.2]).toContain(j.parametros!.p1); expect(j.nTreino).toBeGreaterThan(0) }
    expect(Number.isFinite(w.yieldIs)).toBe(true)
  })
})

describe('varredura, PBO e deflação', () => {
  it('grade completa com métricas por combinação, melhor com n ≥ 30, PBO em [0,1]', () => {
    const r = rodar(base({ parametros: { p1: 1.6, p2: 1 }, regra: { formula: 'odds.bet365.close.1x2.h > $p1 and home.l5.pts_pg >= $p2' }, validacao: { varredura: { p1: { de: 1.4, ate: 2.0, passo: 0.2 }, p2: { de: 0.5, ate: 1.5, passo: 0.5 } } } }))
    const v = r.validacao!.varredura!
    expect(v.parametros).toEqual(['p1', 'p2'])
    expect(v.combos).toHaveLength(4 * 3)
    expect(v.truncada).toBe(false)
    expect(v.melhor!.n).toBeGreaterThanOrEqual(30)
    expect(v.combos.every((c) => c.yield <= v.melhor!.yield || c.n < 30)).toBe(true)
    expect(v.pbo).toBeGreaterThanOrEqual(0); expect(v.pbo).toBeLessThanOrEqual(1)
    expect(v.pboTestes).toBeGreaterThan(0)
    expect(v.heatmap!.x).toEqual([1.4, 1.6, 1.8, 2]); expect(v.heatmap!.y).toEqual([0.5, 1, 1.5])
    expect(v.heatmap!.n[1][1]).toBe(v.combos.find((c) => c.parametros.p1 === 1.6 && c.parametros.p2 === 1)!.n)
    // a combinação igual aos parâmetros da estratégia reproduz o run principal
    const igual = v.combos.find((c) => c.parametros.p1 === 1.6 && c.parametros.p2 === 1)!
    expect(igual.n).toBe(r.kpis.n); expect(igual.lucro).toBeCloseTo(r.kpis.lucro, 3)
    // deflação: N = combos + prévias; p deflacionado ≥ p
    const d = r.validacao!.deflacao
    expect(d.tentativas).toBe(12)
    expect(d.pValorDeflacionado).toBeGreaterThanOrEqual(d.pValor)
    expect(d.tDeflacionado).toBeLessThan(d.tYield)
  })
  it('grade grande é truncada em 200 e tentativas prévias entram na deflação', () => {
    const r = rodar(base({ parametros: { p1: 1.6 }, regra: { formula: 'odds.bet365.close.1x2.h > $p1' }, validacao: { varredura: { p1: { de: 1, ate: 4, passo: 0.01 } } } }), { tentativasPrevias: 7 })
    expect(r.validacao!.varredura!.combos).toHaveLength(LIMITE_COMBOS)
    expect(r.validacao!.varredura!.truncada).toBe(true)
    expect(r.validacao!.deflacao.tentativas).toBe(LIMITE_COMBOS + 7)
  })
  it('sem varredura: N = 1 + prévias e p deflacionado = 1 − (1 − p)^N', () => {
    const r = rodar(base(), { tentativasPrevias: 9 })
    const d = r.validacao!.deflacao
    expect(d.tentativas).toBe(10)
    expect(d.pValorDeflacionado).toBeCloseTo(1 - Math.pow(1 - d.pValor, 10), 3)
    expect(rodar(base()).validacao!.deflacao.pValorDeflacionado).toBeCloseTo(rodar(base()).validacao!.deflacao.pValor, 6)
  })
  it('varredura exige parâmetro existente e faixa válida', () => {
    expect(() => prepararEstrategia(base({ validacao: { varredura: { zz: { de: 1, ate: 2, passo: 0.1 } } } }), cat)).toThrow(/\$zz/)
    expect(() => prepararEstrategia(base({ parametros: { p1: 1 }, validacao: { varredura: { p1: { de: 2, ate: 1, passo: 0.1 } } } }), cat)).toThrow(/faixa/)
    expect(() => prepararEstrategia(base({ validacao: { walkForward: { janelas: 12 } } }), cat)).toThrow(/janelas/)
  })
})

describe('Monte Carlo e seleção aleatória', () => {
  it('quantis ordenados, probabilidades em [0,1], determinístico', () => {
    const r = rodar(base({ validacao: { monteCarlo: { caminhos: 500, ruinaPct: 0.3 } } }))
    const mc = r.validacao!.monteCarlo!
    expect(mc.caminhos).toBe(500); expect(mc.n).toBe(r.kpis.n)
    expect(mc.lucroFinal.p5).toBeLessThanOrEqual(mc.lucroFinal.p50); expect(mc.lucroFinal.p50).toBeLessThanOrEqual(mc.lucroFinal.p95)
    expect(mc.mdd.p50).toBeLessThanOrEqual(mc.mdd.p95); expect(mc.mdd.p95).toBeLessThanOrEqual(mc.mdd.p99)
    expect(mc.probLucro).toBeGreaterThanOrEqual(0); expect(mc.probLucro).toBeLessThanOrEqual(1)
    expect(mc.probRuina).toBeGreaterThanOrEqual(0); expect(mc.probRuina).toBeLessThanOrEqual(1)
    expect(mc.histograma.reduce((s, b) => s + b.n, 0)).toBe(500)
    expect(mc.amostras).toHaveLength(12)
    const r2 = rodar(base({ validacao: { monteCarlo: { caminhos: 500, ruinaPct: 0.3 } } }))
    expect(r2.validacao!.monteCarlo!.lucroFinal).toEqual(mc.lucroFinal)
    // seleção aleatória: z finito, yield real igual ao flat do run
    const sa = mc.selecaoAleatoria!
    expect(sa.sorteios).toBeGreaterThan(100)
    expect(sa.yieldReal).toBeCloseTo(r.kpis.yieldFlat, 4)
    expect(Number.isFinite(sa.z)).toBe(true)
    expect(sa.pValor).toBeGreaterThanOrEqual(0); expect(sa.pValor).toBeLessThanOrEqual(1)
  })
  it('stake por % do banco: ruína contada e mdd em % presente', () => {
    const r = rodar(base({ staking: { metodo: 'pct_banco', pct: 0.3 }, bancoInicial: 100, validacao: { monteCarlo: { caminhos: 300, ruinaPct: 0.5 } } }))
    const mc = r.validacao!.monteCarlo!
    expect(Number.isFinite(mc.mddPct.p50)).toBe(true)
    expect(mc.probRuina).toBeGreaterThan(0)
  })
  it('simulação direta: sem variância todos os caminhos dão o mesmo lucro', () => {
    const apostas = Array.from({ length: 50 }, (_, k) => ({ i: k, entradaId: 'e1', matchId: `m${k}`, data: k * 86400000, competicao: 'c', temporada: '2024', home: 'a', away: 'b', mercado: '1x2' as const, selecao: 'home', linha: null, odd: 2, oddLiquidacao: 2, stake: 1, resultado: 'WIN' as const, pnl: 1, qRef: 0.5, oddRef: 2, refSrc: 'pinnacle', ev: 0, clvBruto: 0, clvNovig: 0, clvPontos: 0, banco: 100 + k + 1 }))
    const mc = simularMonteCarlo(apostas, 100, false, 200, 0.5, 1)
    expect(mc.lucroFinal).toEqual({ p5: 50, p25: 50, p50: 50, p75: 50, p95: 50 })
    expect(mc.probLucro).toBe(1); expect(mc.probRuina).toBe(0); expect(mc.mdd.p99).toBe(0)
  })
})

describe('calibração', () => {
  it('a própria referência tem skill 0 e ECE baixo; probabilidade constante calibra mal', () => {
    const r = rodar(base({ validacao: { calibracao: { prob: { formula: 'odds.pinnacle.close.1x2.novig_h' } } } }))
    const c = r.validacao!.calibracao!
    expect(c.n).toBeGreaterThan(50)
    expect(c.brier).toBeCloseTo(c.brierRef, 6)
    expect(c.skill).toBeCloseTo(0, 6)
    expect(c.bins.reduce((s, b) => s + b.n, 0)).toBe(c.n)
    expect(c.ece).toBeLessThan(0.1)
    const ruim = calibrar(r.apostas, () => 0.95, 'const')!
    expect(ruim.brier).toBeGreaterThan(c.brier)
    expect(ruim.skill).toBeLessThan(0)
  })
  it('Kelly usa a própria expressão de probabilidade; odd como probabilidade é erro', () => {
    const r = rodar(base({ staking: { metodo: 'kelly', fracao: 0.25, cap: 0.05, prob: { formula: 'odds.pinnacle.close.1x2.novig_h * 1.1' } }, bancoInicial: 1000 }))
    expect(r.validacao!.calibracao!.formula).toContain('novig_h')
    expect(() => prepararEstrategia(base({ validacao: { calibracao: { prob: { formula: 'odds.bet365.close.1x2.h' } } } }), cat)).toThrow(/probabilidade/)
    expect(rodar(base()).validacao!.calibracao).toBeNull()
  })
})
