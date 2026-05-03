import { describe, test, expect } from 'vitest'
import { fatorial, poissonPmf, poissonCdf } from '@/lib/analytics/poisson'

describe('fatorial', () => {
  test('casos base', () => {
    expect(fatorial(0)).toBe(1)
    expect(fatorial(1)).toBe(1)
    expect(fatorial(5)).toBe(120)
    expect(fatorial(10)).toBe(3628800)
  })

  test('número negativo lança erro', () => {
    expect(() => fatorial(-1)).toThrow()
  })
})

describe('poissonPmf', () => {
  test('lambda = 0 retorna 1 para x=0', () => {
    expect(poissonPmf(0, 0)).toBe(1)
    expect(poissonPmf(0, 1)).toBe(0)
  })

  test('valores conhecidos (lambda=2.5)', () => {
    // P(X=0) com lambda=2.5 = e^(-2.5) ≈ 0.0821
    expect(poissonPmf(2.5, 0)).toBeCloseTo(0.0821, 3)
    // P(X=2) com lambda=2.5 ≈ 0.2565
    expect(poissonPmf(2.5, 2)).toBeCloseTo(0.2565, 3)
  })
})

describe('poissonCdf', () => {
  test('P(X <= 2) com lambda=2.5', () => {
    // CDF(2, 2.5) ≈ 0.5438
    expect(poissonCdf(2.5, 2)).toBeCloseTo(0.5438, 3)
  })
})
