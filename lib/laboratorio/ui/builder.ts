/**
 * Builder visual de regras (D5): uma lista de condições combinadas por AND ou OR, cada uma
 * `campo|indicador  operador  número|campo|indicador|seleção`. Gera o mesmo AST do modo fórmula e
 * lê de volta uma fórmula quando ela tem essa forma "plana"; senão a UI mostra só o modo fórmula.
 */
import { SELECOES, type No, type OpBin, type Selecao } from '../engine/ast'
import { imprimir, parseExpressao } from '../engine/parser'

export type OpCondicao = '>' | '>=' | '<' | '<=' | '==' | '!='
export const OPS_CONDICAO: { v: OpCondicao; rotulo: string }[] = [
  { v: '>', rotulo: '>' }, { v: '>=', rotulo: '≥' }, { v: '<', rotulo: '<' }, { v: '<=', rotulo: '≤' }, { v: '==', rotulo: '=' }, { v: '!=', rotulo: '≠' },
]

export type Operando =
  | { t: 'num'; v: number }
  | { t: 'ref'; nome: string }   // campo do catálogo ou indicador
  | { t: 'sel'; v: Selecao }
  | { t: 'str'; v: string }

export interface Condicao { id: string; esq: Operando; op: OpCondicao; dir: Operando; negar?: boolean }
export interface Builder { combinador: 'and' | 'or'; condicoes: Condicao[] }

let seq = 0
export const novaCondicao = (parcial: Partial<Condicao> = {}): Condicao => ({ id: `c${++seq}_${Date.now().toString(36)}`, esq: { t: 'ref', nome: '' }, op: '>', dir: { t: 'num', v: 0 }, ...parcial })

function noDe(o: Operando): No {
  switch (o.t) {
    case 'num': return { t: 'num', v: o.v }
    case 'ref': return { t: 'id', nome: o.nome }
    case 'sel': return { t: 'id', nome: o.v } // como o parser: resolvido depois em `sel`
    case 'str': return { t: 'str', v: o.v }
  }
}

/** Builder → AST (com `id` não resolvidos, como o parser). */
export function builderParaAst(b: Builder): No | null {
  const nos = b.condicoes.filter((c) => c.esq.t !== 'ref' || c.esq.nome).map((c) => {
    const cmp: No = { t: 'bin', op: c.op as OpBin, a: noDe(c.esq), b: noDe(c.dir) }
    return c.negar ? { t: 'un', op: 'not', a: cmp } as No : cmp
  })
  if (!nos.length) return null
  return nos.reduce((acc, n) => ({ t: 'bin', op: b.combinador, a: acc, b: n }))
}

export function builderParaFormula(b: Builder): string {
  const ast = builderParaAst(b)
  return ast ? imprimir(ast) : ''
}

function operandoDe(n: No): Operando | null {
  switch (n.t) {
    case 'num': return { t: 'num', v: n.v }
    case 'id': return (SELECOES as readonly string[]).includes(n.nome) ? { t: 'sel', v: n.nome as Selecao } : { t: 'ref', nome: n.nome }
    case 'campo': return { t: 'ref', nome: n.key }
    case 'ind': return { t: 'ref', nome: n.nome }
    case 'sel': return { t: 'sel', v: n.v }
    case 'str': return { t: 'str', v: n.v }
    case 'un': if (n.op === 'neg' && n.a.t === 'num') return { t: 'num', v: -n.a.v }; return null
    default: return null
  }
}

/**
 * AST → builder quando a expressão é uma conjunção (só `and`) ou disjunção (só `or`) de
 * comparações simples, opcionalmente negadas. Devolve null quando não cabe no builder.
 */
export function astParaBuilder(no: No): Builder | null {
  const folhas: No[] = []
  let comb: 'and' | 'or' | null = null
  const achatar = (n: No): boolean => {
    if (n.t === 'bin' && (n.op === 'and' || n.op === 'or')) {
      if (comb && comb !== n.op) return false
      comb = n.op
      return achatar(n.a) && achatar(n.b)
    }
    folhas.push(n); return true
  }
  if (!achatar(no)) return null
  const condicoes: Condicao[] = []
  for (let f of folhas) {
    let negar = false
    if (f.t === 'un' && f.op === 'not') { negar = true; f = f.a }
    if (f.t !== 'bin' || !['>', '>=', '<', '<=', '==', '!='].includes(f.op)) return null
    const esq = operandoDe(f.a), dir = operandoDe(f.b)
    if (!esq || !dir || esq.t === 'num' || esq.t === 'str' || esq.t === 'sel') return null
    condicoes.push(novaCondicao({ esq, op: f.op as OpCondicao, dir, negar }))
  }
  return { combinador: comb ?? 'and', condicoes }
}

export function formulaParaBuilder(formula: string): Builder | null {
  if (!formula.trim()) return { combinador: 'and', condicoes: [] }
  try { return astParaBuilder(parseExpressao(formula)) } catch { return null }
}
