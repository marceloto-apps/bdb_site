import { describe, it, expect } from 'vitest'
import { camposDoModelo, camposReferenciados, contarNos, indicadoresReferenciados, LIMITE_NOS, parametrosReferenciados, resolver, validar, type No } from '@/lib/laboratorio/engine/ast'
import { parseExpressao } from '@/lib/laboratorio/engine/parser'
import { catalogoPadrao } from '@/lib/laboratorio/engine/catalogo'

const cat = catalogoPadrao()
const ctxRes = (inds: string[] = []) => ({ ehCampo: cat.ehCampo, indicadores: new Set(inds) })
const ctxVal = (tipos: Record<string, string> = {}, params: string[] = []) => ({ tipoCampo: cat.tipoCampo, tipoIndicador: (n: string) => tipos[n] as never, parametros: new Set(params) })
const prep = (f: string, inds: string[] = []) => resolver(parseExpressao(f), ctxRes(inds))

describe('resolver', () => {
  it('campo do catálogo, indicador, seleção e literais true/false/null', () => {
    const ast = prep('odds.bet365.close.1x2.h > 2 and edge_h > 0 and derived.pinnacle.fav_side == home and true', ['edge_h'])
    const tipos: string[] = []
    const visita = (n: No) => { tipos.push(n.t); if (n.t === 'bin') { visita(n.a); visita(n.b) } }
    visita(ast)
    expect(tipos).toContain('campo'); expect(tipos).toContain('ind'); expect(tipos).toContain('sel')
    expect(() => prep('true and false')).not.toThrow()
    expect(prep('null')).toEqual({ t: 'num', v: NaN })
  })
  it('identificador desconhecido lança', () => {
    expect(() => prep('home.l10.gols')).toThrow(/desconhecido/)
    expect(() => prep('foo > 1')).toThrow(/desconhecido: foo/)
  })
  it('indicador tem prioridade sobre campo homônimo', () => {
    expect(prep('x', ['x'])).toEqual({ t: 'ind', nome: 'x' })
  })
})

describe('validar — limites e allow-list', () => {
  it('conta nós e profundidade', () => {
    const { nos, profundidade } = contarNos(prep('1 + 2 * 3'))
    expect(nos).toBe(5); expect(profundidade).toBe(2)
  })
  it('rejeita expressão acima do limite de nós', () => {
    const f = Array.from({ length: LIMITE_NOS + 5 }, () => '1').join(' + ')
    const v = validar(prep(f), ctxVal())
    expect(v.ok).toBe(false); expect(v.erros[0]).toMatch(/nós/)
  })
  it('rejeita função fora da allow-list e aridade errada', () => {
    expect(validar(prep('eval(1)'), ctxVal()).erros[0]).toMatch(/não permitida/)
    expect(validar(prep('abs(1, 2)'), ctxVal()).erros[0]).toMatch(/esperava 1/)
    expect(validar(prep('clamp(1)'), ctxVal()).erros[0]).toMatch(/esperava 3/)
  })
  it('parâmetro sem valor é erro', () => {
    expect(validar(prep('$p1 > 1'), ctxVal({}, [])).erros[0]).toMatch(/\$p1/)
    expect(validar(prep('$p1 > 1'), ctxVal({}, ['p1'])).ok).toBe(true)
  })
})

describe('validar — unidades', () => {
  it('odd > prob é rejeitado; implied()/fair_odd() convertem', () => {
    expect(validar(prep('odds.bet365.close.1x2.h > odds.pinnacle.close.1x2.novig_h'), ctxVal()).ok).toBe(false)
    expect(validar(prep('implied(odds.bet365.close.1x2.h) > odds.pinnacle.close.1x2.novig_h'), ctxVal()).ok).toBe(true)
    expect(validar(prep('odds.bet365.close.1x2.h > fair_odd(odds.pinnacle.close.1x2.novig_h)'), ctxVal()).ok).toBe(true)
  })
  it('implied() de uma probabilidade e fair_odd() de uma odd são erros', () => {
    expect(validar(prep('implied(odds.pinnacle.close.1x2.novig_h)'), ctxVal()).ok).toBe(false)
    expect(validar(prep('fair_odd(odds.bet365.close.1x2.h)'), ctxVal()).ok).toBe(false)
  })
  it('ev/edge/kelly exigem (prob, odd) nesta ordem', () => {
    expect(validar(prep('ev(odds.bet365.close.1x2.h, odds.pinnacle.close.1x2.novig_h)'), ctxVal()).ok).toBe(false)
    const v = validar(prep('ev(odds.pinnacle.close.1x2.novig_h, odds.bet365.close.1x2.h)'), ctxVal())
    expect(v.ok).toBe(true); expect(v.tipo).toBe('ratio')
  })
  it('tipo resultante: soma de mesma unidade mantém, mistura vira ratio, comparação é bool', () => {
    expect(validar(prep('home.l10.gf + away.l10.ga'), ctxVal()).tipo).toBe('goals')
    expect(validar(prep('home.l10.gf / home.l10.shots_for'), ctxVal()).tipo).toBe('ratio')
    expect(validar(prep('home.l10.gf > 1.5'), ctxVal()).tipo).toBe('bool')
    expect(validar(prep('model(DC, FORCAS, l10).p_h'), ctxVal()).tipo).toBe('prob')
    expect(validar(prep('model(DC, FORCAS, l10).lambda_h'), ctxVal()).tipo).toBe('goals')
  })
  it('comparar unidades diferentes mas compatíveis gera aviso, não erro', () => {
    const v = validar(prep('home.l10.gf > home.l10.xg_for'), ctxVal())
    expect(v.ok).toBe(true); expect(v.avisos[0]).toMatch(/unidades diferentes/)
  })
  it('and/or exigem booleanos; not de texto é erro', () => {
    expect(validar(prep('home and away'), ctxVal()).ok).toBe(false)
    expect(validar(prep("not 'x'"), ctxVal()).ok).toBe(false)
    expect(validar(prep('home.l10.gf > 1 and not (away.l10.gf > 2)'), ctxVal()).ok).toBe(true)
  })
  it('if() com ramos de seleção devolve sel; ramos mistos são erro', () => {
    expect(validar(prep('if(home.l10.gf > away.l10.gf, home, away)'), ctxVal()).tipo).toBe('sel')
    expect(validar(prep('if(home.l10.gf > 1, home, 2)'), ctxVal()).ok).toBe(false)
  })
  it('model: p_over exige 1 argumento, p_ah exige (linha, lado)', () => {
    expect(validar(prep('model(DC, FORCAS, l10).p_over'), ctxVal()).ok).toBe(false)
    expect(validar(prep('model(DC, FORCAS, l10).p_ah(-0.5, home)'), ctxVal()).ok).toBe(true)
    expect(validar(prep('model(DC, FORCAS, l10).p_ah(-0.5, 1)'), ctxVal()).ok).toBe(false)
  })
  it('novig: método desconhecido e argumentos de probabilidade são erros', () => {
    expect(validar(prep("novig(odds.bet365.close.1x2.h, odds.bet365.close.1x2.d, odds.bet365.close.1x2.a, 'foo')"), ctxVal()).ok).toBe(false)
    expect(validar(prep('novig(odds.pinnacle.close.1x2.novig_h, odds.pinnacle.close.1x2.novig_a)'), ctxVal()).ok).toBe(false)
    expect(validar(prep("novig(odds.bet365.close.btts.yes, odds.bet365.close.btts.no, 'shin')"), ctxVal()).ok).toBe(true)
  })
  it('comparação de texto com seleção/string é aceita', () => {
    expect(validar(prep('derived.pinnacle.fav_side == home'), ctxVal()).ok).toBe(true)
    expect(validar(prep("match.competition_type == 'CUP'"), ctxVal()).ok).toBe(true)
  })
})

describe('referências', () => {
  it('campos, indicadores e parâmetros referenciados (inclui os implícitos de model e rank)', () => {
    const ast = prep('model(DC, XG, l20).p_h > $p1 and edge_h > 0 and rank(home.elo, round) <= 3', ['edge_h'])
    const campos = camposReferenciados(ast)
    expect(campos.has('home.l20.xg_for')).toBe(true)
    expect(campos.has('league.rho')).toBe(true)
    expect(campos.has('match.round')).toBe(true)
    expect(campos.has('home.elo')).toBe(true)
    expect(Array.from(indicadoresReferenciados(ast))).toEqual(['edge_h'])
    expect(Array.from(parametrosReferenciados(ast))).toEqual(['p1'])
  })
  it('camposDoModelo por método e modelo', () => {
    expect(camposDoModelo({ t: 'model', modelo: 'NB', lambda: 'MERCADO', janela: 'l5', saida: 'p_h', args: [] })).toEqual(expect.arrayContaining(['derived.pinnacle.market_lambda_h', 'league.var_h']))
    expect(camposDoModelo({ t: 'model', modelo: 'ZIP', lambda: 'MEDIA', janela: 'l5', saida: 'p_h', args: [] })).toEqual(expect.arrayContaining(['home.l5.gf', 'league.pi_a']))
  })
})
