import { MediasLigaCalculadas } from './medias'
import { Match } from '@prisma/client'
import { fatorial } from './poisson'

export function estimarPiLiga(
  jogos: Match[],
  medias: MediasLigaCalculadas
): { piH: number; piA: number } {
  const jogosConcluidos = jogos.filter((j) => j.fthg !== null && j.ftag !== null)
  const N = jogosConcluidos.length
  if (N === 0) return { piH: 0, piA: 0 }

  // Frequência observada de zero gols
  const freqZeroCasa = jogosConcluidos.filter(j => j.fthg === 0).length / N
  const freqZeroFora = jogosConcluidos.filter(j => j.ftag === 0).length / N

  // Frequência prevista por Poisson
  const probZeroPoissonCasa = Math.exp(-medias.muH)
  const probZeroPoissonFora = Math.exp(-medias.muA)

  // π é o "excesso" de zeros não explicado por Poisson
  const piH = Math.max(0, freqZeroCasa - probZeroPoissonCasa)
  const piA = Math.max(0, freqZeroFora - probZeroPoissonFora)

  return { piH, piA }
}

export function zipPmf(lambda: number, x: number, pi: number): number {
  if (x === 0) {
    return pi + (1 - pi) * Math.exp(-lambda)
  }
  return (1 - pi) * (Math.exp(-lambda) * Math.pow(lambda, x)) / fatorial(x)
}

export function matrizPlacaresZIP(
  lambdaH: number,
  lambdaA: number,
  piH: number,
  piA: number,
  max = 10
): number[][] {
  const matriz: number[][] = []
  let soma = 0
  for (let h = 0; h <= max; h++) {
    matriz[h] = []
    for (let a = 0; a <= max; a++) {
      const p = zipPmf(lambdaH, h, piH) * zipPmf(lambdaA, a, piA)
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
  return matriz
}
