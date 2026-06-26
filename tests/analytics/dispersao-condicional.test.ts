import { describe, test, it, expect } from 'vitest'
import {
  calcularDispersaoMetrica,
  classificarDispersao,
  classificarDispersaoResiduos,
  mediaVariancia,
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

  it('teste de sanidade: valorExibido do agregado de gols e CV do xG correspondem a D e CV calculados dinamicamente (nao tautologico)', () => {
    // 1. Dados de gols
    const obsGols = [2, 1, 0, 3, 1, 1, 2, 0, 1, 1]
    const lamGols = [1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2]
    
    // Cálculo dinâmico local de média e variância amostral (Bessel)
    const muGols = obsGols.reduce((a, b) => a + b, 0) / obsGols.length
    const s2Gols = obsGols.reduce((a, b) => a + (b - muGols) ** 2, 0) / (obsGols.length - 1)
    const dEsperado = s2Gols / muGols

    const rGols = calcularDispersaoMetrica(obsGols, lamGols, 2, 'GOLS')
    
    // Asserções para gols (VMR)
    expect(rGols.agregado.indice).toBeCloseTo(dEsperado, 6)
    expect(rGols.agregado.indice).not.toBeCloseTo(muGols, 2) // não é a média
    expect(rGols.agregado.tipo).toBe('VMR')
    expect(rGols.agregado.veredito).not.toBeNull()

    // 2. Dados de xG
    const obsXg = [1.5, 0.8, 1.2, 2.2, 0.5, 1.1, 1.8, 0.6, 1.3, 1.0]
    const lamXg = [1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2]
    
    const muXg = obsXg.reduce((a, b) => a + b, 0) / obsXg.length
    const s2Xg = obsXg.reduce((a, b) => a + (b - muXg) ** 2, 0) / (obsXg.length - 1)
    const cvEsperado = Math.sqrt(s2Xg) / muXg

    const rXg = calcularDispersaoMetrica(obsXg, lamXg, 2, 'XG')

    // Asserções para xG (CV)
    expect(rXg.agregado.indice).toBeCloseTo(cvEsperado, 6)
    expect(rXg.agregado.indice).not.toBeCloseTo(muXg, 2) // não é a média
    expect(rXg.agregado.tipo).toBe('CV')
    expect(rXg.agregado.veredito).toBeNull() // sem veredito/badge
  })

  it('deve usar a correcao de Bessel (N-1) no calculo da variancia amostral', () => {
    // Série: [1, 2, 3] -> Média = 2.
    // Variância amostral com N-1 = 2: 2 / 2 = 1.
    // Variância populacional com N = 3: 2 / 3 ≈ 0.6667.
    const { media, variancia } = mediaVariancia([1, 2, 3])
    expect(media).toBe(2)
    expect(variancia).toBe(1)
    expect(variancia).not.toBeCloseTo(2/3, 4)
  })
})
