import { describe, it, expect } from 'vitest'
import { imprimir, linhasLogicas, parseExpressao, parsePrograma, tokenizar } from '@/lib/laboratorio/engine/parser'
import { ErroExpressao, type No } from '@/lib/laboratorio/engine/ast'

const bin = (op: string, a: No, b: No): No => ({ t: 'bin', op: op as never, a, b })
const num = (v: number): No => ({ t: 'num', v })
const id = (nome: string): No => ({ t: 'id', nome })

describe('tokenizador', () => {
  it('identificadores com ponto e dígitos (chaves do catálogo)', () => {
    const t = tokenizar('odds.bet365.close.1x2.h * home.l10.xg_for')
    expect(t.map((x) => x.tipo)).toEqual(['id', 'op', 'id', 'fim'])
    expect(t[0].v).toBe('odds.bet365.close.1x2.h')
    expect(t[2].v).toBe('home.l10.xg_for')
  })
  it('números decimais e notação científica', () => {
    expect(tokenizar('2.5 + 1e-3').map((x) => x.v)).toEqual(['2.5', '+', '1e-3', ''])
  })
  it('parâmetros $p, strings e comentários', () => {
    const t = tokenizar("$p1 > 'shin' # comentário\n// outro")
    expect(t.map((x) => x.tipo)).toEqual(['param', 'op', 'str', 'fim'])
  })
  it('operadores de dois caracteres e aliases && || !', () => {
    expect(tokenizar('a >= b && c != d || !e').filter((x) => x.tipo === 'op').map((x) => x.v)).toEqual(['>=', 'and', '!=', 'or', 'not'])
  })
  it('ponto após parêntese vira token próprio (model(...).p_h)', () => {
    expect(tokenizar('model(DC, FORCAS, l10).p_h').map((x) => x.tipo)).toContain('dot')
  })
  it('caractere inválido lança com posição', () => {
    expect(() => tokenizar('a @ b')).toThrow(ErroExpressao)
    try { tokenizar('a @ b') } catch (e) { expect((e as ErroExpressao).posicao).toBe(2) }
  })
  it('string sem fechamento lança', () => {
    expect(() => tokenizar("'abc")).toThrow(/sem fechamento/)
  })
})

describe('parser — precedência e associatividade', () => {
  it('* antes de +', () => {
    expect(parseExpressao('1 + 2 * 3')).toEqual(bin('+', num(1), bin('*', num(2), num(3))))
  })
  it('^ é associativo à direita e vence o unário', () => {
    expect(parseExpressao('2 ^ 3 ^ 2')).toEqual(bin('^', num(2), bin('^', num(3), num(2))))
    expect(parseExpressao('-2 ^ 2')).toEqual({ t: 'un', op: 'neg', a: bin('^', num(2), num(2)) })
  })
  it('comparação abaixo da aritmética, and abaixo da comparação, or abaixo do and', () => {
    const ast = parseExpressao('a + 1 > 2 and b < 3 or not c')
    expect(ast.t).toBe('bin'); expect((ast as { op: string }).op).toBe('or')
    const esq = (ast as { a: No }).a
    expect((esq as { op: string }).op).toBe('and')
    const dir = (ast as { b: No }).b
    expect(dir).toEqual({ t: 'un', op: 'not', a: id('c') })
  })
  it('parênteses mudam a ordem', () => {
    expect(parseExpressao('(1 + 2) * 3')).toEqual(bin('*', bin('+', num(1), num(2)), num(3)))
  })
  it('= simples é aceito como ==', () => {
    expect(parseExpressao('a = 1')).toEqual(bin('==', id('a'), num(1)))
  })
  it('chamadas de função com vários argumentos', () => {
    expect(parseExpressao('if(a > b, home, away)')).toEqual({ t: 'call', fn: 'if', args: [bin('>', id('a'), id('b')), id('home'), id('away')] })
    expect(parseExpressao("novig(o1, o2, o3, 'shin')")).toMatchObject({ t: 'call', fn: 'novig' })
  })
  it('model(...) exige três identificadores e uma saída', () => {
    expect(parseExpressao('model(DC, FORCAS, l10).p_over(2.5)')).toEqual({ t: 'model', modelo: 'DC', lambda: 'FORCAS', janela: 'l10', saida: 'p_over', args: [num(2.5)] })
    expect(parseExpressao('model(dixon_coles, xg, season).p_h')).toMatchObject({ modelo: 'DC', lambda: 'XG', janela: 'season', saida: 'p_h', args: [] })
    expect(() => parseExpressao('model(DC, FORCAS)')).toThrow(/model\(MODELO/)
    expect(() => parseExpressao('model(DC, FORCAS, l10)')).toThrow(/saída/)
    expect(() => parseExpressao('model(DC, FORCAS, l10).p_x')).toThrow(/saída desconhecida/)
    expect(() => parseExpressao('model(FOO, FORCAS, l10).p_h')).toThrow(/modelo desconhecido/)
  })
  it('rank e pct_rank com escopo', () => {
    expect(parseExpressao('rank(home.l10.xg_for, day)')).toEqual({ t: 'rank', fn: 'rank', expr: id('home.l10.xg_for'), escopo: 'day' })
    expect(() => parseExpressao('pct_rank(x, semana)')).toThrow(/escopo/)
  })
  it('erros: expressão vazia, incompleta, parêntese sem fechar, token sobrando', () => {
    expect(() => parseExpressao('')).toThrow(/vazia/)
    expect(() => parseExpressao('1 +')).toThrow(/incompleta/)
    expect(() => parseExpressao('(1 + 2')).toThrow(/Esperava "\)"/)
    expect(() => parseExpressao('1 2')).toThrow(/inesperado/)
  })
  it('os 5 exemplos do plano (§5.2) são aceitos', () => {
    const exemplos = [
      'odds.bet365.open.1x2.h * odds.pinnacle.close.1x2.novig_h - 1',
      'odds.pinnacle.close.1x2.h / odds.pinnacle.open.1x2.h < 0.93 and home.l5.pts_pg >= 1.8',
      'model(DC, FORCAS, l10).p_over(2.5) - odds.bet365.close.ou.novig_over_main > $p1',
      'odds.pinnacle.close.ah.main_line <= -0.75 and odds.pinnacle.close.ou.main_line >= 3.0',
      '(home.venue.l10.xg_for + away.venue.l10.xg_against) / 2 > 1.7 and implied(odds.bet365.close.ou.over_2_5) < 0.55',
    ]
    for (const e of exemplos) expect(() => parseExpressao(e)).not.toThrow()
  })
})

describe('programa (várias linhas)', () => {
  it('separa definições de indicadores e a expressão final', () => {
    const p = parsePrograma(`# edge contra a Pinnacle\nedge_h = odds.bet365.open.1x2.h * odds.pinnacle.close.1x2.novig_h - 1\nedge_h > 0.03 and home.l5.pts_pg >= 1.5`)
    expect(p.indicadores.map((i) => i.nome)).toEqual(['edge_h'])
    expect(p.expressao).not.toBeNull()
    expect(p.formulaExpressao).toBe('edge_h > 0.03 and home.l5.pts_pg >= 1.5')
  })
  it('continua a linha com parêntese aberto ou operador no fim', () => {
    expect(linhasLogicas('a = min(\n  1,\n  2)\nb = 1 +\n  2\nc')).toEqual(['a = min(\n  1,\n  2)', 'b = 1 +\n  2', 'c'])
  })
  it('rejeita indicador duplicado e duas expressões sem nome', () => {
    expect(() => parsePrograma('a = 1\na = 2')).toThrow(/duas vezes/)
    expect(() => parsePrograma('a > 1\nb > 2')).toThrow(/Mais de uma expressão/)
  })
  it('== dentro de uma linha não é definição', () => {
    const p = parsePrograma('x == 1')
    expect(p.indicadores).toHaveLength(0)
    expect(p.expressao).toEqual(bin('==', id('x'), num(1)))
  })
})

describe('imprimir (AST → texto)', () => {
  it('reimprime com parênteses só onde precisa e faz ida e volta', () => {
    for (const f of ['(a + b) * c', 'a + b * c', 'not (a and b)', 'a ^ (b ^ c)', '-(a + b)', 'if(a > b, home, away)', 'model(DC, FORCAS, l10).p_over(2.5)', 'rank(x, day)', "novig(a, b, 'shin')"]) {
      const s = imprimir(parseExpressao(f))
      expect(parseExpressao(s)).toEqual(parseExpressao(f))
    }
    expect(imprimir(parseExpressao('(a + b) * c'))).toBe('(a + b) * c')
    expect(imprimir(parseExpressao('a + (b * c)'))).toBe('a + b * c')
  })
})
