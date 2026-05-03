import { poissonCdf } from '@/lib/analytics/poisson'

/**
 * P(Under 2.5) = P(X ≤ 2) usando CDF de Poisson.
 */
export function probUnder25(lambda: number): number {
  return poissonCdf(lambda, 2)
}

/**
 * Encontra lambda via aproximação iterativa multiplicativa (10 iterações).
 * Método do Gemini original — simples e suficiente para este caso.
 */
export function encontrarLambdaIterativo(fairProbUnder25: number): number {
  let lambda = 2.5 // valor inicial razoável

  for (let i = 0; i < 10; i++) {
    const currentProb = probUnder25(lambda)
    lambda = lambda * (currentProb / fairProbUnder25)
  }

  return lambda
}
