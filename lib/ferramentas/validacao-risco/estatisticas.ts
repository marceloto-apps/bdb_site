/**
 * Distribuição normal cumulativa (CDF).
 * Aproximação de Abramowitz & Stegun (fórmula 26.2.17).
 * Precisão: |erro| < 7.5 × 10⁻⁸
 *
 * Coeficientes:
 *   t = 1 / (1 + 0.2316419 × |z|)
 *   d = φ(z) = (1/√2π) × e^(-z²/2) ≈ 0.3989423 × e^(-z²/2)
 */
export function cumulativeNormal(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp(-z * z / 2)
  const prob = d * t * (
    0.3193815 + t * (
      -0.3565638 + t * (
        1.7814779 + t * (
          -1.821256 + t * 1.330274
        )
      )
    )
  )
  return z > 0 ? 1 - prob : prob
}

/**
 * Calcula p-value: probabilidade de obter o ROI observado
 * assumindo que a hipótese nula (ROI = 0) é verdadeira.
 */
export function calcularPValue(
  probVitoria: number,
  numBets: number,
  oddsMedia: number
): number {
  const pNula = 1 / oddsMedia
  const zScore = (probVitoria * numBets - pNula * numBets) /
    Math.sqrt(numBets * pNula * (1 - pNula))
  return 1 - cumulativeNormal(zScore)
}

/**
 * Volume mínimo de apostas necessário para validar o ROI
 * com 95% de confiança. Margem de erro = ROI esperado
 * (objetivo: detectar existência de edge, não sua magnitude).
 */
export function calcularVolumeValidador(
  probVitoria: number,
  oddsMedia: number,
  roiDecimal: number
): number {
  const b = oddsMedia - 1
  const q = 1 - probVitoria
  const variancePerUnit = (probVitoria * Math.pow(b, 2)) +
    (q * Math.pow(-1, 2)) - Math.pow(roiDecimal, 2)
  const stdDevPerUnit = Math.sqrt(variancePerUnit)
  // Margem de erro = ROI inteiro (objetivo: detectar se há edge, não medir o tamanho)
  const precisionNeeded = Math.max(0.01, Math.abs(roiDecimal))
  return Math.ceil(Math.pow((1.96 * stdDevPerUnit) / precisionNeeded, 2))
}

/**
 * Intervalo de confiança do ROI a 95%.
 */
export function calcularIntervaloConfianca(
  probVitoria: number,
  oddsMedia: number,
  roiDecimal: number,
  numBets: number
): { piorROI: number; melhorROI: number } {
  const b = oddsMedia - 1
  const q = 1 - probVitoria
  const variancePerUnit = (probVitoria * Math.pow(b, 2)) +
    (q * Math.pow(-1, 2)) - Math.pow(roiDecimal, 2)
  const stdDevPerUnit = Math.sqrt(variancePerUnit)
  const errorROI = stdDevPerUnit / Math.sqrt(numBets)
  return {
    piorROI: (roiDecimal - 1.96 * errorROI) * 100,
    melhorROI: (roiDecimal + 1.96 * errorROI) * 100,
  }
}
