import { describe, expect, it } from 'vitest'
import { explorar, prepararExploracao, type ApostaBasica } from '@/lib/laboratorio/engine/explorar'
import { executar } from '@/lib/laboratorio/engine/run'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'
import { prepararEstrategia } from '@/lib/laboratorio/engine/estrategia'
import { parseExpressao } from '@/lib/laboratorio/engine/parser'
import { estrategiaSchema } from '@/lib/laboratorio/api/schemas'
import { estrategiaDaCelula, estrategiaDaInstrucao, instrucaoDaSelecao, lerInstrucao, nomeCompeticao, resumoDaInstrucao, textoDaInstrucao, type CelulaUI, type ResultadoExploracaoUI } from '@/lib/laboratorio/ui/explorador'
import { datasetSintetico } from './sintetico'

const cat = catalogoPadrao()
const ds = datasetSintetico({ n: 600 })
const mandante: ApostaBasica = { rotulo: 'Mandante · bet365', mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }
const over: ApostaBasica = { rotulo: 'Over 2.5 · bet365', mercado: 'ou', selecao: 'over', linha: 2.5, preco: { casa: 'bet365', snapshot: 'close' } }
const cruz = { rotulo: 'Forma do mandante', formula: 'home.l5.pts_pg', cortes: 'tercis' as const }
const universo = { tipos: ['LEAGUE'] as ('LEAGUE' | 'CUP' | 'INTERNATIONAL_CLUBS')[] }
const info = new Map([['comp-a', { tipo: 'LEAGUE', feminino: false, pais: 'Brasil' }], ['comp-b', { tipo: 'LEAGUE', feminino: false, pais: 'Itália' }]])
const nomes = new Map([['comp-a', 'Liga A'], ['comp-b', 'Serie B']])
const paraUI = (r: ReturnType<typeof explorar>): ResultadoExploracaoUI => JSON.parse(JSON.stringify(r, (_k, v) => (typeof v === 'number' && Number.isNaN(v) ? null : v)))
const cel = (r: ResultadoExploracaoUI, comp: string, temp: string, aposta: string, faixa = -1): CelulaUI => { const c = r.celulas.find((c) => c.competicao === comp && c.temporada === temp && c.aposta === aposta && c.faixa === faixa); if (!c) throw new Error('célula não encontrada'); return c }
const rodar = (e: ReturnType<typeof estrategiaDaInstrucao>) => executar({ ...e, universo: { ...e.universo, temporadasExcluidas: undefined }, bootstrap: 0 }, ds, { catalogo: cat })

describe('instrução da exploração', () => {
  const r = paraUI(explorar(prepararExploracao({ apostas: [mandante, over], cruzamento: cruz, universo }, cat), ds, { competicoesInfo: info, nomesCompeticoes: nomes }))
  const rSemCruz = paraUI(explorar(prepararExploracao({ apostas: [mandante, over], universo }, cat), ds, { competicoesInfo: info, nomesCompeticoes: nomes }))

  it('competições trazem o país e o nome composto', () => {
    expect(r.competicoes.find((c) => c.key === 'comp-b')?.pais).toBe('Itália')
    expect(nomeCompeticao({ nome: 'Serie B', pais: 'Itália' })).toBe('Serie B (Itália)')
    expect(nomeCompeticao({ nome: 'X' })).toBe('X')
    expect(nomeCompeticao(undefined, 'chave')).toBe('chave')
  })
  it('texto = cabeçalho legível + JSON; lerInstrucao aceita o texto completo ou só o JSON', () => {
    const c1 = cel(r, 'comp-a', '*', 'Mandante · bet365', 2), c2 = cel(r, 'comp-b', '*', 'Over 2.5 · bet365', 0)
    const i = instrucaoDaSelecao(r, [c1, c2], universo, [mandante, over], cruz, 'sint-1')
    expect(i.apostas.map((a) => a.rotulo)).toEqual(['Mandante · bet365', 'Over 2.5 · bet365'])
    expect(i.cruzamento).toMatchObject({ rotulo: 'Forma do mandante', formula: 'home.l5.pts_pg' })
    expect(i.faixas).toHaveLength(3)
    expect(i.celulas[1]).toMatchObject({ competicao: 'comp-b', nome: 'Serie B', pais: 'Itália', temporada: '*', aposta: 'Over 2.5 · bet365', faixa: 0 })
    const texto = textoDaInstrucao(i)
    const linhas = texto.split('\n')
    expect(linhas[0]).toMatch(/^# Exploração do Laboratório · dados sint-1/)
    expect(linhas.filter((l) => l.startsWith('# - '))).toHaveLength(2)
    expect(linhas[1]).toBe('# Apostas: Mandante · bet365, Over 2.5 · bet365')
    expect(resumoDaInstrucao(i).some((l) => /Serie B \(Itália\) · Over 2\.5 · bet365 · Baixo/.test(l))).toBe(true)
    expect(lerInstrucao(texto)).toEqual(JSON.parse(JSON.stringify(i)))
    expect(lerInstrucao(JSON.stringify(i))).toEqual(JSON.parse(JSON.stringify(i)))
    expect(lerInstrucao(`  ruído antes ${JSON.stringify(i)} ruído depois`)).toEqual(JSON.parse(JSON.stringify(i)))
    expect(() => lerInstrucao('# só cabeçalho')).toThrow(/Não encontrei/)
    expect(() => lerInstrucao('{ v: 1 }')).toThrow(/malformado/)
    expect(() => lerInstrucao('{"v":1,"apostas":[],"celulas":[]}')).toThrow(/Instrução inválida/)
  })
  it('uma liga, uma faixa: mesma estratégia da célula, reproduz a célula, e o esquema aceita "exploracao"', () => {
    const c = cel(r, 'comp-a', '2025', 'Over 2.5 · bet365', 2)
    const i = instrucaoDaSelecao(r, [c], universo, [mandante, over], cruz)
    const e = estrategiaDaInstrucao(i)
    expect(e.universo).toEqual({ tipos: ['LEAGUE'], competicoes: ['comp-a'], temporadasLabel: ['2025'] })
    expect(e.entradas).toEqual([{ id: 'e1', mercado: 'ou', selecao: 'over', linha: 2.5, preco: { casa: 'bet365', snapshot: 'close' } }])
    expect(e.regra?.formula).toMatch(/^home\.l5\.pts_pg >= [\d.]+$/)
    expect(e.nome).toBe('Exploração: Over 2.5 · bet365 · Liga A (Brasil) · Forma do mandante')
    expect(e.validacao?.holdout).toBe('selado')
    expect(e.exploracao).toBe(i)
    const run = rodar(e)
    expect(run.kpis.n).toBe(c.n); expect(run.kpis.lucro).toBeCloseTo(c.lucro as number, 3)
    expect(estrategiaSchema.safeParse(e).success).toBe(true)
    // estrategiaDaCelula gera a mesma regra/universo e anexa a instrução
    const ec = estrategiaDaCelula(r, c, universo, [mandante, over], cruz)
    expect(ec.regra).toEqual(e.regra); expect(ec.universo).toEqual(e.universo)
    expect(ec.exploracao?.celulas).toHaveLength(1); expect(ec.nome).toContain('Liga A (Brasil) 2025')
  })
  it('faixas diferentes por liga → regra por liga com match.competition; reproduz a soma das células', () => {
    const c1 = cel(r, 'comp-a', '*', 'Mandante · bet365', 0), c2 = cel(r, 'comp-b', '*', 'Mandante · bet365', 2), c3 = cel(r, 'comp-b', '*', 'Mandante · bet365', 1)
    const e = estrategiaDaInstrucao(instrucaoDaSelecao(r, [c1, c2, c3], universo, [mandante, over], cruz))
    expect(e.universo?.competicoes).toEqual(['comp-a', 'comp-b']); expect(e.universo?.temporadasLabel).toBeUndefined()
    expect(e.entradas).toHaveLength(1)
    expect(e.regra?.formula).toMatch(/^\(match\.competition == "comp-a" and \(home\.l5\.pts_pg < [\d.]+\)\) or \(match\.competition == "comp-b" and \(\(home\.l5\.pts_pg >= [\d.]+ and home\.l5\.pts_pg < [\d.]+\) or \(home\.l5\.pts_pg >= [\d.]+\)\)\)$/)
    expect(e.nome).toBe('Exploração: Mandante · bet365 · 2 ligas · Forma do mandante')
    expect(() => prepararEstrategia(e, cat)).not.toThrow()
    const run = rodar(e)
    expect(run.kpis.n).toBe((c1.n ?? 0) + (c2.n ?? 0) + (c3.n ?? 0))
    expect(run.kpis.lucro).toBeCloseTo((c1.lucro ?? 0) + (c2.lucro ?? 0) + (c3.lucro ?? 0), 3)
    // chaves com espaço e dois-pontos (ligas só-FPT) entram entre aspas
    expect(() => parseExpressao('match.competition == "fpt:ECUADOR 2"')).not.toThrow()
  })
  it('mesmas faixas em duas ligas → regra simples; liga em "todas as faixas" entra sem restrição', () => {
    const iguais = estrategiaDaInstrucao(instrucaoDaSelecao(r, [cel(r, 'comp-a', '*', 'Mandante · bet365', 2), cel(r, 'comp-b', '*', 'Mandante · bet365', 2)], universo, [mandante, over], cruz))
    expect(iguais.regra?.formula).toMatch(/^home\.l5\.pts_pg >= [\d.]+$/)
    const mista = estrategiaDaInstrucao(instrucaoDaSelecao(r, [cel(r, 'comp-a', '*', 'Mandante · bet365', -1), cel(r, 'comp-b', '*', 'Mandante · bet365', 2)], universo, [mandante, over], cruz))
    expect(mista.regra?.formula).toMatch(/^\(match\.competition == "comp-a"\) or \(match\.competition == "comp-b" and \(home\.l5\.pts_pg >= [\d.]+\)\)$/)
    const soTodas = estrategiaDaInstrucao(instrucaoDaSelecao(r, [cel(r, 'comp-a', '*', 'Mandante · bet365', -1)], universo, [mandante, over], cruz))
    expect(soTodas.regra).toBeUndefined()
  })
  it('"Todas as ligas" não restringe competições; sem cruzamento não há regra; duas apostas viram duas entradas', () => {
    const c1 = cel(rSemCruz, '*', '*', 'Mandante · bet365'), c2 = cel(rSemCruz, '*', '*', 'Over 2.5 · bet365')
    const e = estrategiaDaInstrucao(instrucaoDaSelecao(rSemCruz, [c1, c2], universo, [mandante, over], null))
    expect(e.universo).toEqual({ tipos: ['LEAGUE'] })
    expect(e.regra).toBeUndefined()
    expect(e.entradas.map((x) => x.id)).toEqual(['e1', 'e2'])
    expect(e.nome).toBe('Exploração: 2 apostas · todas as ligas')
    const run = rodar(e)
    expect(run.kpis.n).toBe((c1.n ?? 0) + (c2.n ?? 0))
    // "todas as ligas" numa faixa → regra da faixa sem restrição de liga
    const todasFaixa = estrategiaDaInstrucao(instrucaoDaSelecao(r, [cel(r, '*', '*', 'Mandante · bet365', 1)], universo, [mandante, over], cruz))
    expect(todasFaixa.universo?.competicoes).toBeUndefined()
    expect(todasFaixa.regra?.formula).toMatch(/^home\.l5\.pts_pg >= [\d.]+ and home\.l5\.pts_pg < [\d.]+$/)
  })
  it('a instrução anexada não muda o hash do run', () => {
    const c = cel(r, 'comp-a', '*', 'Mandante · bet365', 2)
    const e = estrategiaDaInstrucao(instrucaoDaSelecao(r, [c], universo, [mandante, over], cruz))
    const com = rodar(e), sem = rodar({ ...e, exploracao: undefined })
    expect(com.hash).toBe(sem.hash)
  })
})
