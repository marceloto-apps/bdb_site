import { matrizPlacaresPoisson, calcularMercados } from '@/lib/analytics/poisson'

describe('Poisson — Athletico-PR vs Athletico-PR (CS padrão da planilha)', () => {
  const muH = 1.57
  const muA = 1.05

  // Forças do Athletico-PR (linha BDBRA1)
  const fcAtC = 1.24
  const fcDfC = 0.64
  const fcAtV = 0.80
  const fcDfV = 1.05

  test('lambdas calculados', () => {
    const lambdaH = fcAtC * fcDfV * muH   // 1.24 × 1.05 × 1.57
    const lambdaA = fcAtV * fcDfC * muA   // 0.80 × 0.64 × 1.05
    expect(lambdaH).toBeCloseTo(2.04, 1)
    expect(lambdaA).toBeCloseTo(0.54, 1)
  })

  test('matriz de placares — células-chave', () => {
    const matriz = matrizPlacaresPoisson(1.57, 1.05)
    // Valores extraídos da matriz CS da planilha
    expect(matriz[0][0]).toBeCloseTo(0.0725, 2)   // 7,25%
    expect(matriz[1][1]).toBeCloseTo(0.1199, 2)   // 11,99%
    expect(matriz[2][1]).toBeCloseTo(0.0943, 2)   //  9,43%
    expect(matriz[1][0]).toBeCloseTo(0.1140, 2)   // 11,40%
    expect(matriz[2][0]).toBeCloseTo(0.0897, 2)   //  8,97%
  })

  test('mercados derivados', () => {
    const matriz = matrizPlacaresPoisson(1.57, 1.05)
    const mercados = calcularMercados(matriz)
    // Probabilidades da planilha aba CS
    expect(mercados.casa).toBeCloseTo(0.4942, 2)      // 49,42%
    expect(mercados.empate).toBeCloseTo(0.2521, 2)    // 25,21%
    expect(mercados.visit).toBeCloseTo(0.2537, 2)     // 25,37%
    expect(mercados.btts).toBeCloseTo(0.5155, 2)      // 51,55%
    expect(mercados.bttsNao).toBeCloseTo(0.4845, 2)   // 48,45%
    expect(mercados.over05).toBeCloseTo(0.9275, 2)    // 92,75%
    expect(mercados.over15).toBeCloseTo(0.7372, 2)    // 73,72%
    expect(mercados.over25).toBeCloseTo(0.4876, 2)    // 48,76%
    expect(mercados.over35).toBeCloseTo(0.2692, 2)    // 26,92%
    expect(mercados.goleadaCasa).toBeCloseTo(0.0583, 2)  //  5,83% (corrigido do doc original)
    expect(mercados.goleadaVis).toBeCloseTo(0.0131, 2)   //  1,31% (corrigido do doc original)
  })
})
