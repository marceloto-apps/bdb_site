import { matrizPlacaresZIP, zipPmf } from '../../lib/analytics/zero-inflated'

describe('Zero-Inflated Poisson', () => {
  it('se pi = 0, deve ser matematicamente igual a Poisson puro', () => {
    const pZip = zipPmf(1.5, 2, 0)
    const pPoisson = (Math.exp(-1.5) * Math.pow(1.5, 2)) / 2
    expect(pZip).toBeCloseTo(pPoisson, 5)
  })

  it('se pi = 1, probabilidade de 0x0 deve ser exatamente 1', () => {
    const pZip = zipPmf(1.5, 0, 1.0)
    expect(pZip).toBe(1.0)
    
    const matriz = matrizPlacaresZIP(1.5, 1.2, 1.0, 1.0)
    expect(matriz[0][0]).toBe(1.0)
    expect(matriz[1][0]).toBe(0)
  })

  it('matriz deve somar aproximadamente 1 mesmo com pi > 0', () => {
    const matriz = matrizPlacaresZIP(1.5, 1.2, 0.1, 0.15)
    const soma = matriz.flat().reduce((acc, v) => acc + v, 0)
    expect(soma).toBeCloseTo(1.0, 2)
  })
})
