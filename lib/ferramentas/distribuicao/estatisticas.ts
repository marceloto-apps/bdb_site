import type { DistribuicaoInputs, DataPoint, EstatisticasCentrais } from './types'

/** Constante 1/sqrt(2π) */
const INV_SQRT_2PI = 1 / Math.sqrt(2 * Math.PI)

/**
 * PDF Normal Padrão
 */
export function normalPdf(x: number, mean: number, stdDev: number): number {
  const z = (x - mean) / stdDev
  return (INV_SQRT_2PI / stdDev) * Math.exp(-0.5 * z * z)
}

/**
 * Polinômios de Hermite para expansão Gram-Charlier.
 * H3(z) = z³ - 3z (associado a Skewness)
 * H4(z) = z⁴ - 6z² + 3 (associado a Kurtosis)
 */
export function hermiteH3(z: number): number {
  return z * z * z - 3 * z
}

export function hermiteH4(z: number): number {
  const z2 = z * z
  return z2 * z2 - 6 * z2 + 3
}

/**
 * Expansão de Gram-Charlier Tipo A.
 * f(x) = φ(z) × [1 + (γ₁/6)H₃(z) + (γ₂/24)H₄(z)]
 * onde γ₁ = skewness, γ₂ = kurtosis - 3 (excesso)
 */
export function gramCharlierPdf(
  x: number,
  mean: number,
  stdDev: number,
  skew: number,
  kurt: number
): number {
  const z = (x - mean) / stdDev
  const baseNormal = normalPdf(x, mean, stdDev)
  const excessKurt = kurt - 3

  const modifier = 1 + (skew * hermiteH3(z)) / 6 + (excessKurt * hermiteH4(z)) / 24

  return Math.max(0, baseNormal * modifier)
}

/**
 * Gera os dados completos para plotar as curvas.
 * Domínio dinâmico: [μ - 4σ, μ + 4σ] com passo adaptativo
 */
export function gerarCurvasDistribuicao(inputs: DistribuicaoInputs): DataPoint[] {
  const { baseMean, stdDev, skewness, kurtosis } = inputs
  const data: DataPoint[] = []

  // Domínio dinâmico baseado nos parâmetros
  const rangeMin = Math.min(-10, baseMean - 4 * stdDev)
  const rangeMax = Math.max(10, baseMean + 4 * stdDev)
  const step = 0.1

  for (let x = rangeMin; x <= rangeMax; x += step) {
    const xFixed = Math.round(x * 10) / 10
    data.push({
      x: xFixed,
      normal: normalPdf(xFixed, baseMean, stdDev),
      modified: gramCharlierPdf(xFixed, baseMean, stdDev, skewness, kurtosis),
    })
  }

  return data
}

/**
 * Calcula medidas de tendência central a partir da curva GC.
 * Usa busca numérica sobre os dados gerados (sem fórmulas empíricas).
 */
export function calcularEstatisticasCentrais(
  data: DataPoint[],
  inputs: DistribuicaoInputs
): EstatisticasCentrais {
  const { baseMean, stdDev } = inputs

  // Moda: ponto x com maior densidade modificada
  let moda = data[0].x
  let maxDensity = 0
  for (const point of data) {
    if (point.modified > maxDensity) {
      maxDensity = point.modified
      moda = point.x
    }
  }

  // Média numérica: ∫ x·f(x)dx ≈ Σ x·f(x)·Δx
  const step = 0.1
  let mediaNum = 0
  let areaTotal = 0
  for (const point of data) {
    mediaNum += point.x * point.modified * step
    areaTotal += point.modified * step
  }
  // Normalizar pela área (GC pode não integrar exatamente 1)
  const media = areaTotal > 0 ? mediaNum / areaTotal : baseMean

  // Mediana numérica: ponto onde CDF acumulada = 50%
  let cdfAccum = 0
  let mediana = baseMean
  const halfArea = areaTotal / 2
  for (const point of data) {
    cdfAccum += point.modified * step
    if (cdfAccum >= halfArea) {
      mediana = point.x
      break
    }
  }

  return {
    media,
    mediana,
    moda,
    picoDensidade: maxDensity,
    sigmaMarkers: {
      minus2: baseMean - 2 * stdDev,
      minus1: baseMean - stdDev,
      plus1: baseMean + stdDev,
      plus2: baseMean + 2 * stdDev,
    },
  }
}
