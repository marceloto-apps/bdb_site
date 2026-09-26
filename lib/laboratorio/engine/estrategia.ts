/**
 * Preparação de uma estratégia: parse das fórmulas (ou uso do AST do builder), resolução de
 * identificadores, ordenação dos indicadores por dependência, validação/tipagem e coleta dos
 * campos que o run precisa carregar. Lança `ErroEstrategia` com todas as mensagens de uma vez.
 */
import { camposReferenciados, ErroExpressao, indicadoresReferenciados, resolver, validar, type No, type Unidade } from './ast'
import { parseExpressao } from './parser'
import { camposDaEntrada, camposReferencia, COM_LINHA, MERCADOS, SELECOES_POR_MERCADO, type EntradaCompilada } from './entradas'
import type { Aviso, Entrada, Estrategia, Expressao } from './tipos'

export interface Catalogo {
  tipoCampo: (key: string) => Unidade | undefined
  ehCampo: (key: string) => boolean
}

export function catalogoDe(campos: { key: string; tipo: string }[]): Catalogo {
  const m = new Map(campos.map((c) => [c.key, c.tipo as Unidade]))
  return { tipoCampo: (k) => m.get(k), ehCampo: (k) => m.has(k) }
}

export class ErroEstrategia extends Error {
  constructor(public erros: string[]) { super(erros.join('\n')); this.name = 'ErroEstrategia' }
}

export interface IndicadorCompilado { nome: string; ast: No; tipo: Unidade; formula?: string }

export interface EstrategiaCompilada {
  estrategia: Estrategia
  /** em ordem de avaliação (dependências primeiro) */
  indicadores: IndicadorCompilado[]
  regra: No | null
  entradas: EntradaCompilada[]
  stakingProb: No | null
  /** expressão de probabilidade para a calibração (validacao.calibracao.prob) */
  calibracaoProb: No | null
  /** campos do catálogo que o run lê (fórmulas + odds das entradas + referência + base) */
  camposUsados: string[]
  avisos: Aviso[]
}

/** Campos lidos sempre (identificação, placar, universo, segmentos). */
export const CAMPOS_BASE = [
  'match.id', 'match.utc_date', 'match.competition', 'match.season', 'match.season_label', 'match.home', 'match.away',
  'match.ft_h', 'match.ft_a', 'match.round', 'match.competition_type', 'match.competition_level', 'match.country',
  'match.src_core', 'match.src_fpt', 'match.src_fs',
]
const CAMPOS_HT = ['match.ht_h', 'match.ht_a']
const CAMPOS_CORNERS = ['match.corners_h', 'match.corners_a']

function astDe(x: Expressao | string, rotulo: string, erros: string[]): No | null {
  if (typeof x === 'string') x = { formula: x }
  if (x.ast) return x.ast as No
  if (!x.formula || !x.formula.trim()) { erros.push(`${rotulo}: fórmula vazia`); return null }
  try { return parseExpressao(x.formula) } catch (e) { erros.push(`${rotulo}: ${(e as Error).message}`); return null }
}

export function prepararEstrategia(e: Estrategia, cat: Catalogo): EstrategiaCompilada {
  const erros: string[] = []
  const avisos: Aviso[] = []
  const nomes = new Set((e.indicadores ?? []).map((i) => i.nome))
  const ctxRes = { ehCampo: cat.ehCampo, indicadores: nomes }
  const tiposInd = new Map<string, Unidade>()
  const ctxVal = { tipoCampo: cat.tipoCampo, tipoIndicador: (n: string) => tiposInd.get(n), parametros: new Set(Object.keys(e.parametros ?? {})) }
  const campos = new Set<string>(CAMPOS_BASE)

  const prepararNo = (x: Expressao | string, rotulo: string): { ast: No; tipo: Unidade } | null => {
    const bruto = astDe(x, rotulo, erros)
    if (!bruto) return null
    let ast: No
    try { ast = resolver(bruto, ctxRes) } catch (err) { erros.push(`${rotulo}: ${(err as ErroExpressao).message}`); return null }
    const v = validar(ast, ctxVal)
    for (const m of v.erros) erros.push(`${rotulo}: ${m}`)
    for (const m of v.avisos) avisos.push({ tipo: 'formula', mensagem: `${rotulo}: ${m}` })
    camposReferenciados(ast).forEach((k) => campos.add(k))
    return { ast, tipo: v.tipo }
  }

  // indicadores: ordena por dependência (Kahn) e detecta ciclos
  const brutos = new Map<string, { ast: No; formula?: string }>()
  for (const ind of e.indicadores ?? []) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ind.nome)) erros.push(`Indicador "${ind.nome}": nome inválido`)
    if (cat.ehCampo(ind.nome)) erros.push(`Indicador "${ind.nome}": nome coincide com um campo do catálogo`)
    const b = astDe(ind.expressao, `Indicador ${ind.nome}`, erros)
    if (!b) continue
    try { brutos.set(ind.nome, { ast: resolver(b, ctxRes), formula: ind.expressao.formula }) } catch (err) { erros.push(`Indicador ${ind.nome}: ${(err as Error).message}`) }
  }
  const deps = new Map<string, Set<string>>()
  brutos.forEach((b, nome) => deps.set(nome, new Set(Array.from(indicadoresReferenciados(b.ast)).filter((d) => brutos.has(d)))))
  const ordem: string[] = []
  const pendentes = new Set(brutos.keys())
  while (pendentes.size) {
    const pronto = Array.from(pendentes).find((n) => Array.from(deps.get(n) ?? []).every((d) => ordem.includes(d)))
    if (!pronto) { erros.push(`Indicadores com dependência circular: ${Array.from(pendentes).join(', ')}`); break }
    ordem.push(pronto); pendentes.delete(pronto)
  }
  const indicadores: IndicadorCompilado[] = []
  for (const nome of ordem) {
    const b = brutos.get(nome) as { ast: No; formula?: string }
    const v = validar(b.ast, ctxVal)
    for (const m of v.erros) erros.push(`Indicador ${nome}: ${m}`)
    for (const m of v.avisos) avisos.push({ tipo: 'formula', mensagem: `Indicador ${nome}: ${m}` })
    camposReferenciados(b.ast).forEach((k) => campos.add(k))
    tiposInd.set(nome, v.tipo)
    indicadores.push({ nome, ast: b.ast, tipo: v.tipo, formula: b.formula })
  }

  // regra
  let regra: No | null = null
  if (e.regra && (e.regra.ast || e.regra.formula?.trim())) {
    const r = prepararNo(e.regra, 'Regra')
    if (r) { regra = r.ast; if (r.tipo !== 'bool' && r.tipo !== 'any' && r.tipo !== 'num') erros.push(`Regra: a expressão deve ser booleana (é ${r.tipo})`) }
  }

  // entradas
  const entradas: EntradaCompilada[] = []
  if (!e.entradas?.length) erros.push('A estratégia precisa de pelo menos uma entrada')
  ;(e.entradas ?? []).forEach((ent, k) => {
    const rot = `Entrada ${k + 1}`
    if (!MERCADOS.includes(ent.mercado)) { erros.push(`${rot}: mercado desconhecido ${ent.mercado}`); return }
    if (!ent.preco || !['bet365', 'pinnacle'].includes(ent.preco.casa) || !['open', 'close'].includes(ent.preco.snapshot)) { erros.push(`${rot}: preço inválido`); return }
    const ec: EntradaCompilada = { entrada: ent, id: ent.id ?? `e${k + 1}`, selecaoFixa: null, selecaoAst: null, linhaFixa: null, linhaAst: null, condicaoAst: null }
    if (typeof ent.selecao === 'string') {
      const s = ent.selecao.toLowerCase()
      if (!SELECOES_POR_MERCADO[ent.mercado].includes(s)) erros.push(`${rot}: seleção ${ent.selecao} inválida para ${ent.mercado}`)
      ec.selecaoFixa = s
    } else {
      const r = prepararNo(ent.selecao, `${rot} (seleção)`)
      if (r) { ec.selecaoAst = r.ast; if (r.tipo !== 'sel' && r.tipo !== 'any') erros.push(`${rot}: a expressão de seleção deve devolver home/away/…`) }
    }
    if (ent.linha === undefined || ent.linha === 'main') ec.linhaFixa = COM_LINHA.includes(ent.mercado) ? 'main' : null
    else if (typeof ent.linha === 'number') {
      if (!COM_LINHA.includes(ent.mercado)) erros.push(`${rot}: ${ent.mercado} não usa linha`)
      if (ent.mercado === 'eh' && (!Number.isInteger(ent.linha) || ent.linha === 0 || Math.abs(ent.linha) > 3)) erros.push(`${rot}: handicap europeu aceita −3..−1 e 1..3`)
      ec.linhaFixa = ent.linha
    } else {
      const r = prepararNo(ent.linha, `${rot} (linha)`)
      if (r) ec.linhaAst = r.ast
    }
    if (ent.mercado === 'eh' && ec.linhaFixa === 'main') erros.push(`${rot}: handicap europeu exige linha inteira`)
    if (ent.condicao && (ent.condicao.ast || ent.condicao.formula?.trim())) {
      const r = prepararNo(ent.condicao, `${rot} (condição)`)
      if (r) ec.condicaoAst = r.ast
    }
    if (ent.slippage !== undefined && (ent.slippage < 0 || ent.slippage >= 1)) erros.push(`${rot}: slippage deve estar em [0, 1)`)
    if (ent.oddMin !== undefined && ent.oddMax !== undefined && ent.oddMin > ent.oddMax) erros.push(`${rot}: oddMin > oddMax`)
    for (const c of camposDaEntrada(ent)) campos.add(c)
    for (const c of camposReferencia(ent.mercado)) campos.add(c)
    if (ent.mercado.startsWith('ht_')) for (const c of CAMPOS_HT) campos.add(c)
    if (ent.mercado === 'corners') for (const c of CAMPOS_CORNERS) campos.add(c)
    entradas.push(ec)
  })

  // staking
  let stakingProb: No | null = null
  const s = e.staking
  if (!s) erros.push('Staking ausente')
  else if (s.metodo === 'flat') { if (!(s.unidade > 0)) erros.push('Staking flat: unidade deve ser > 0') }
  else if (s.metodo === 'pct_banco') { if (!(s.pct > 0 && s.pct <= 1)) erros.push('Staking % do banco: pct em (0, 1]') }
  else if (s.metodo === 'to_win') { if (!(s.alvo > 0)) erros.push('Staking to-win: alvo > 0') }
  else if (s.metodo === 'kelly') {
    if (!(s.fracao > 0 && s.fracao <= 1)) erros.push('Kelly: fração em (0, 1]')
    const r = prepararNo(s.prob, 'Kelly (probabilidade)')
    if (r) { stakingProb = r.ast; if (r.tipo === 'odd') erros.push('Kelly: a expressão deve ser uma probabilidade, não uma odd') }
  }
  if ((s?.metodo === 'pct_banco' || s?.metodo === 'kelly') && !(e.bancoInicial && e.bancoInicial > 0)) erros.push(`Staking ${s.metodo}: informe bancoInicial > 0`)
  if (e.stopDrawdown !== undefined && !(e.stopDrawdown > 0 && e.stopDrawdown < 1)) erros.push('stopDrawdown deve estar em (0, 1)')

  // validação avançada
  let calibracaoProb: No | null = null
  const va = e.validacao
  if (va?.calibracao?.prob && (va.calibracao.prob.ast || va.calibracao.prob.formula?.trim())) {
    const r = prepararNo(va.calibracao.prob, 'Calibração (probabilidade)')
    if (r) { calibracaoProb = r.ast; if (r.tipo === 'odd') erros.push('Calibração: a expressão deve ser uma probabilidade, não uma odd') }
  }
  if (va?.walkForward && !(Number.isInteger(va.walkForward.janelas) && va.walkForward.janelas >= 2 && va.walkForward.janelas <= 8)) erros.push('Walk-forward: janelas entre 2 e 8')
  for (const [nome, f] of Object.entries(va?.varredura ?? {})) {
    if (!(nome in (e.parametros ?? {}))) erros.push(`Varredura: parâmetro $${nome} não existe em parametros`)
    if (!(f.passo > 0) || !(f.ate >= f.de)) erros.push(`Varredura: faixa inválida para $${nome} (de ≤ até, passo > 0)`)
  }

  // universo
  const u = e.universo
  if (u?.de && u?.ate && u.de > u.ate) erros.push('Universo: data inicial maior que a final')
  for (const c of u?.coberturaMinima ?? []) { if (!cat.ehCampo(c)) erros.push(`Universo: campo de cobertura fora do catálogo: ${c}`); campos.add(c) }

  // leakage: perna decidida na abertura com fórmulas que leem o fechamento (ou derivados que o usam)
  const camposFormulas = new Set<string>()
  for (const ind of indicadores) camposReferenciados(ind.ast).forEach((k) => camposFormulas.add(k))
  if (regra) camposReferenciados(regra).forEach((k) => camposFormulas.add(k))
  if (stakingProb) camposReferenciados(stakingProb).forEach((k) => camposFormulas.add(k))
  if (calibracaoProb) camposReferenciados(calibracaoProb).forEach((k) => camposFormulas.add(k))
  for (const ec of entradas) for (const a of [ec.selecaoAst, ec.linhaAst, ec.condicaoAst]) if (a) camposReferenciados(a).forEach((k) => camposFormulas.add(k))
  const usaFechamento = Array.from(camposFormulas).filter((k) => /\.close\./.test(k) || /^derived\.[a-z0-9_]+\.(move_|line_shift_)/.test(k))
  if (usaFechamento.length) for (const ec of entradas) if (ec.entrada.preco.snapshot === 'open') {
    avisos.push({ tipo: 'leakage', mensagem: `Entrada ${ec.id} decide na abertura, mas a estratégia lê o fechamento (${usaFechamento.slice(0, 3).join(', ')}${usaFechamento.length > 3 ? ', …' : ''}): o resultado não é reproduzível na hora da aposta (look-ahead)` })
  }

  if (erros.length) throw new ErroEstrategia(erros)
  return { estrategia: e, indicadores, regra, entradas, stakingProb, calibracaoProb, camposUsados: Array.from(campos), avisos }
}

export function unidadeDoIndicador(ec: EstrategiaCompilada, nome: string): Unidade | undefined {
  return ec.indicadores.find((i) => i.nome === nome)?.tipo
}

export type { Entrada }
