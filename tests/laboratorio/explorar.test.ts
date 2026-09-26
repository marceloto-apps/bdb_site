import { describe, it, expect } from 'vitest'
import { explorar, ordemTemporada, prepararExploracao, type ApostaBasica } from '@/lib/laboratorio/engine/explorar'
import { executar } from '@/lib/laboratorio/engine/run'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'
import { datasetSintetico } from './sintetico'

const cat = catalogoPadrao()
const ds = datasetSintetico({ n: 600 })
const mandante: ApostaBasica = { rotulo: 'Mandante · bet365', mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }
const over: ApostaBasica = { rotulo: 'Over 2.5 · bet365', mercado: 'ou', selecao: 'over', linha: 2.5, preco: { casa: 'bet365', snapshot: 'close' } }
const cel = (r: ReturnType<typeof explorar>, comp: string, temp: string, aposta: string, faixa = -1) => r.celulas.find((c) => c.competicao === comp && c.temporada === temp && c.aposta === aposta && c.faixa === faixa)

describe('explorador de vantagens', () => {
  it('células por liga × temporada somam o total e batem com um run do Laboratório', () => {
    const r = explorar(prepararExploracao({ apostas: [mandante, over] }, cat), ds, { nomesCompeticoes: new Map([['comp-a', 'Liga A']]) })
    expect(r.apostas).toEqual(['Mandante · bet365', 'Over 2.5 · bet365'])
    expect(r.competicoes.map((c) => c.nome)).toEqual(['comp-b', 'Liga A'])
    expect(r.competicoes[1].temporadas).toEqual(['2024', '2025'])
    expect(r.faixas).toEqual([]); expect(r.cruzamento).toBeNull()
    const total = cel(r, '*', '*', 'Mandante · bet365')!
    const porLiga = r.celulas.filter((c) => c.competicao !== '*' && c.temporada === '*' && c.aposta === 'Mandante · bet365')
    const porTemp = r.celulas.filter((c) => c.competicao !== '*' && c.temporada !== '*' && c.aposta === 'Mandante · bet365')
    expect(porLiga.reduce((s, c) => s + c.n, 0)).toBe(total.n)
    expect(porTemp.reduce((s, c) => s + c.n, 0)).toBe(total.n)
    expect(porTemp.reduce((s, c) => s + c.lucro, 0)).toBeCloseTo(total.lucro, 2)
    // mesmo resultado que apostar em tudo pelo Laboratório (stake flat 1, sem regra)
    const run = executar({ versao: 1, entradas: [{ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }], staking: { metodo: 'flat', unidade: 1 }, bootstrap: 0 }, ds, { catalogo: cat })
    expect(total.n).toBe(run.kpis.n)
    expect(total.lucro).toBeCloseTo(run.kpis.lucro, 3)
    expect(total.yield).toBeCloseTo(run.kpis.yield, 3)
    expect(total.hitRate).toBeCloseTo(run.kpis.hitRate, 3)
    expect(total.clvNovigMedio).toBeCloseTo(run.clv.clvNovigMedio, 3)
    expect(total.pValor).toBeGreaterThanOrEqual(0); expect(total.pValor).toBeLessThanOrEqual(1)
    expect(r.nUniverso).toBe(600)
  })
  it('cruzamento por tercis: 3 faixas com contagens parecidas, células por faixa somam a célula "todas"', () => {
    const r = explorar(prepararExploracao({ apostas: [mandante], cruzamento: { rotulo: 'Forma do mandante', formula: 'home.l5.pts_pg' } }, cat), ds)
    expect(r.faixas).toHaveLength(3)
    expect(r.faixas.map((f) => f.rotulo.split(' ')[0])).toEqual(['Baixo', 'Médio', 'Alto'])
    const soma = r.faixas.reduce((s, f) => s + f.n, 0)
    expect(soma + (r.cruzamento?.semDado ?? 0)).toBe(600)
    for (const f of r.faixas) expect(Math.abs(f.n - 200)).toBeLessThan(5)
    expect(r.faixas[0].de).toBeNull(); expect(r.faixas[2].ate).toBeNull(); expect(r.faixas[1].de).toBe(r.faixas[0].ate)
    const todas = cel(r, '*', '*', 'Mandante · bet365', -1)!
    const porFaixa = [0, 1, 2].map((f) => cel(r, '*', '*', 'Mandante · bet365', f)!)
    expect(porFaixa.reduce((s, c) => s + c.n, 0)).toBe(todas.n)
    expect(porFaixa.reduce((s, c) => s + c.lucro, 0)).toBeCloseTo(todas.lucro, 2)
    expect(r.cruzamento?.tipo).toBe('points')
  })
  it('cruzamento booleano vira Não/Sim; quartis e cortes explícitos', () => {
    const b = explorar(prepararExploracao({ apostas: [mandante], cruzamento: { rotulo: 'Favorito', formula: 'odds.bet365.close.1x2.h < odds.bet365.close.1x2.a' } }, cat), ds)
    expect(b.faixas.map((f) => f.rotulo)).toEqual(['Não', 'Sim'])
    const q = explorar(prepararExploracao({ apostas: [mandante], cruzamento: { rotulo: 'Odd', formula: 'odds.bet365.close.1x2.h', cortes: 'quartis' } }, cat), ds)
    expect(q.faixas).toHaveLength(4)
    const c = explorar(prepararExploracao({ apostas: [mandante], cruzamento: { rotulo: 'Odd', formula: 'odds.bet365.close.1x2.h', cortes: [1.8, 2.5] } }, cat), ds)
    expect(c.faixas.map((f) => f.rotulo)).toEqual(['< 1.8', '1.8 – 2.5', '≥ 2.5'])
    expect(c.faixas[0].n + c.faixas[1].n + c.faixas[2].n).toBe(600)
  })
  it('universo e validação: filtro de temporada reduz as células; aposta inválida e fórmula errada são erros', () => {
    const r = explorar(prepararExploracao({ apostas: [mandante], universo: { temporadasLabel: ['2025'] } }, cat), ds)
    expect(r.competicoes.every((c) => c.temporadas.length === 1 && c.temporadas[0] === '2025')).toBe(true)
    expect(() => prepararExploracao({ apostas: [] }, cat)).toThrow(/pelo menos uma/)
    expect(() => prepararExploracao({ apostas: [{ ...mandante, selecao: 'over' }] }, cat)).toThrow()
    expect(() => prepararExploracao({ apostas: [mandante], cruzamento: { rotulo: 'x', formula: 'campo.que.nao.existe' } }, cat)).toThrow()
  })
  it('ordem de temporadas segue a data de início', () => {
    expect(['25/26', '2024', '2025', '24/25', '2026'].sort(ordemTemporada)).toEqual(['2024', '24/25', '2025', '25/26', '2026'])
  })
})

describe('UI do explorador', () => {
  it('todas as estatísticas e apostas da cesta compilam contra o catálogo', async () => {
    const { CESTA, ESTATISTICAS, apostasDaCesta } = await import('@/lib/laboratorio/ui/explorador')
    const apostas = apostasDaCesta(CESTA.map((c) => c.id), ['bet365', 'pinnacle'])
    expect(apostas).toHaveLength(CESTA.length * 2)
    expect(() => prepararExploracao({ apostas }, cat)).not.toThrow()
    for (const e of ESTATISTICAS) expect(() => prepararExploracao({ apostas: [mandante], cruzamento: { rotulo: e.rotulo, formula: e.formula } }, cat), e.id).not.toThrow()
  })
  it('célula → estratégia: universo, aposta, regra da faixa e selo fechado', async () => {
    const { estrategiaDaCelula, regraDaFaixa, limiarSidak, pDeflacionado, persistencia, indexarCelulas } = await import('@/lib/laboratorio/ui/explorador')
    const { prepararEstrategia } = await import('@/lib/laboratorio/engine/estrategia')
    const cruz = { rotulo: 'Forma do mandante', formula: 'home.l5.pts_pg', cortes: 'tercis' as const }
    const r = explorar(prepararExploracao({ apostas: [mandante, over], cruzamento: cruz, universo: { fontes: ['core'], tipos: ['LEAGUE'] } }, cat), ds, { nomesCompeticoes: new Map([['comp-a', 'Liga A']]) })
    const ui = JSON.parse(JSON.stringify(r, (_k, v) => (typeof v === 'number' && Number.isNaN(v) ? null : v)))
    const c = cel(r, 'comp-a', '2025', 'Over 2.5 · bet365', 2)!
    const e = estrategiaDaCelula(ui, c, { fontes: ['core'], tipos: ['LEAGUE'] }, [mandante, over], cruz)
    expect(e.universo).toEqual({ fontes: ['core'], tipos: ['LEAGUE'], competicoes: ['comp-a'], temporadasLabel: ['2025'] })
    expect(e.entradas[0]).toMatchObject({ mercado: 'ou', selecao: 'over', linha: 2.5, preco: { casa: 'bet365', snapshot: 'close' } })
    expect(e.regra?.formula).toMatch(/^home\.l5\.pts_pg >= [\d.]+$/)
    expect(e.validacao?.holdout).toBe('selado')
    expect(e.nome).toContain('Liga A 2025')
    // a estratégia compila e reproduz a célula
    const run = executar({ ...e, universo: { ...e.universo, temporadasExcluidas: undefined }, bootstrap: 0 }, ds, { catalogo: cat })
    expect(run.kpis.n).toBe(c.n)
    expect(run.kpis.lucro).toBeCloseTo(c.lucro, 3)
    expect(() => prepararEstrategia(e, cat)).not.toThrow()
    // faixa do meio tem os dois limites; booleano vira not/afirmativo
    expect(regraDaFaixa(cruz, 'points', { de: 1, ate: 2, rotulo: 'x' }, 1)).toBe('home.l5.pts_pg >= 1 and home.l5.pts_pg < 2')
    expect(regraDaFaixa({ rotulo: 'f', formula: 'a < b' }, 'bool', { de: null, ate: 0.5, rotulo: 'Não' }, 0)).toBe('not (a < b)')
    expect(regraDaFaixa({ rotulo: 'f', formula: 'a - b' }, 'ratio', { de: 0.5, ate: null, rotulo: 'x' }, 2)).toBe('(a - b) >= 0.5')
    // deflação e persistência
    expect(limiarSidak(1)).toBe(0.05); expect(limiarSidak(100)).toBeLessThan(0.001)
    expect(pDeflacionado(0.01, 10)).toBeCloseTo(1 - 0.99 ** 10, 6)
    const idx = indexarCelulas(ui)
    const p = persistencia(idx, { key: 'comp-a', temporadas: ['2024', '2025'] }, 'Mandante · bet365', -1, 30)
    expect(p.total).toBe(2); expect(p.positivas).toBeLessThanOrEqual(2)
  })
})
