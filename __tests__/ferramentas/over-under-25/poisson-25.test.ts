
import { probUnder25, encontrarLambdaIterativo } from '@/lib/ferramentas/over-under-25/poisson-25'

describe('probUnder25', () => {
  test('calcula P(X <= 2) para lambda conhecido', () => {
    // Com lambda 2.5, P(X<=2) ≈ 0.5438
    expect(probUnder25(2.5)).toBeCloseTo(0.5438, 3)
  })
})

describe('encontrarLambdaIterativo', () => {
  test('encontra lambda a partir de probabilidade justa', () => {
    const lambda = encontrarLambdaIterativo(0.5438)
    expect(lambda).toBeCloseTo(2.5, 1)
  })
})
