import { describe, test, expect } from 'vitest'
import { normalPdf, gramCharlierPdf, gerarCurvasDistribuicao } from '@/lib/ferramentas/distribuicao/estatisticas'

describe('normalPdf', () => {
  test('pico da normal padrão é ~0.3989', () => {
    expect(normalPdf(0, 0, 1)).toBeCloseTo(0.3989, 4)
  })
})

describe('gramCharlierPdf', () => {
  test('com skew=0 e kurt=3, é idêntica à normal', () => {
    const pN = normalPdf(1, 0, 1)
    const pGC = gramCharlierPdf(1, 0, 1, 0, 3)
    expect(pGC).toBeCloseTo(pN, 5)
  })

  test('probabilidade nunca é negativa', () => {
    const p = gramCharlierPdf(10, 0, 1, 2, 6) // cauda extrema
    expect(p).toBeGreaterThanOrEqual(0)
  })
})

describe('gerarCurvasDistribuicao', () => {
  test('gera array com 201 pontos (de -10 a 10 passo 0.1)', () => {
    const data = gerarCurvasDistribuicao({ baseMean: 0, stdDev: 1, skewness: 0, kurtosis: 3 })
    expect(data.length).toBe(201)
    expect(data[0].x).toBeCloseTo(-10, 1)
    expect(data[200].x).toBeCloseTo(10, 1)
  })
})
