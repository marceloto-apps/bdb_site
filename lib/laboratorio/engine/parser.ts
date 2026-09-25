/**
 * Parser das fórmulas do Backtest Livre (§5.2): gramática própria, recursivo-descendente, sem
 * `eval`/`Function`. Produz o AST de ast.ts com identificadores ainda não resolvidos (`id`).
 *
 * Gramática (precedência crescente):
 *   or      := and ('or' and)*
 *   and     := not ('and' not)*
 *   not     := 'not' not | cmp
 *   cmp     := add (('=='|'!='|'<'|'<='|'>'|'>=') add)?
 *   add     := mul (('+'|'-') mul)*
 *   mul     := unary (('*'|'/') unary)*
 *   unary   := '-' unary | pow
 *   pow     := primary ('^' unary)?                      (associativa à direita)
 *   primary := num | 'str' | $param | ident '(' args ')' [ '.' ident [ '(' args ')' ] ] | ident | '(' or ')'
 *
 * Programa (modo fórmula com várias linhas): cada linha lógica é `nome = expr` (indicador) ou
 * uma expressão; comentários com `#` ou `//`. Uma linha continua na seguinte quando há
 * parêntese aberto ou termina em operador.
 */
import { ErroExpressao, ESCOPOS, JANELAS, METODOS_LAMBDA, MODELOS, SAIDAS_MODELO, type Escopo, type Janela, type MetodoLambda, type Modelo, type No, type SaidaModelo } from './ast'

type TipoToken = 'num' | 'str' | 'id' | 'param' | 'op' | 'lp' | 'rp' | 'comma' | 'dot' | 'fim'
interface Token { tipo: TipoToken; v: string; pos: number }

const OPS2 = ['==', '!=', '<=', '>=']
const OPS1 = ['+', '-', '*', '/', '^', '<', '>', '=']

export function tokenizar(src: string): Token[] {
  const out: Token[] = []
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { i++; continue }
    if (c === '#' || (c === '/' && src[i + 1] === '/')) { while (i < n && src[i] !== '\n') i++; continue }
    if (c >= '0' && c <= '9') {
      let j = i + 1
      while (j < n && src[j] >= '0' && src[j] <= '9') j++
      if (src[j] === '.' && src[j + 1] >= '0' && src[j + 1] <= '9') { j++; while (j < n && src[j] >= '0' && src[j] <= '9') j++ }
      if (src[j] === 'e' || src[j] === 'E') {
        let k = j + 1
        if (src[k] === '-' || src[k] === '+') k++
        if (src[k] >= '0' && src[k] <= '9') { while (k < n && src[k] >= '0' && src[k] <= '9') k++; j = k }
      }
      out.push({ tipo: 'num', v: src.slice(i, j), pos: i }); i = j; continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      while (j < n && src[j] !== c) j++
      if (j >= n) throw new ErroExpressao('String sem fechamento', i)
      out.push({ tipo: 'str', v: src.slice(i + 1, j), pos: i }); i = j + 1; continue
    }
    if (c === '$') {
      let j = i + 1
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++
      if (j === i + 1) throw new ErroExpressao('Parâmetro sem nome após $', i)
      out.push({ tipo: 'param', v: src.slice(i + 1, j), pos: i }); i = j; continue
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1
      while (j < n) {
        if (/[A-Za-z0-9_]/.test(src[j])) { j++; continue }
        if (src[j] === '.' && j + 1 < n && /[A-Za-z0-9_]/.test(src[j + 1])) { j++; continue }
        break
      }
      out.push({ tipo: 'id', v: src.slice(i, j), pos: i }); i = j; continue
    }
    if (c === '(') { out.push({ tipo: 'lp', v: c, pos: i }); i++; continue }
    if (c === ')') { out.push({ tipo: 'rp', v: c, pos: i }); i++; continue }
    if (c === ',') { out.push({ tipo: 'comma', v: c, pos: i }); i++; continue }
    if (c === '.') { out.push({ tipo: 'dot', v: c, pos: i }); i++; continue }
    const two = src.slice(i, i + 2)
    if (OPS2.includes(two)) { out.push({ tipo: 'op', v: two, pos: i }); i += 2; continue }
    if (two === '&&') { out.push({ tipo: 'op', v: 'and', pos: i }); i += 2; continue }
    if (two === '||') { out.push({ tipo: 'op', v: 'or', pos: i }); i += 2; continue }
    if (c === '!') { out.push({ tipo: 'op', v: 'not', pos: i }); i++; continue }
    if (OPS1.includes(c)) { out.push({ tipo: 'op', v: c, pos: i }); i++; continue }
    throw new ErroExpressao(`Caractere inesperado: ${c}`, i)
  }
  out.push({ tipo: 'fim', v: '', pos: n })
  return out
}

class Parser {
  private k = 0
  constructor(private toks: Token[]) {}

  private get t(): Token { return this.toks[this.k] }
  private avancar(): Token { return this.toks[this.k++] }
  private ehOp(v: string): boolean { return this.t.tipo === 'op' && this.t.v === v }
  private ehId(v: string): boolean { return this.t.tipo === 'id' && this.t.v === v }
  private esperar(tipo: TipoToken, msg: string): Token {
    if (this.t.tipo !== tipo) throw new ErroExpressao(`${msg} (encontrado: ${this.t.tipo === 'fim' ? 'fim da expressão' : `"${this.t.v}"`})`, this.t.pos)
    return this.avancar()
  }

  expressao(): No {
    const e = this.or()
    if (this.t.tipo !== 'fim') throw new ErroExpressao(`Token inesperado: "${this.t.v}"`, this.t.pos)
    return e
  }

  private or(): No {
    let a = this.and()
    while (this.ehId('or') || this.ehOp('or')) { this.avancar(); a = { t: 'bin', op: 'or', a, b: this.and() } }
    return a
  }

  private and(): No {
    let a = this.not()
    while (this.ehId('and') || this.ehOp('and')) { this.avancar(); a = { t: 'bin', op: 'and', a, b: this.not() } }
    return a
  }

  private not(): No {
    if (this.ehId('not') || this.ehOp('not')) { this.avancar(); return { t: 'un', op: 'not', a: this.not() } }
    return this.cmp()
  }

  private cmp(): No {
    const a = this.add()
    if (this.t.tipo === 'op' && ['==', '!=', '<', '<=', '>', '>=', '='].includes(this.t.v)) {
      const op = this.avancar().v
      const b = this.add()
      return { t: 'bin', op: (op === '=' ? '==' : op) as '==', a, b }
    }
    return a
  }

  private add(): No {
    let a = this.mul()
    while (this.ehOp('+') || this.ehOp('-')) { const op = this.avancar().v as '+' | '-'; a = { t: 'bin', op, a, b: this.mul() } }
    return a
  }

  private mul(): No {
    let a = this.unary()
    while (this.ehOp('*') || this.ehOp('/')) { const op = this.avancar().v as '*' | '/'; a = { t: 'bin', op, a, b: this.unary() } }
    return a
  }

  private unary(): No {
    if (this.ehOp('-')) { this.avancar(); return { t: 'un', op: 'neg', a: this.unary() } }
    if (this.ehOp('+')) { this.avancar(); return this.unary() }
    return this.pow()
  }

  private pow(): No {
    const a = this.primary()
    if (this.ehOp('^')) { this.avancar(); return { t: 'bin', op: '^', a, b: this.unary() } }
    return a
  }

  private args(): No[] {
    this.esperar('lp', 'Esperava "("')
    const out: No[] = []
    if (this.t.tipo === 'rp') { this.avancar(); return out }
    for (;;) {
      out.push(this.or())
      if (this.t.tipo === 'comma') { this.avancar(); continue }
      this.esperar('rp', 'Esperava ")"')
      return out
    }
  }

  private primary(): No {
    const tk = this.t
    switch (tk.tipo) {
      case 'num': this.avancar(); return { t: 'num', v: Number(tk.v) }
      case 'str': this.avancar(); return { t: 'str', v: tk.v }
      case 'param': this.avancar(); return { t: 'param', nome: tk.v }
      case 'lp': { this.avancar(); const e = this.or(); this.esperar('rp', 'Esperava ")"'); return e }
      case 'id': {
        this.avancar()
        if (this.t.tipo === 'lp') return this.chamada(tk)
        return { t: 'id', nome: tk.v }
      }
      case 'fim': throw new ErroExpressao('Expressão incompleta', tk.pos)
      default: throw new ErroExpressao(`Token inesperado: "${tk.v}"`, tk.pos)
    }
  }

  private chamada(nome: Token): No {
    if (nome.v === 'model') return this.model(nome)
    const args = this.args()
    if (nome.v === 'rank' || nome.v === 'pct_rank') {
      if (args.length !== 2) throw new ErroExpressao(`${nome.v}(expr, escopo) espera 2 argumentos`, nome.pos)
      const esc = args[1]
      if (esc.t !== 'id' || !(ESCOPOS as readonly string[]).includes(esc.nome)) throw new ErroExpressao(`${nome.v}(): escopo deve ser day, round ou league_season`, nome.pos)
      return { t: 'rank', fn: nome.v, expr: args[0], escopo: esc.nome as Escopo }
    }
    return { t: 'call', fn: nome.v, args }
  }

  /** model(MODELO, LAMBDA, JANELA).saida[(args)] */
  private model(nome: Token): No {
    const args = this.args()
    if (args.length !== 3 || args.some((a) => a.t !== 'id')) throw new ErroExpressao('model(MODELO, LAMBDA, JANELA): use model(DC, FORCAS, l10)', nome.pos)
    const [m, l, j] = args.map((a) => (a as { nome: string }).nome)
    const modelo = m.toUpperCase() === 'DIXON_COLES' ? 'DC' : m.toUpperCase()
    if (!(MODELOS as readonly string[]).includes(modelo)) throw new ErroExpressao(`model(): modelo desconhecido ${m}`, nome.pos)
    const lambda = l.toUpperCase()
    if (!(METODOS_LAMBDA as readonly string[]).includes(lambda)) throw new ErroExpressao(`model(): método de λ desconhecido ${l}`, nome.pos)
    if (!(JANELAS as readonly string[]).includes(j)) throw new ErroExpressao(`model(): janela desconhecida ${j}`, nome.pos)
    if (this.t.tipo !== 'dot') throw new ErroExpressao('model(...) precisa de uma saída: .p_h, .p_over(2.5), …', this.t.pos)
    this.avancar()
    const saida = this.esperar('id', 'Esperava a saída do modelo').v
    if (!(SAIDAS_MODELO as readonly string[]).includes(saida)) throw new ErroExpressao(`model(): saída desconhecida ${saida}`, nome.pos)
    const proximo = this.toks[this.k]
    const sArgs = proximo.tipo === 'lp' ? this.args() : []
    return { t: 'model', modelo: modelo as Modelo, lambda: lambda as MetodoLambda, janela: j as Janela, saida: saida as SaidaModelo, args: sArgs }
  }
}

/** Fórmula única → AST (com `id` não resolvidos). */
export function parseExpressao(texto: string): No {
  const toks = tokenizar(texto)
  if (toks.length === 1) throw new ErroExpressao('Expressão vazia', 0)
  return new Parser(toks).expressao()
}

export interface Programa {
  indicadores: { nome: string; ast: No; formula: string }[]
  /** última expressão sem nome (a regra), se houver */
  expressao: No | null
  formulaExpressao: string | null
}

const RE_DEF = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)\s*([\s\S]*)$/

/** Separa em linhas lógicas: continua a linha quando há parêntese aberto ou termina em operador. */
export function linhasLogicas(texto: string): string[] {
  const out: string[] = []
  let atual = ''
  let prof = 0
  for (const bruta of texto.split(/\r?\n/)) {
    const semComentario = bruta.replace(/(#|\/\/).*$/, '')
    if (!semComentario.trim() && !atual) continue
    atual = atual ? `${atual}\n${semComentario}` : semComentario
    for (const ch of semComentario) { if (ch === '(') prof++; else if (ch === ')') prof-- }
    const fim = semComentario.trim()
    const continua = prof > 0 || /(\band\b|\bor\b|\bnot\b|[-+*/^=<>,(])$/.test(fim)
    if (!continua) { if (atual.trim()) out.push(atual.trim()); atual = ''; prof = 0 }
  }
  if (atual.trim()) out.push(atual.trim())
  return out
}

/** Programa com indicadores (`nome = expr`) e, opcionalmente, uma expressão final. */
export function parsePrograma(texto: string): Programa {
  const indicadores: Programa['indicadores'] = []
  let expressao: No | null = null
  let formulaExpressao: string | null = null
  for (const linha of linhasLogicas(texto)) {
    const m = RE_DEF.exec(linha)
    if (m) {
      if (indicadores.some((i) => i.nome === m[1])) throw new ErroExpressao(`Indicador definido duas vezes: ${m[1]}`)
      indicadores.push({ nome: m[1], ast: parseExpressao(m[2]), formula: m[2].trim() })
    } else {
      if (expressao) throw new ErroExpressao('Mais de uma expressão sem nome no programa; nomeie os indicadores com `nome = expr`')
      expressao = parseExpressao(linha)
      formulaExpressao = linha
    }
  }
  return { indicadores, expressao, formulaExpressao }
}

/** AST → texto (para exibir a fórmula do builder visual). */
export function imprimir(no: No): string {
  const prec = (n: No): number => {
    if (n.t === 'bin') return { or: 1, and: 2, '==': 4, '!=': 4, '<': 4, '<=': 4, '>': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, '^': 8 }[n.op]
    if (n.t === 'un') return n.op === 'not' ? 3 : 7
    return 9
  }
  const par = (filho: No, minimo: number) => (prec(filho) < minimo ? `(${imprimir(filho)})` : imprimir(filho))
  switch (no.t) {
    case 'num': return Number.isNaN(no.v) ? 'null' : String(no.v)
    case 'str': return `'${no.v}'`
    case 'id': return no.nome
    case 'campo': return no.key
    case 'ind': return no.nome
    case 'param': return `$${no.nome}`
    case 'sel': return no.v
    case 'un': return no.op === 'not' ? `not ${par(no.a, 3)}` : `-${par(no.a, 7)}`
    case 'bin': { const p = prec(no); return `${par(no.a, p)} ${no.op} ${par(no.b, no.op === '^' ? p : p + 1)}` }
    case 'call': return `${no.fn}(${no.args.map(imprimir).join(', ')})`
    case 'rank': return `${no.fn}(${imprimir(no.expr)}, ${no.escopo})`
    case 'model': return `model(${no.modelo}, ${no.lambda}, ${no.janela}).${no.saida}${no.args.length ? `(${no.args.map(imprimir).join(', ')})` : ''}`
  }
}
