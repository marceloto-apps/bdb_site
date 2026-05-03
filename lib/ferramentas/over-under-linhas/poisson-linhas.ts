import { poissonPmf } from '@/lib/analytics/poisson'

/**
 * Calcula P(Under line) para uma dada linha de gols.
 * Trata linhas inteiras (.0), meias (.5), quartos (.25) e três quartos (.75).
 */
export function calcularProbUnderLinha(lambda: number, line: number): number {
  const fracao = line % 1

  if (fracao === 0.5) {
    // Linha meia (.5): Under = P(X ≤ floor(line))
    const kLimit = Math.floor(line)
    let prob = 0
    for (let k = 0; k <= kLimit; k++) prob += poissonPmf(lambda, k)
    return prob
  }

  if (fracao === 0) {
    // Linha inteira (asiática): metade push
    const kLimit = line
    let probUnder = 0
    for (let k = 0; k < kLimit; k++) probUnder += poissonPmf(lambda, k)
    const probPush = poissonPmf(lambda, kLimit)
    return probUnder + probPush / 2
  }

  if (fracao === 0.25) {
    // Linha .25: metade na inteira, metade na meia abaixo
    const pMeia = calcularProbUnderLinha(lambda, Math.floor(line) + 0.5)
    const pInteira = calcularProbUnderLinha(lambda, Math.floor(line))
    return (pInteira + pMeia) / 2
  }

  if (fracao === 0.75) {
    // Linha .75: metade na meia, metade na inteira acima
    const pMeia = calcularProbUnderLinha(lambda, Math.floor(line) + 0.5)
    const pInteira = calcularProbUnderLinha(lambda, Math.floor(line) + 1)
    return (pMeia + pInteira) / 2
  }

  // Fallback para outros valores
  return calcularProbUnderLinha(lambda, Math.round(line * 2) / 2)
}

/**
 * Encontra lambda implícito via bisseção a partir da probabilidade justa do Under.
 * 20 iterações → precisão de ~10⁻⁶
 */
export function encontrarLambdaBisection(
  fairProbUnder: number,
  anchorLine: number,
  iterations = 20
): number {
  let low = 0.1
  let high = 15

  for (let i = 0; i < iterations; i++) {
    const mid = (low + high) / 2
    if (calcularProbUnderLinha(mid, anchorLine) > fairProbUnder) {
      low = mid
    } else {
      high = mid
    }
  }

  return (low + high) / 2
}
