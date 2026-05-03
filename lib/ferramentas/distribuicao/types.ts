export interface DistribuicaoInputs {
  baseMean: number
  stdDev: number
  skewness: number
  kurtosis: number
}

export interface DataPoint {
  x: number
  normal: number    // PDF da normal padrão
  modified: number  // PDF com expansão Gram-Charlier
}

/** Medidas de tendência central calculadas numericamente */
export interface EstatisticasCentrais {
  media: number
  mediana: number
  moda: number
  picoDensidade: number
  sigmaMarkers: {
    minus2: number
    minus1: number
    plus1: number
    plus2: number
  }
}
