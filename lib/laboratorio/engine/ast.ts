/**
 * AST das expressões do Backtest Livre (§5.2 do plano) + resolução de nomes + validação.
 *
 * O parser (parser.ts) produz nós `id` para qualquer identificador; `resolver()` decide se cada
 * `id` é campo do catálogo, indicador da estratégia, constante de seleção ou escopo de rank.
 * `validar()` aplica os limites (profundidade, nós), a allow-list de funções e a tipagem por
 * unidade (rejeita `odd > prob`, avisa sobre comparações suspeitas).
 *
 * O AST é JSON puro: é o que se persiste na estratégia. Nunca se avalia texto no servidor.
 */

export type OpBin = '+' | '-' | '*' | '/' | '^' | '==' | '!=' | '<' | '<=' | '>' | '>=' | 'and' | 'or'
export type OpUn = 'neg' | 'not'

export type Selecao = 'home' | 'draw' | 'away' | 'over' | 'under' | 'yes' | 'no' | 'dc_1x' | 'dc_x2' | 'dc_12'
export const SELECOES: readonly Selecao[] = ['home', 'draw', 'away', 'over', 'under', 'yes', 'no', 'dc_1x', 'dc_x2', 'dc_12']
/** Código numérico das seleções (as expressões só carregam números). */
export const CODIGO_SELECAO: Record<Selecao, number> = { home: 1, draw: 2, away: 3, over: 4, under: 5, yes: 6, no: 7, dc_1x: 8, dc_x2: 9, dc_12: 10 }
export const SELECAO_POR_CODIGO: Record<number, Selecao> = Object.fromEntries(Object.entries(CODIGO_SELECAO).map(([k, v]) => [v, k as Selecao]))

export type Modelo = 'POISSON' | 'DC' | 'ZIP' | 'NB'
export type MetodoLambda = 'MEDIA' | 'FORCAS' | 'XG' | 'MERCADO'
export type Janela = 'l5' | 'l10' | 'l20' | 'season'
export type Escopo = 'day' | 'round' | 'league_season'
export const MODELOS: readonly Modelo[] = ['POISSON', 'DC', 'ZIP', 'NB']
export const METODOS_LAMBDA: readonly MetodoLambda[] = ['MEDIA', 'FORCAS', 'XG', 'MERCADO']
export const JANELAS: readonly Janela[] = ['l5', 'l10', 'l20', 'season']
export const ESCOPOS: readonly Escopo[] = ['day', 'round', 'league_season']
export const SAIDAS_MODELO = ['p_h', 'p_d', 'p_a', 'p_btts', 'p_over', 'p_under', 'p_ah', 'lambda_h', 'lambda_a', 'p_cs'] as const
export type SaidaModelo = (typeof SAIDAS_MODELO)[number]

export type No =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'id'; nome: string }
  | { t: 'campo'; key: string }
  | { t: 'ind'; nome: string }
  | { t: 'param'; nome: string }
  | { t: 'sel'; v: Selecao }
  | { t: 'bin'; op: OpBin; a: No; b: No }
  | { t: 'un'; op: OpUn; a: No }
  | { t: 'call'; fn: string; args: No[] }
  | { t: 'model'; modelo: Modelo; lambda: MetodoLambda; janela: Janela; saida: SaidaModelo; args: No[] }
  | { t: 'rank'; fn: 'rank' | 'pct_rank'; expr: No; escopo: Escopo }

/** Funções permitidas (allow-list) com aridade [min, max]. */
export const FUNCOES: Record<string, [number, number]> = {
  abs: [1, 1], min: [2, 64], max: [2, 64], log: [1, 1], exp: [1, 1], sqrt: [1, 1], round: [1, 2], quarter: [1, 1],
  clamp: [3, 3], ifnull: [2, 2], coalesce: [2, 64], if: [3, 3],
  implied: [1, 1], novig: [2, 4], fair_odd: [1, 1], ev: [2, 2], edge: [2, 2], kelly: [2, 2], zscore: [3, 3],
  isnull: [1, 1], floor: [1, 1], ceil: [1, 1], pow: [2, 2],
}
export const METODOS_NOVIG = ['proportional', 'power', 'shin', 'odds_ratio'] as const

export const LIMITE_PROFUNDIDADE = 64
export const LIMITE_NOS = 2000

// ────────────────────────────────────────────────────────────────────────────
// Percursos
// ────────────────────────────────────────────────────────────────────────────

export function filhos(no: No): No[] {
  switch (no.t) {
    case 'bin': return [no.a, no.b]
    case 'un': return [no.a]
    case 'call': return no.args
    case 'model': return no.args
    case 'rank': return [no.expr]
    default: return []
  }
}

export function percorrer(no: No, f: (n: No, profundidade: number) => void, profundidade = 0): void {
  f(no, profundidade)
  for (const c of filhos(no)) percorrer(c, f, profundidade + 1)
}

export function contarNos(no: No): { nos: number; profundidade: number } {
  let nos = 0, prof = 0
  percorrer(no, (_, p) => { nos++; if (p > prof) prof = p })
  return { nos, profundidade: prof }
}

/** Campos do catálogo referenciados (inclui os que os modelos e ranks usam implicitamente). */
export function camposReferenciados(no: No, acc = new Set<string>()): Set<string> {
  percorrer(no, (n) => {
    if (n.t === 'campo') acc.add(n.key)
    if (n.t === 'model') for (const k of camposDoModelo(n)) acc.add(k)
    if (n.t === 'rank') for (const k of camposDoEscopo(n.escopo)) acc.add(k)
  })
  return acc
}

export function indicadoresReferenciados(no: No, acc = new Set<string>()): Set<string> {
  percorrer(no, (n) => { if (n.t === 'ind') acc.add(n.nome) })
  return acc
}

export function parametrosReferenciados(no: No, acc = new Set<string>()): Set<string> {
  percorrer(no, (n) => { if (n.t === 'param') acc.add(n.nome) })
  return acc
}

export function camposDoEscopo(escopo: Escopo): string[] {
  switch (escopo) {
    case 'day': return ['match.utc_date']
    case 'round': return ['match.competition', 'match.season', 'match.round']
    case 'league_season': return ['match.competition', 'match.season']
  }
}

/** Campos que `model(...)` lê da linha para montar λ e os parâmetros da liga. */
export function camposDoModelo(no: Extract<No, { t: 'model' }>): string[] {
  const w = no.janela
  const out: string[] = []
  switch (no.lambda) {
    case 'MEDIA': out.push(`home.${w}.gf`, `home.${w}.ga`, `away.${w}.gf`, `away.${w}.ga`); break
    case 'FORCAS': out.push(`home.${w}.gf`, `home.${w}.ga`, `away.${w}.gf`, `away.${w}.ga`, 'league.mu_h', 'league.mu_a'); break
    case 'XG': out.push(`home.${w}.xg_for`, `home.${w}.xg_against`, `away.${w}.xg_for`, `away.${w}.xg_against`, 'league.mu_h_xg', 'league.mu_a_xg'); break
    case 'MERCADO': out.push('derived.pinnacle.market_lambda_h', 'derived.pinnacle.market_lambda_a', 'derived.bet365.market_lambda_h', 'derived.bet365.market_lambda_a'); break
  }
  if (no.modelo === 'DC') out.push('league.rho')
  if (no.modelo === 'ZIP') out.push('league.pi_h', 'league.pi_a')
  if (no.modelo === 'NB') out.push('league.var_h', 'league.var_a')
  return out
}

// ────────────────────────────────────────────────────────────────────────────
// Resolução de identificadores
// ────────────────────────────────────────────────────────────────────────────

export interface ContextoResolucao {
  /** existe campo com esta chave no catálogo? */
  ehCampo: (key: string) => boolean
  /** nomes de indicadores definidos na estratégia */
  indicadores: Set<string>
}

/** Converte nós `id` em campo / indicador / seleção. Lança em identificador desconhecido. */
export function resolver(no: No, ctx: ContextoResolucao): No {
  switch (no.t) {
    case 'id': {
      if (ctx.indicadores.has(no.nome)) return { t: 'ind', nome: no.nome }
      if (ctx.ehCampo(no.nome)) return { t: 'campo', key: no.nome }
      if ((SELECOES as readonly string[]).includes(no.nome)) return { t: 'sel', v: no.nome as Selecao }
      if (no.nome === 'true') return { t: 'num', v: 1 }
      if (no.nome === 'false') return { t: 'num', v: 0 }
      if (no.nome === 'null') return { t: 'num', v: NaN }
      throw new ErroExpressao(`Identificador desconhecido: ${no.nome}`)
    }
    case 'bin': return { ...no, a: resolver(no.a, ctx), b: resolver(no.b, ctx) }
    case 'un': return { ...no, a: resolver(no.a, ctx) }
    case 'call': return { ...no, args: no.args.map((a) => resolver(a, ctx)) }
    case 'model': return { ...no, args: no.args.map((a) => resolver(a, ctx)) }
    case 'rank': return { ...no, expr: resolver(no.expr, ctx) }
    default: return no
  }
}

export class ErroExpressao extends Error {
  constructor(mensagem: string, public posicao?: number) { super(mensagem); this.name = 'ErroExpressao' }
}

// ────────────────────────────────────────────────────────────────────────────
// Validação e tipagem por unidade
// ────────────────────────────────────────────────────────────────────────────

/** Unidade semântica de um nó. `num` = literal (compatível com tudo); `any` = desconhecida. */
export type Unidade =
  | 'odd' | 'prob' | 'line' | 'count' | 'rate' | 'pct' | 'goals' | 'xg' | 'days' | 'points' | 'bool' | 'int'
  | 'id' | 'date' | 'text' | 'ratio' | 'elo' | 'sel' | 'num' | 'any'

export interface ContextoValidacao {
  tipoCampo: (key: string) => Unidade | undefined
  tipoIndicador: (nome: string) => Unidade | undefined
  parametros?: Set<string>
}

export interface Validacao {
  ok: boolean
  tipo: Unidade
  erros: string[]
  avisos: string[]
}

const NUMERICAS: readonly Unidade[] = ['odd', 'prob', 'line', 'count', 'rate', 'pct', 'goals', 'xg', 'days', 'points', 'bool', 'int', 'ratio', 'elo', 'num', 'any', 'date']
const ehNumerica = (u: Unidade) => NUMERICAS.includes(u)
/** Pares que nunca se comparam nem se somam sem conversão explícita. */
const INCOMPATIVEIS: [Unidade, Unidade][] = [['odd', 'prob'], ['odd', 'pct'], ['prob', 'goals'], ['odd', 'goals'], ['prob', 'count'], ['odd', 'count'], ['prob', 'line'], ['odd', 'line']]
function incompativeis(a: Unidade, b: Unidade): boolean {
  return INCOMPATIVEIS.some(([x, y]) => (a === x && b === y) || (a === y && b === x))
}

export function validar(no: No, ctx: ContextoValidacao): Validacao {
  const erros: string[] = []
  const avisos: string[] = []
  const { nos, profundidade } = contarNos(no)
  if (nos > LIMITE_NOS) erros.push(`Expressão com ${nos} nós (limite ${LIMITE_NOS})`)
  if (profundidade > LIMITE_PROFUNDIDADE) erros.push(`Expressão com profundidade ${profundidade} (limite ${LIMITE_PROFUNDIDADE})`)

  const tipoDe = (n: No): Unidade => {
    switch (n.t) {
      case 'num': return 'num'
      case 'str': return 'text'
      case 'id': erros.push(`Identificador não resolvido: ${n.nome}`); return 'any'
      case 'sel': return 'sel'
      case 'param':
        if (ctx.parametros && !ctx.parametros.has(n.nome)) erros.push(`Parâmetro $${n.nome} sem valor`)
        return 'num'
      case 'campo': {
        const t = ctx.tipoCampo(n.key)
        if (!t) { erros.push(`Campo fora do catálogo: ${n.key}`); return 'any' }
        return t
      }
      case 'ind': {
        const t = ctx.tipoIndicador(n.nome)
        if (!t) { erros.push(`Indicador desconhecido: ${n.nome}`); return 'any' }
        return t
      }
      case 'un': {
        const t = tipoDe(n.a)
        if (n.op === 'not') { if (t === 'sel' || t === 'text') erros.push('`not` exige booleano'); return 'bool' }
        if (!ehNumerica(t)) erros.push('Negação exige valor numérico')
        return t
      }
      case 'bin': {
        const a = tipoDe(n.a), b = tipoDe(n.b)
        switch (n.op) {
          case 'and': case 'or':
            if (a === 'sel' || a === 'text' || b === 'sel' || b === 'text') erros.push(`\`${n.op}\` exige booleanos`)
            return 'bool'
          case '==': case '!=':
            if ((a === 'text') !== (b === 'text') && a !== 'num' && b !== 'num' && a !== 'any' && b !== 'any') {
              if (!((a === 'sel' && b === 'text') || (a === 'text' && b === 'sel'))) erros.push(`Comparação entre ${a} e ${b}`)
            }
            if (incompativeis(a, b)) erros.push(`Comparação entre ${a} e ${b} sem conversão (use implied()/fair_odd())`)
            return 'bool'
          case '<': case '<=': case '>': case '>=':
            if (!ehNumerica(a) || !ehNumerica(b)) erros.push(`Comparação de ordem exige numéricos (${a} × ${b})`)
            if (incompativeis(a, b)) erros.push(`Comparação entre ${a} e ${b} sem conversão (use implied()/fair_odd())`)
            else if (a !== b && a !== 'num' && b !== 'num' && a !== 'any' && b !== 'any' && a !== 'ratio' && b !== 'ratio') avisos.push(`Comparação entre unidades diferentes: ${a} × ${b}`)
            return 'bool'
          case '+': case '-':
            if (!ehNumerica(a) || !ehNumerica(b)) erros.push(`Aritmética exige numéricos (${a} ${n.op} ${b})`)
            if (incompativeis(a, b)) erros.push(`Soma entre ${a} e ${b} sem conversão`)
            if (a === b) return a
            if (a === 'num') return b
            if (b === 'num') return a
            return 'ratio'
          case '*': case '/': case '^':
            if (!ehNumerica(a) || !ehNumerica(b)) erros.push(`Aritmética exige numéricos (${a} ${n.op} ${b})`)
            if (n.op === '*' && a === 'num') return b
            if ((n.op === '*' || n.op === '/') && b === 'num') return a
            return 'ratio'
        }
        return 'any'
      }
      case 'call': {
        const spec = FUNCOES[n.fn]
        if (!spec) { erros.push(`Função não permitida: ${n.fn}`); n.args.forEach(tipoDe); return 'any' }
        if (n.args.length < spec[0] || n.args.length > spec[1]) erros.push(`${n.fn}: esperava ${spec[0] === spec[1] ? spec[0] : `${spec[0]}–${spec[1]}`} argumento(s), recebeu ${n.args.length}`)
        const ts = n.args.map(tipoDe)
        switch (n.fn) {
          case 'implied': if (ts[0] === 'prob' || ts[0] === 'pct') erros.push('implied() espera uma odd'); return 'prob'
          case 'fair_odd': if (ts[0] === 'odd') erros.push('fair_odd() espera uma probabilidade'); return 'odd'
          case 'novig': {
            const ult = n.args[n.args.length - 1]
            const temMetodo = ult.t === 'str'
            const odds = temMetodo ? n.args.slice(0, -1) : n.args
            if (odds.length < 2 || odds.length > 3) erros.push('novig() espera 2 ou 3 odds')
            if (temMetodo && !(METODOS_NOVIG as readonly string[]).includes((ult as { v: string }).v)) erros.push(`novig(): método desconhecido ${(ult as { v: string }).v}`)
            for (const t of ts.slice(0, odds.length)) if (t === 'prob' || t === 'pct') erros.push('novig() espera odds')
            return 'prob'
          }
          case 'ev': case 'edge': case 'kelly':
            if (ts[0] === 'odd') erros.push(`${n.fn}(prob, odd): o 1º argumento é a probabilidade`)
            if (ts[1] === 'prob' || ts[1] === 'pct') erros.push(`${n.fn}(prob, odd): o 2º argumento é a odd`)
            return n.fn === 'ev' ? 'ratio' : n.fn === 'edge' ? 'prob' : 'pct'
          case 'quarter': return 'line'
          case 'zscore': return 'ratio'
          case 'isnull': return 'bool'
          case 'if': {
            if (ts[0] === 'sel' || ts[0] === 'text') erros.push('if(): condição deve ser booleana')
            const [, a, b] = ts
            if (a === b) return a
            if (a === 'sel' || b === 'sel') { erros.push('if(): os ramos devem ser ambos seleções ou ambos numéricos'); return 'any' }
            if (a === 'num' || a === 'any') return b
            if (b === 'num' || b === 'any') return a
            return 'ratio'
          }
          case 'ifnull': case 'coalesce': {
            const u = ts.find((t) => t !== 'num' && t !== 'any') ?? 'num'
            return u
          }
          case 'abs': case 'round': case 'floor': case 'ceil': case 'clamp': return ts[0]
          case 'min': case 'max': return ts.every((t) => t === ts[0]) ? ts[0] : 'ratio'
          default: return 'ratio'
        }
      }
      case 'model': {
        n.args.forEach(tipoDe)
        if (!MODELOS.includes(n.modelo)) erros.push(`model(): modelo desconhecido ${n.modelo}`)
        if (!METODOS_LAMBDA.includes(n.lambda)) erros.push(`model(): método de λ desconhecido ${n.lambda}`)
        if (!JANELAS.includes(n.janela)) erros.push(`model(): janela desconhecida ${n.janela}`)
        if (!(SAIDAS_MODELO as readonly string[]).includes(n.saida)) erros.push(`model(): saída desconhecida ${n.saida}`)
        const aridade: Record<string, number> = { p_over: 1, p_under: 1, p_ah: 2, p_cs: 2 }
        const esperado = aridade[n.saida] ?? 0
        if (n.args.length !== esperado) erros.push(`model().${n.saida} espera ${esperado} argumento(s)`)
        if (n.saida === 'p_ah' && n.args[1] && n.args[1].t !== 'sel') erros.push('model().p_ah(linha, lado): lado deve ser home ou away')
        if (n.saida.startsWith('lambda')) return 'goals'
        return 'prob'
      }
      case 'rank': {
        tipoDe(n.expr)
        if (!ESCOPOS.includes(n.escopo)) erros.push(`${n.fn}(): escopo desconhecido ${n.escopo}`)
        return n.fn === 'rank' ? 'int' : 'pct'
      }
    }
  }
  const tipo = tipoDe(no)
  return { ok: erros.length === 0, tipo, erros, avisos }
}
