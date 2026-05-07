
import { calcularProbUnderLinha, encontrarLambdaBisection } from '@/lib/ferramentas/over-under-linhas/poisson-linhas'

describe('calcularProbUnderLinha', () => {
  test('Under 2.5 com lambda=2.5 retorna ~0.544', () => {
    expect(calcularProbUnderLinha(2.5, 2.5)).toBeCloseTo(0.544, 2)
  })

  test('Under 0.5 com lambda=2.5 retorna ~0.082', () => {
    expect(calcularProbUnderLinha(2.5, 0.5)).toBeCloseTo(0.082, 2)
  })

  test('probabilidade cresce com a linha', () => {
    const p15 = calcularProbUnderLinha(2.5, 1.5)
    const p25 = calcularProbUnderLinha(2.5, 2.5)
    const p35 = calcularProbUnderLinha(2.5, 3.5)
    expect(p15).toBeLessThan(p25)
    expect(p25).toBeLessThan(p35)
  })
})

describe('encontrarLambdaBisection', () => {
  test('recupera lambda a partir de prob conhecida', () => {
    // Se lambda=2.5, Under 2.5 ≈ 0.544
    const lambdaRecuperado = encontrarLambdaBisection(0.544, 2.5)
    expect(lambdaRecuperado).toBeCloseTo(2.5, 1)
  })
})
