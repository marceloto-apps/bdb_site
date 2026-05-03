import type { AncoraInput, LinhaProjetada, ProjecaoStats } from './types'
import { calcularProbUnderLinha, encontrarLambdaBisection } from './poisson-linhas'

/**
 * Extrai juice e lambda a partir das odds de referência da âncora.
 */
export function extrairJuiceAncora(input: AncoraInput): ProjecaoStats {
  const pUnder = 1 / input.under
  const pOver = 1 / input.over
  const juice = (pUnder + pOver - 1) * 100

  // Probabilidade justa (removendo juice)
  const fairProbUnder = pUnder / (pUnder + pOver)

  // Encontrar lambda via bisseção
  const lambda = encontrarLambdaBisection(fairProbUnder, input.line)

  return { juice, lambda }
}

/**
 * Converte probabilidade fair em odd projetada com juice.
 * Método multiplicativo proporcional — garante que na âncora,
 * as odds projetadas ≈ odds de input.
 *
 * Fórmula: oddProj = 1 / (fairProb × (1 + juice/100))
 * Piso de 1.01 para segurança operacional.
 */
export function fairToOdd(fairProb: number, juicePercent: number): number {
  const implied = fairProb * (1 + juicePercent / 100)
  return Math.max(1.01, 1 / implied)
}

/**
 * Gera tabela completa de linhas projetadas.
 * Margem dinâmica: juice_base + (steps_da_âncora × 0.25)
 * Cada step de 0.25 na linha = +0.25% de juice
 */
export function calcularTabelaProjecao(
  lambda: number,
  juiceBase: number,
  anchorLine: number
): LinhaProjetada[] {
  const linhas = [1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75]

  return linhas.map((line) => {
    const fairU = calcularProbUnderLinha(lambda, line)
    const fairO = 1 - fairU

    // Margem dinâmica: cresce +0.25% por step de 0.25 de distância
    const steps = Math.abs(line - anchorLine) / 0.25
    const margem = juiceBase + steps * 0.25

    // Converter fair → odds projetadas com juice
    const oddU = fairToOdd(fairU, margem)
    const oddO = fairToOdd(fairO, margem)

    return {
      label: `Gols ${line.toFixed(2)}`,
      line,
      under: oddU.toFixed(2),
      over: oddO.toFixed(2),
      probUnder: (fairU * 100).toFixed(1),
      probOver: (fairO * 100).toFixed(1),
      juice: margem.toFixed(2),
      isAnchor: line === anchorLine,
    }
  })
}
