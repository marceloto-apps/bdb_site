import { matrizPlacaresDixonColes, validarRho, clampRho, tauDixonColes } from '../../lib/analytics/dixon-coles'
import { matrizPlacaresPoisson } from '../../lib/analytics/poisson'

describe('Dixon-Coles', () => {
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

  it('clampRho ajusta valores fora do limite', () => {
    const lambdaH = 1.5
    const lambdaA = 1.0
    
    const res2 = clampRho(0.8, lambdaH, lambdaA)
    expect(res2.clamped).toBe(true)
    expect(res2.rho).toBeCloseTo(0.666, 2)
  })

  it('rho=0 deve ser equivalente a Poisson', () => {
    const resDC = matrizPlacaresDixonColes(1.5, 1.2, 0)
    const matPoisson = matrizPlacaresPoisson(1.5, 1.2)
    
    expect(resDC.matriz[0][0]).toBeCloseTo(matPoisson[0][0], 5)
    expect(resDC.matriz[1][1]).toBeCloseTo(matPoisson[1][1], 5)
  })

  it('matriz deve somar aproximadamente 1 mesmo com rho != 0', () => {
    const resDC = matrizPlacaresDixonColes(1.5, 1.2, 0.15)
    const soma = resDC.matriz.flat().reduce((acc, v) => acc + v, 0)
    expect(soma).toBeCloseTo(1.0, 2)
    expect(resDC.rhoClamped).toBe(false)
  })

  it('deve retornar rhoClamped true se rho for fora dos limites', () => {
    const resDC = matrizPlacaresDixonColes(1.5, 1.2, 0.99)
    expect(resDC.rhoClamped).toBe(true)
  })
})
