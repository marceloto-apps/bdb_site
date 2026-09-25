import { describe, it, expect } from 'vitest'
import { executar, serializarRun } from '@/lib/laboratorio/engine/run'
import { ErroEstrategia, prepararEstrategia } from '@/lib/laboratorio/engine/estrategia'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'
import { liquidarAposta } from '@/lib/ferramentas/backtest/settlement'
import type { Estrategia } from '@/lib/laboratorio/engine/tipos'
import { datasetSintetico } from './sintetico'

const cat = catalogoPadrao()
const ds = datasetSintetico({ n: 400 })
const base = (extra: Partial<Estrategia> = {}): Estrategia => ({ versao: 1, entradas: [{ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }], staking: { metodo: 'flat', unidade: 1 }, bootstrap: 100, ...extra })
const rodar = (e: Estrategia) => executar(e, ds, { catalogo: cat })

describe('preparação da estratégia', () => {
  it('coleta todos os erros de uma vez', () => {
    try {
      prepararEstrategia({ versao: 1, indicadores: [{ nome: 'x', expressao: { formula: 'foo + 1' } }], regra: { formula: 'x >' }, entradas: [{ mercado: 'ou', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }], staking: { metodo: 'flat', unidade: 0 } }, cat)
      expect.unreachable()
    } catch (e) {
      const err = e as ErroEstrategia
      expect(err).toBeInstanceOf(ErroEstrategia)
      expect(err.erros.length).toBeGreaterThanOrEqual(4)
      expect(err.erros.join('\n')).toMatch(/foo/); expect(err.erros.join('\n')).toMatch(/Regra/); expect(err.erros.join('\n')).toMatch(/seleção home inválida/); expect(err.erros.join('\n')).toMatch(/unidade/)
    }
  })
  it('ordena indicadores por dependência e detecta ciclo', () => {
    const ec = prepararEstrategia(base({ indicadores: [{ nome: 'b', expressao: { formula: 'a * 2' } }, { nome: 'a', expressao: { formula: 'odds.bet365.close.1x2.h' } }] }), cat)
    expect(ec.indicadores.map((i) => i.nome)).toEqual(['a', 'b'])
    expect(ec.indicadores[1].tipo).toBe('odd')
    expect(() => prepararEstrategia(base({ indicadores: [{ nome: 'a', expressao: { formula: 'b' } }, { nome: 'b', expressao: { formula: 'a' } }] }), cat)).toThrow(/circular/)
  })
  it('lista os campos usados (base + fórmulas + odds das entradas + referência)', () => {
    const ec = prepararEstrategia(base({ regra: { formula: 'home.l5.pts_pg > 1.5' } }), cat)
    expect(ec.camposUsados).toEqual(expect.arrayContaining(['match.id', 'match.ft_h', 'home.l5.pts_pg', 'odds.bet365.close.1x2.h', 'odds.bet365.close.1x2.a', 'odds.pinnacle.close.1x2.h']))
  })
  it('avisa look-ahead: perna na abertura com fórmula que lê o fechamento', () => {
    const ec = prepararEstrategia(base({ indicadores: [{ nome: 'edge_h', expressao: { formula: 'odds.bet365.open.1x2.h * odds.pinnacle.close.1x2.novig_h - 1' } }], regra: { formula: 'edge_h > 0' }, entradas: [{ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'open' } }] }), cat)
    expect(ec.avisos.some((a) => a.tipo === 'leakage')).toBe(true)
    const ok = prepararEstrategia(base({ regra: { formula: 'derived.pinnacle.move_1x2_h < -0.05' }, entradas: [{ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }] }), cat)
    expect(ok.avisos.some((a) => a.tipo === 'leakage')).toBe(false)
    const mov = prepararEstrategia(base({ regra: { formula: 'derived.pinnacle.move_1x2_h < -0.05' }, entradas: [{ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'open' } }] }), cat)
    expect(mov.avisos.some((a) => a.tipo === 'leakage')).toBe(true)
  })
  it('AST do builder visual vence a fórmula', () => {
    const ec = prepararEstrategia(base({ regra: { formula: 'quebrada (', ast: { t: 'bin', op: '>', a: { t: 'id', nome: 'home.l5.pts_pg' }, b: { t: 'num', v: 1 } } } }), cat)
    expect(ec.regra).toMatchObject({ t: 'bin', op: '>' })
  })
  it('valida staking e universo', () => {
    expect(() => prepararEstrategia(base({ staking: { metodo: 'kelly', fracao: 0.5, prob: { formula: 'odds.bet365.close.1x2.h' } }, bancoInicial: 100 }), cat)).toThrow(/probabilidade/)
    expect(() => prepararEstrategia(base({ staking: { metodo: 'pct_banco', pct: 0.02 } }), cat)).toThrow(/bancoInicial/)
    expect(() => prepararEstrategia(base({ universo: { de: '2025-01-01', ate: '2024-01-01' } }), cat)).toThrow(/data inicial/)
    expect(() => prepararEstrategia(base({ universo: { coberturaMinima: ['nao.existe'] } }), cat)).toThrow(/cobertura/)
  })
})

describe('run ponta a ponta (dataset sintético)', () => {
  it('flat 1u no mandante em todos os jogos: paridade jogo a jogo com liquidarAposta', () => {
    const r = rodar(base())
    const h = ds.numericas.get('odds.bet365.close.1x2.h')!, fh = ds.numericas.get('match.ft_h')!, fa = ds.numericas.get('match.ft_a')!
    expect(r.nUniverso).toBe(ds.n); expect(r.nSelecionados).toBe(ds.n)
    expect(r.nApostas).toBe(ds.n)
    let lucro = 0
    for (const a of r.apostas) {
      if (a.resultado === 'VOID') { expect(Number.isNaN(fh[a.i])).toBe(true); continue }
      const leg = liquidarAposta({ market: '1X2', betSide: 'HOME', stake: 1, odd: h[a.i], fthg: fh[a.i], ftag: fa[a.i] })
      expect(a.resultado).toBe(leg.outcome); expect(a.pnl).toBeCloseTo(leg.pnl, 4)
      lucro += leg.pnl
    }
    expect(r.kpis.lucro).toBeCloseTo(lucro, 3)
    expect(r.kpis.voids).toBe(1)
    expect(r.apostas.map((a) => a.data)).toEqual(r.apostas.map((a) => a.data).slice().sort((x, y) => x - y))
  })
  it('apostar no fechamento Pinnacle dá CLV bruto 0 e CLV no-vig ≈ −margem', () => {
    const r = rodar(base({ entradas: [{ mercado: '1x2', selecao: 'home', preco: { casa: 'pinnacle', snapshot: 'close' } }] }))
    const com = r.apostas.filter((a) => a.refSrc === 'pinnacle')
    expect(com.length).toBeGreaterThan(300)
    for (const a of com.slice(0, 50)) { expect(a.clvBruto).toBeCloseTo(0, 9); expect(a.clvNovig).toBeLessThan(0) }
    expect(r.clv.beatRate).toBe(0)
  })
  it('regra, universo e indicadores filtram; avisos de amostra e cobertura', () => {
    const r = rodar(base({
      universo: { competicoes: ['comp-a'], temporadasLabel: ['2025'], excluirRodadasIniciais: 2 },
      indicadores: [{ nome: 'edge_h', expressao: { formula: 'odds.bet365.close.1x2.h * odds.pinnacle.close.1x2.novig_h - 1' } }],
      regra: { formula: 'edge_h > -0.06 and home.l20.gf > 0' },
    }))
    expect(r.nUniverso).toBeLessThan(ds.n / 2)
    expect(r.nApostas).toBe(0) // home.l20.gf não existe → NaN → falso
    expect(r.avisos.some((a) => a.tipo === 'cobertura' && a.campo === 'home.l20.gf')).toBe(true)
    const r2 = rodar(base({ universo: { competicoes: ['comp-a'] }, indicadores: [{ nome: 'edge_h', expressao: { formula: 'odds.bet365.close.1x2.h * odds.pinnacle.close.1x2.novig_h - 1' } }], regra: { formula: 'edge_h > -0.06' } }))
    expect(r2.nApostas).toBeGreaterThan(0); expect(r2.nApostas).toBeLessThan(r2.nUniverso)
    expect(r2.avisos.some((a) => a.tipo === 'amostra')).toBe(true)
    expect(r2.apostas.every((a) => a.competicao === 'comp-a')).toBe(true)
  })
  it('os 5 exemplos do plano rodam (adaptados ao catálogo)', () => {
    const exemplos: Partial<Estrategia>[] = [
      { indicadores: [{ nome: 'edge_h', expressao: { formula: 'odds.bet365.open.1x2.h * odds.pinnacle.close.1x2.novig_h - 1' } }], regra: { formula: 'edge_h > -0.04' }, entradas: [{ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'open' } }] }, // margem sintética de 5%: edge fica em torno de −4,8%
      { regra: { formula: 'odds.pinnacle.close.1x2.h / odds.pinnacle.open.1x2.h < 0.97 and home.l5.pts_pg >= 1.8' } },
      { parametros: { p1: -0.05 }, regra: { formula: 'model(DC, FORCAS, l10).p_over(2.5) - ifnull(odds.bet365.close.ou.novig_over_main, implied(odds.bet365.close.ou.over_main)) > $p1' }, entradas: [{ mercado: 'ou', selecao: 'over', preco: { casa: 'bet365', snapshot: 'close' } }] },
      { regra: { formula: 'odds.pinnacle.close.ah.main_line <= -0.5 and odds.pinnacle.close.ou.main_line >= 2.5' }, entradas: [{ mercado: 'ah', selecao: 'home', preco: { casa: 'pinnacle', snapshot: 'close' } }] },
      { regra: { formula: '(home.venue.l10.xg_for + away.venue.l10.xg_against) / 2 > 1.4 and implied(odds.bet365.close.ou.over_2_5) < 0.6' }, entradas: [{ mercado: 'ou', selecao: 'over', linha: 2.5, preco: { casa: 'bet365', snapshot: 'close' } }] },
    ]
    for (const e of exemplos) {
      const r = rodar(base(e))
      expect(r.nSelecionados).toBeGreaterThan(0)
      expect(r.hash).toMatch(/^[0-9a-f]{16}$/)
    }
  })
  it('seleção por expressão, duas pernas e mercados de 1º tempo/escanteios/dc', () => {
    const r = rodar(base({ entradas: [
      { id: 'lado', mercado: '1x2', selecao: { formula: 'if(odds.bet365.close.1x2.h < odds.bet365.close.1x2.a, home, away)' }, preco: { casa: 'bet365', snapshot: 'close' } },
      { id: 'dc', mercado: 'dc', selecao: '1x', preco: { casa: 'bet365', snapshot: 'close' }, condicao: { formula: 'match.round > 3' } },
      { id: 'ht', mercado: 'ht_1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } },
    ] }))
    expect(r.apostas.filter((a) => a.entradaId === 'lado').length).toBe(ds.n)
    expect(r.apostas.filter((a) => a.entradaId === 'dc').every((a) => a.selecao === '1x')).toBe(true)
    expect(r.apostas.filter((a) => a.entradaId === 'dc').length).toBeLessThan(ds.n)
    expect(r.apostas.filter((a) => a.entradaId === 'ht').length).toBe(0) // sintético não tem odds de HT
    expect(r.segmentos.entrada.map((s) => s.chave).sort()).toEqual(['dc', 'lado'])
  })
  it('staking % do banco e Kelly percorrem em ordem e respeitam o banco', () => {
    const p = rodar(base({ staking: { metodo: 'pct_banco', pct: 0.05 }, bancoInicial: 100 }))
    expect(p.apostas[0].stake).toBeCloseTo(5)
    for (let i = 1; i < p.apostas.length; i++) expect(p.apostas[i].stake).toBeCloseTo(0.05 * (100 + p.caminho.cumulativo[i - 1]), 6)
    const k = rodar(base({ staking: { metodo: 'kelly', fracao: 0.25, cap: 0.1, prob: { formula: 'odds.pinnacle.close.1x2.novig_h * 1.1' } }, bancoInicial: 1000 })) // probabilidade inflada: no sintético a odd nunca supera a justa
    expect(k.nApostas).toBeGreaterThan(0); expect(k.nApostas).toBeLessThan(ds.n)
    expect(k.apostas.every((a) => a.stake <= 100 + 1e-9)).toBe(true)
    expect(k.avisos.some((a) => a.tipo === 'staking')).toBe(true)
  })
  it('to-win, exposição máxima por dia e stop de drawdown', () => {
    const t = rodar(base({ staking: { metodo: 'to_win', alvo: 10 } }))
    for (const a of t.apostas.slice(0, 20)) expect(a.stake * (a.odd - 1)).toBeCloseTo(10, 6)
    const e = rodar(base({ exposicaoMaxDia: 2.5 }))
    const porDia = new Map<number, number>()
    for (const a of e.apostas) { const d = Math.floor(a.data / 86400000); porDia.set(d, (porDia.get(d) ?? 0) + a.stake) }
    expect(Math.max(...Array.from(porDia.values()))).toBeLessThanOrEqual(2.5 + 1e-9)
    const s = rodar(base({ bancoInicial: 3, stopDrawdown: 0.5 }))
    expect(s.nApostas).toBeLessThan(ds.n)
    expect(s.avisos.some((a) => /Stop de drawdown/.test(a.mensagem))).toBe(true)
  })
  it('resultado é determinístico, serializável e com extras', () => {
    const e = base({ indicadores: [{ nome: 'k', expressao: { formula: 'odds.bet365.close.1x2.h * 2' } }], regra: { formula: 'k > 3' } })
    const a = executar(e, ds, { catalogo: cat, extras: true }), b = executar(e, ds, { catalogo: cat, extras: true })
    expect(a.hash).toBe(b.hash)
    expect(a.inferencia.ic95Yield).toEqual(b.inferencia.ic95Yield)
    expect(a.apostas[0].extras).toHaveProperty('k')
    const s = serializarRun(a) as { caminho: { banco: number[] }; kpis: { yield: number | null } }
    expect(Array.isArray(s.caminho.banco)).toBe(true)
    expect(() => JSON.stringify(s)).not.toThrow()
  })
  it('sem Pinnacle a referência cai para bet365 (soft) com aviso', () => {
    const semPin = datasetSintetico({ n: 100, semPinnacle: true })
    const r = executar(base(), semPin, { catalogo: cat })
    expect(r.clv.refSoft).toBe(1)
    expect(r.avisos.some((a) => a.tipo === 'referencia' && /soft/.test(a.mensagem))).toBe(true)
  })
  it('universo por fonte e tipo de competição', () => {
    const so = rodar(base({ universo: { fontes: ['fpt'] } }))
    expect(so.nUniverso).toBe(ds.n / 5)
    const cup = rodar(base({ universo: { tipos: ['CUP'] } }))
    expect(cup.nUniverso).toBe(0)
    expect(cup.avisos.some((a) => /Nenhum jogo/.test(a.mensagem))).toBe(true)
  })
})
