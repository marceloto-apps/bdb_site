/** Entradas da simulação Monte Carlo */
export interface MonteCarloInputs {
  banca: number
  oddsMedia: number
  roiEsperado: number        // percentual (-100 a 100)
  numBets: number
  tempoMeses: number
  limiteDrawdown: number     // percentual (5 a 95)
  stakeEscolhida: number    // percentual da banca (0.1 a 100)
  simulacoesCount: number   // 100 a 10000
}

/** Resultados completos da simulação */
export interface MonteCarloResults {
  pValue: number
  probLucro: number          // percentual
  survivalRate: number       // percentual
  volumeNecessario: number
  piorROI: number            // percentual
  melhorROI: number          // percentual
  totalProfit: number        // em unidades
  avgMDD: number             // percentual
  worstDD: number            // percentual
  histData: DrawdownBucket[]
  chartData: PatrimonioPoint[]
}

/** Bucket do histograma de drawdown */
export interface DrawdownBucket {
  range: string              // "0%", "10%", ..., "90%"
  percent: number            // % de simulações neste bucket
  danger: boolean            // true se bucket >= limiteDrawdown
}

/** Ponto de uma curva de patrimônio */
export interface PatrimonioPoint {
  bet: number
  [key: string]: number      // s0, s1, ..., s11
}
