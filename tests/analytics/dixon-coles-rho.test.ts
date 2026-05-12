import { validarRho, clampRho, tauDixonColes } from '../../lib/analytics/dixon-coles'

describe('Dixon-Coles Rho', () => {
  it('tauDixonColes afeta apenas 4 placares', () => {
    const lambdaH = 1.5
    const lambdaA = 1.0
    const rho = 0.1
    
    // As 4 células
    expect(tauDixonColes(0, 0, lambdaH, lambdaA, rho)).toBe(1 - lambdaH * lambdaA * rho)
    expect(tauDixonColes(1, 0, lambdaH, lambdaA, rho)).toBe(1 + lambdaA * rho)
    expect(tauDixonColes(0, 1, lambdaH, lambdaA, rho)).toBe(1 + lambdaH * rho)
    expect(tauDixonColes(1, 1, lambdaH, lambdaA, rho)).toBe(1 - rho)
    
    // Outras células
    expect(tauDixonColes(2, 0, lambdaH, lambdaA, rho)).toBe(1)
    expect(tauDixonColes(0, 2, lambdaH, lambdaA, rho)).toBe(1)
    expect(tauDixonColes(2, 1, lambdaH, lambdaA, rho)).toBe(1)
  })

  it('validarRho respeita limites matemáticos', () => {
    const lambdaH = 1.5
    const lambdaA = 1.0
    // Min = max(-1/1.5, -1/1.0) = max(-0.66, -1) = -0.66
    // Max = min(1/1.5, 1) = 0.66
    expect(validarRho(0.5, lambdaH, lambdaA)).toBe(true)
    expect(validarRho(-0.5, lambdaH, lambdaA)).toBe(true)
    expect(validarRho(0.8, lambdaH, lambdaA)).toBe(false)
    expect(validarRho(-0.8, lambdaH, lambdaA)).toBe(false)
  })

  it('clampRho ajusta valores fora do limite', () => {
    const lambdaH = 1.5
    const lambdaA = 1.0
    
    // Válido
    const res1 = clampRho(0.5, lambdaH, lambdaA)
    expect(res1.clamped).toBe(false)
    expect(res1.rho).toBe(0.5)
    
    // Inválido (maior)
    const res2 = clampRho(0.8, lambdaH, lambdaA)
    expect(res2.clamped).toBe(true)
    expect(res2.rho).toBeCloseTo(0.666, 2)
    
    // Inválido (menor)
    const res3 = clampRho(-0.8, lambdaH, lambdaA)
    expect(res3.clamped).toBe(true)
    expect(res3.rho).toBeCloseTo(-0.666, 2)
  })
})
