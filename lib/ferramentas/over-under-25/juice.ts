import type { OddsReferencia25, LinhaCalculada25, MarketStats25 } from './types'
import { poissonCdf, poissonPmf } from '@/lib/analytics/poisson'
import { encontrarLambdaIterativo } from './poisson-25'

/**
 * Extrai juice, fair probs e lambda a partir das odds de referência na 2.5.
 */
export function extrairJuice25(refs: OddsReferencia25): MarketStats25 {
  const probUnder = 1 / refs.under
  const probOver = 1 / refs.over
  const juice = (probUnder + probOver - 1) * 100
  const fairProbUnder = probUnder / (probUnder + probOver)
  const lambda = encontrarLambdaIterativo(fairProbUnder)

  return { juice, lambda, fairProbUnder }
}

/**
 * Calcula probabilidade Under fair para qualquer linha asiática.
 */
function calcularFairProbUnder(lambda: number, line: number): number {
  const kLimit = Math.floor(line)
  const fracao = line - kLimit

  if (fracao === 0.5) {
    // Linha .5 — ex: 2.5 = P(X ≤ 2)
    return poissonCdf(lambda, kLimit)

  } else if (fracao === 0) {
    // Linha inteira — metade push no valor exato
    let prob = 0
    for (let k = 0; k < line; k++) prob += poissonPmf(lambda, k)
    prob += poissonPmf(lambda, line) / 2
    return prob

  } else if (fracao === 0.25) {
    // .25 = média de inteira + .5
    const li = Math.floor(line)
    let probInt = 0
    for (let k = 0; k < li; k++) probInt += poissonPmf(lambda, k)
    probInt += poissonPmf(lambda, li) / 2
    const probHalf = poissonCdf(lambda, li)
    return (probInt + probHalf) / 2

  } else {
    // .75 = média de .5 + inteira seguinte
    const kL = Math.floor(line)
    const kU = kL + 1
    const probHalf = poissonCdf(lambda, kL)
    let probInt = 0
    for (let k = 0; k < kU; k++) probInt += poissonPmf(lambda, k)
    probInt += poissonPmf(lambda, kU) / 2
    return (probHalf + probInt) / 2
  }
}

/**
 * Encontra a linha de equilíbrio — menor diferença de 50/50.
 */
function encontrarLinhaBase(lambda: number, linhas: number[]): number {
  let melhorLinha = 2.5
  let menorDiff = Infinity

  for (const line of linhas) {
    const prob = calcularFairProbUnder(lambda, line)
    const diff = Math.abs(prob - 0.5)
    if (diff < menorDiff) {
      menorDiff = diff
      melhorLinha = line
    }
  }

  return melhorLinha
}

/**
 * Gera tabela de 10 linhas projetadas.
 * Juice mínima na base (equilíbrio), crescendo +0.25% por degrau.
 */
export function calcularLinhas25(
  lambda: number,
  juiceBase: number
): LinhaCalculada25[] {
  const linhas = [1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50, 3.75]
  const linhaBase = encontrarLinhaBase(lambda, linhas)

  // Juice mínima na base: desconta steps entre 2.5 e a base
  const stepsRef = Math.round(Math.abs(linhaBase - 2.5) / 0.25)
  const juiceMinima = Math.max(0.5, juiceBase - stepsRef * 0.25)

  return linhas.map((line) => {
    let fairProbUnder = calcularFairProbUnder(lambda, line)
    fairProbUnder = Math.min(0.99, Math.max(0.01, fairProbUnder))
    const fairProbOver = 1 - fairProbUnder

    // Juice cresce +0.25% por cada step de 0.25 a partir da base
    const steps = Math.round(Math.abs(line - linhaBase) / 0.25)
    const juiceDinamica = juiceMinima + steps * 0.25
    const totalJuice = juiceDinamica / 100

    // Odds com overround proporcional
    const overround = 1 + totalJuice
    const oddUnder = Math.max(1.01, 1 / (fairProbUnder * overround))
    const oddOver = Math.max(1.01, 1 / (fairProbOver * overround))

    const dist = Math.abs(line - linhaBase)
    const afastamento = line === linhaBase
      ? 'BASE'
      : `+${dist.toFixed(2)}`

    return {
      line: line.toFixed(2),
      under: oddUnder.toFixed(2),
      over: oddOver.toFixed(2),
      probUnder: (fairProbUnder * 100).toFixed(1),
      probOver: (fairProbOver * 100).toFixed(1),
      juice: juiceDinamica.toFixed(2),
      afastamento,
      isBase: line === linhaBase,
    }
  })
}
