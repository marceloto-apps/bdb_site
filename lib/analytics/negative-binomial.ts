import { Match } from '@prisma/client'
import { MediasLigaCalculadas } from './medias'
import { poissonPmf } from './poisson'

export function calcularVarianciaGols(
  jogos: Match[],
  medias: MediasLigaCalculadas
): { varCasa: number; varFora: number } {
  const jogosConcluidos = jogos.filter((j) => j.fthg !== null && j.ftag !== null)
  const N = jogosConcluidos.length
  if (N === 0) return { varCasa: 0, varFora: 0 }

  const varCasa = jogosConcluidos.reduce(
    (s, j) => s + Math.pow((j.fthg as number) - medias.muH, 2), 0
  ) / N
  
  const varFora = jogosConcluidos.reduce(
    (s, j) => s + Math.pow((j.ftag as number) - medias.muA, 2), 0
  ) / N
  
  return { varCasa, varFora }
}

export interface ParametrosNB {
  r: number
  p: number
  fallbackParaPoisson: boolean
}

export const TOLERANCIA_SOBREDISPERSAO = 1.01

export function estimarParametrosNB(
  lambda: number,
  variancia: number
): ParametrosNB {
  // Evitar problemas numéricos se var for levemente maior
  if (variancia <= lambda * TOLERANCIA_SOBREDISPERSAO) {
    return { r: Infinity, p: 1, fallbackParaPoisson: true }
  }
  const p = lambda / variancia
  const r = (lambda * lambda) / (variancia - lambda)
  return { r, p, fallbackParaPoisson: false }
}

// Coeficiente binomial generalizado para r não-inteiro
export function logGamma(z: number): number {
  const g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z)
  }
  z -= 1
  let x = c[0]
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i)
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

export function nbPmf(x: number, r: number, p: number): number {
  if (r === Infinity) {
    throw new Error('NB_INVALID_PARAMS: r=Infinity indica fallback para Poisson')
  }
  const logCoef = logGamma(x + r) - logGamma(x + 1) - logGamma(r)
  const logProb = logCoef + x * Math.log(1 - p) + r * Math.log(p)
  return Math.exp(logProb)
}

export type NBWarning = 'FALLBACK_PARCIAL_HOME' | 'FALLBACK_PARCIAL_AWAY' | 'FALLBACK_TOTAL' | null

export function matrizPlacaresNB(
  lambdaH: number,
  lambdaA: number,
  varH: number,
  varA: number,
  max = 10
): { matriz: number[][]; warning: NBWarning } {
  const paramsH = estimarParametrosNB(lambdaH, varH)
  const paramsA = estimarParametrosNB(lambdaA, varA)
  
  let warning: NBWarning = null
  if (paramsH.fallbackParaPoisson && paramsA.fallbackParaPoisson) {
    warning = 'FALLBACK_TOTAL'
  } else if (paramsH.fallbackParaPoisson) {
    warning = 'FALLBACK_PARCIAL_HOME'
  } else if (paramsA.fallbackParaPoisson) {
    warning = 'FALLBACK_PARCIAL_AWAY'
  }

  const matriz: number[][] = []
  let soma = 0
  
  for (let h = 0; h <= max; h++) {
    matriz[h] = []
    for (let a = 0; a <= max; a++) {
      const probH = paramsH.fallbackParaPoisson
        ? poissonPmf(lambdaH, h)
        : nbPmf(h, paramsH.r, paramsH.p)
      const probA = paramsA.fallbackParaPoisson
        ? poissonPmf(lambdaA, a)
        : nbPmf(a, paramsA.r, paramsA.p)
      
      const p = probH * probA
      matriz[h][a] = p
      soma += p
    }
  }
  
  if (Math.abs(soma - 1.0) > 0.001) {
    for (let h = 0; h <= max; h++) {
      for (let a = 0; a <= max; a++) {
        matriz[h][a] /= soma
      }
    }
  }
  
  return { matriz, warning }
}
