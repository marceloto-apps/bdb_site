import { matrizPlacaresPoisson, poissonPmf } from '../../lib/analytics/poisson'

describe('Poisson', () => {
  it('a soma total da matriz (10x10) deve ser proxima a 1', () => {
    const matriz = matrizPlacaresPoisson(1.5, 1.2)
    const soma = matriz.flat().reduce((acc, v) => acc + v, 0)
    expect(soma).toBeCloseTo(1.0, 2)
  })

  it('lambda igual a 0 nao deve quebrar o calculo', () => {
    const pmf = poissonPmf(0, 0)
    expect(pmf).toBe(1)
    
    const pmf2 = poissonPmf(0, 1)
    expect(pmf2).toBe(0)
    
    const matriz = matrizPlacaresPoisson(0, 0)
    expect(matriz[0][0]).toBe(1)
    expect(matriz[1][0]).toBe(0)
  })

  it('probabilidade deve ser simetrica quando lambdas sao iguais', () => {
    const matriz = matrizPlacaresPoisson(2.0, 2.0)
    expect(matriz[1][0]).toBeCloseTo(matriz[0][1], 5)
    expect(matriz[3][2]).toBeCloseTo(matriz[2][3], 5)
  })
})
