import { describe, test, it, expect } from 'vitest'
import {
  calcularDispersaoMetrica,
  classificarDispersao,
  classificarDispersaoResiduos,
} from '@/lib/analytics/dispersao-condicional'

describe('Dispersão condicional', () => {
  test('qui-quadrado inverso: faixa Poisson estreita em amostra grande', () => {
    const obs = Array.from({ length: 400 }, () => 1)
    const lam = obs.map(() => 1)
    const r = calcularDispersaoMetrica(obs, lam, 40, 'GOLS')
    expect(r.condicional.faixaSup).toBeLessThan(1.25)
    expect(r.condicional.faixaInf).toBeGreaterThan(0.75)
  })

  test('Poisson condicional ≈ 1 quando observados batem com lambdas', () => {
    const obs = [2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 1, 1, 1, 1]
    const lam = Array(20).fill(1)
    const r = calcularDispersaoMetrica(obs, lam, 4, 'GOLS')
    expect(r.condicional.veredito).toBe('NEUTRO')
    expect(r.condicional.indice).toBeCloseTo(1.0)
  })

  test('agregado pode gritar OVER enquanto condicional é NEUTRO', () => {
    const obs = [0, 0, 1, 0, 5, 6, 5, 4, 0, 1, 6, 5, 0, 1, 5, 6, 0, 0, 6, 5]
    const lam = [0.3, 0.3, 0.3, 0.3, 5, 5, 5, 5, 0.3, 0.3, 5, 5, 0.3, 0.3, 5, 5, 0.3, 0.3, 5, 5]
    const r = calcularDispersaoMetrica(obs, lam, 4, 'GOLS')
    expect(r.agregado.veredito).toBe('OVER')
    expect(r.condicional.veredito).toBe('NEUTRO')
    expect(r.inflacaoPercentual).toBeGreaterThan(0)
  })

  test('underdispersion real sugere COM-Poisson', () => {
    const obs = Array.from({ length: 60 }, () => 2)
    const lam = obs.map(() => 2)
    const r = calcularDispersaoMetrica(obs, lam, 4, 'GOLS')
    expect(r.condicional.indice).toBeLessThan(0.85)
    expect(r.condicional.distribuicaoSugerida).toBe('COM_POISSON')
  })

  test('proteção contra divisão por zero (lambda baixo)', () => {
    const obs = [0, 1, 0, 0, 1]
    const lam = [0, 0, 0, 0, 0]
    expect(() => calcularDispersaoMetrica(obs, lam, 2, 'GOLS')).not.toThrow()
  })

  // --- Testes da banda dinâmica ancorada em N ---

  // D=1.0 sempre é NORMAL, independente de N
  it('D ≈ 1 retorna NORMAL em qualquer N', () => {
    expect(classificarDispersao(1.0, 1.0, 760).regime).toBe('NORMAL')
    expect(classificarDispersao(1.0, 1.0, 200).regime).toBe('NORMAL')
  })

  // Mesmo D=1.12: ruído (NORMAL) em N pequeno, significativo (OVER) em N grande
  it('D=1.12 é NORMAL com N=200 mas OVER com N=760', () => {
    expect(classificarDispersao(1.12, 1.0, 200).regime).toBe('NORMAL')
    expect(classificarDispersao(1.12, 1.0, 760).regime).toBe('OVER')
  })

  // OVER claro em qualquer N razoável
  it('D=1.4 retorna OVER', () => {
    expect(classificarDispersao(1.4, 1.0, 400).regime).toBe('OVER')
  })

  // UNDER claro
  it('D=0.7 retorna UNDER', () => {
    expect(classificarDispersao(0.7, 1.0, 400).regime).toBe('UNDER')
  })

  // Banda encolhe quando N cresce
  it('banda de normalidade encolhe conforme N aumenta', () => {
    const banda200 = classificarDispersao(1.0, 1.0, 200).banda
    const banda760 = classificarDispersao(1.0, 1.0, 760).banda
    const larg200 = banda200.superior - banda200.inferior
    const larg760 = banda760.superior - banda760.inferior
    expect(larg760).toBeLessThan(larg200)
  })

  // Guarda: média zero não quebra (assume D=1 → NORMAL)
  it('média zero retorna NORMAL sem erro', () => {
    expect(classificarDispersao(0, 0, 400).regime).toBe('NORMAL')
  })

  it('nObs <= 1 resulta em NORMAL', () => {
    const res = classificarDispersao(1.5, 1.0, 1)
    expect(res.regime).toBe('NORMAL')
  })

  // Garante que as duas bandas compartilham a mesma matemática (±2·sqrt(2/df))
  it('banda agregada e condicional coincidem para mesmo grau de liberdade', () => {
    const nObs = 401 // df agregado = nObs - 1 = 400
    const gl = 400   // df condicional = 400
    const agg = classificarDispersao(1.0, 1.0, nObs).banda
    const cond = classificarDispersaoResiduos(1.0, gl).banda
    expect(agg.inferior).toBeCloseTo(cond.inferior, 6)
    expect(agg.superior).toBeCloseTo(cond.superior, 6)
  })

  // Teste de fronteira na própria banda dinâmica
  it('D exatamente no limite superior é NORMAL (banda inclusiva)', () => {
    const nObs = 401
    const margem = 2 * Math.sqrt(2 / (nObs - 1))
    const dLimite = 1 + margem // exatamente na borda
    expect(classificarDispersao(dLimite, 1.0, nObs).regime).toBe('NORMAL')
  })

  // Guard rail de N pequeno na classificação
  it('N minúsculo (1 jogo) sempre retorna NORMAL', () => {
    expect(classificarDispersao(3.0, 1.0, 2).regime).toBe('NORMAL') // D=3 mas N=2
  })

  // --- Novos Testes de Coeficiente de Variação (CV) ---

  it('xG agregado retorna tipo CV e veredito null', () => {
    const obs = [0.5, 1.5, 2.0, 0.7, 1.2]
    const lam = [1.0, 1.0, 1.0, 1.0, 1.0]
    const r = calcularDispersaoMetrica(obs, lam, 2, 'XG')
    expect(r.agregado.tipo).toBe('CV')
    expect(r.agregado.veredito).toBeNull()
    expect(r.condicional.tipo).toBe('CV')
    expect(r.condicional.veredito).toBeNull()
  })

  it('gols agregado mantem tipo VMR com veredito e banda', () => {
    const obs = [1, 2, 0, 1, 3]
    const lam = [1.0, 1.0, 1.0, 1.0, 1.0]
    const r = calcularDispersaoMetrica(obs, lam, 2, 'GOLS')
    expect(r.agregado.tipo).toBe('VMR')
    expect(r.agregado.veredito).not.toBeNull()
    expect(r.condicional.tipo).toBe('VMR')
    expect(r.condicional.veredito).not.toBeNull()
  })
})
