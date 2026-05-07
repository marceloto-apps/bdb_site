
import { executarMonteCarlo } from '@/lib/ferramentas/validacao-risco/monte-carlo'

describe('executarMonteCarlo', () => {
  test('retorna todas as métricas esperadas', () => {
    const resultado = executarMonteCarlo({
      banca: 1000,
      oddsMedia: 2.0,
      roiEsperado: 5.0,
      numBets: 100,
      tempoMeses: 6,
      limiteDrawdown: 25,
      stakeEscolhida: 1.0,
      simulacoesCount: 100,
    })

    expect(resultado.pValue).toBeGreaterThanOrEqual(0)
    expect(resultado.probLucro).toBeGreaterThanOrEqual(0)
    expect(resultado.probLucro).toBeLessThanOrEqual(100)
    expect(resultado.survivalRate).toBeGreaterThanOrEqual(0)
    expect(resultado.histData).toHaveLength(10)
    expect(resultado.chartData.length).toBeGreaterThan(0)
  })

  test('banca muito baixa com stake alta resulta em sobrevivência baixa', () => {
    const resultado = executarMonteCarlo({
      banca: 100,
      oddsMedia: 2.0,
      roiEsperado: 0,
      numBets: 500,
      tempoMeses: 6,
      limiteDrawdown: 10,
      stakeEscolhida: 50,
      simulacoesCount: 200,
    })

    expect(resultado.survivalRate).toBeLessThan(50)
  })
})
