import { describe, test, expect } from 'vitest'
import { cumulativeNormal, calcularPValue, calcularVolumeValidador } from '@/lib/ferramentas/validacao-risco/estatisticas'

describe('cumulativeNormal', () => {
  test('z=0 retorna 0.5', () => {
    expect(cumulativeNormal(0)).toBeCloseTo(0.5, 4)
  })

  test('z=1.96 retorna ~0.975', () => {
    expect(cumulativeNormal(1.96)).toBeCloseTo(0.975, 3)
  })

  test('z=-1.96 retorna ~0.025', () => {
    expect(cumulativeNormal(-1.96)).toBeCloseTo(0.025, 3)
  })
})

describe('calcularPValue', () => {
  test('ROI positivo com amostra grande produz p-value baixo', () => {
    const p = (0.05 + 1) / 2.0 // prob vitória para ROI 5% e odd 2.0
    const pValue = calcularPValue(p, 2000, 2.0)
    expect(pValue).toBeLessThan(0.05)
  })
})

describe('calcularVolumeValidador', () => {
  test('retorna número inteiro positivo', () => {
    const p = (0.05 + 1) / 2.0
    const vol = calcularVolumeValidador(p, 2.0, 0.05)
    expect(vol).toBeGreaterThan(0)
    expect(Number.isInteger(vol)).toBe(true)
  })
})
