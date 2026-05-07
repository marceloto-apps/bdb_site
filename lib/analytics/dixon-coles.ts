import { Match } from '@prisma/client'
import { MediasLigaCalculadas } from './medias'
import { poissonPmf } from './poisson'

export function tauDixonColes(
  x: number,
  y: number,
  lambdaH: number,
  lambdaA: number,
  rho: number
): number {
  if (x === 0 && y === 0) return 1 - lambdaH * lambdaA * rho
  if (x === 0 && y === 1) return 1 + lambdaH * rho
  if (x === 1 && y === 0) return 1 + lambdaA * rho
  if (x === 1 && y === 1) return 1 - rho
  return 1
}

export function validarRho(rho: number, lambdaH: number, lambdaA: number): boolean {
  const minRho = Math.max(-1 / lambdaH, -1 / lambdaA)
  const maxRho = Math.min(1 / (lambdaH * lambdaA), 1)
  return rho >= minRho && rho <= maxRho
}

export function clampRho(rho: number, lambdaH: number, lambdaA: number): { rho: number; clamped: boolean } {
  const minRho = Math.max(-1 / lambdaH, -1 / lambdaA)
  const maxRho = Math.min(1 / (lambdaH * lambdaA), 1)
  
  if (rho < minRho) {
    console.warn(`[Dixon-Coles] rho=${rho} clampado para min=${minRho}`)
    return { rho: minRho, clamped: true }
  }
  if (rho > maxRho) {
    console.warn(`[Dixon-Coles] rho=${rho} clampado para max=${maxRho}`)
    return { rho: maxRho, clamped: true }
  }
  return { rho, clamped: false }
}

export function estimarRhoEmpirico(
  jogos: Match[],
  medias: MediasLigaCalculadas
): number {
  const jogosConcluidos = jogos.filter(j => j.fthg !== null && j.ftag !== null)
  const N = jogosConcluidos.length
  if (N === 0) return 0

  const freqObservada: Record<string, number> = {
    '0,0': jogosConcluidos.filter(j => j.fthg === 0 && j.ftag === 0).length / N,
    '0,1': jogosConcluidos.filter(j => j.fthg === 0 && j.ftag === 1).length / N,
    '1,0': jogosConcluidos.filter(j => j.fthg === 1 && j.ftag === 0).length / N,
    '1,1': jogosConcluidos.filter(j => j.fthg === 1 && j.ftag === 1).length / N,
  }

  const lh = medias.muH
  const la = medias.muA

  let melhorRho = 0
  let menorErro = Infinity

  for (let i = -30; i <= 30; i++) {
    const rho = i / 100
    // Evita rho fora dos limites globais durante o grid search
    if (!validarRho(rho, lh, la)) continue

    let erro = 0
    for (const [chave, freq] of Object.entries(freqObservada)) {
      const [x, y] = chave.split(',').map(Number)
      const probTeorica = tauDixonColes(x, y, lh, la, rho) * poissonPmf(lh, x) * poissonPmf(la, y)
      erro += Math.pow(freq - probTeorica, 2)
    }
    if (erro < menorErro) {
      menorErro = erro
      melhorRho = rho
    }
  }

  if (Math.abs(melhorRho) < 0.001) {
    return 0
  }

  return melhorRho
}

export function matrizPlacaresDixonColes(
  lambdaH: number,
  lambdaA: number,
  rho: number,
  max = 10
): { matriz: number[][]; rhoClamped: boolean; rhoUsado: number } {
  const { rho: rhoFinal, clamped } = clampRho(rho, lambdaH, lambdaA)
  
  const matriz: number[][] = []
  let soma = 0
  
  for (let h = 0; h <= max; h++) {
    matriz[h] = []
    for (let a = 0; a <= max; a++) {
      const tau = tauDixonColes(h, a, lambdaH, lambdaA, rhoFinal)
      const p = tau * poissonPmf(lambdaH, h) * poissonPmf(lambdaA, a)
      matriz[h][a] = p
      soma += p
    }
  }
  
  // Normalizar para garantir soma ~1.0
  if (Math.abs(soma - 1.0) > 0.001) {
    for (let h = 0; h <= max; h++) {
      for (let a = 0; a <= max; a++) {
        matriz[h][a] /= soma
      }
    }
  }
  
  return { matriz, rhoClamped: clamped, rhoUsado: rhoFinal }
}
