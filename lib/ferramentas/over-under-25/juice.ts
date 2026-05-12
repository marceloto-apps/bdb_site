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
 * Calcula as linhas de Over/Under 2.5 espelhando o modelo Gemini.
 * Permite juice negativo (overround < 1.0) e usa incremento absoluto
 * de +0.25% por degrau a partir da linha base.
 * Quando uma odd é travada em 1.01 (piso operacional), o juice efetivo
 * é recalculado a partir das odds finais — espelhando o comportamento Gemini.
 */
export function calcularLinhas25(
  lambda: number,
  juiceBase: number
): LinhaCalculada25[] {
  const linhas = [1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 3.25, 3.50, 3.75];
  const linhaBase = encontrarLinhaBase(lambda, linhas);

  // Juice mínimo na linha base — pode ser negativo (espelho Gemini)
  const stepsRef = Math.round(Math.abs(linhaBase - 2.5) / 0.25);
  const juiceMinima = juiceBase - stepsRef * 0.25;

  return linhas.map((line) => {
    let fairProbUnder = calcularFairProbUnder(lambda, line);
    
    // Ajuste empírico de variância para simular overdispersion nas linhas extremas
    // Desloca -0.9% de probabilidade para cada 1 gol de distância da linha 2.50
    const distFrom25 = line - 2.50;
    const adjustment = -0.009 * distFrom25;
    fairProbUnder += adjustment;
    
    fairProbUnder = Math.min(0.999, Math.max(0.001, fairProbUnder));
    const fairProbOver = 1 - fairProbUnder;

    // Juice teórico cresce +0.25% por degrau a partir da base
    const steps = Math.round(Math.abs(line - linhaBase) / 0.25);
    const juiceTeorico = juiceMinima + steps * 0.25;
    const overround = 1 + juiceTeorico / 100;

    // Odds preliminares (método proporcional)
    let oddUnder = 1 / (fairProbUnder * overround);
    let oddOver = 1 / (fairProbOver * overround);

    // Clamp no piso operacional de 1.01
    const clampUnder = oddUnder < 1.01;
    const clampOver = oddOver < 1.01;
    if (clampUnder) oddUnder = 1.01;
    if (clampOver) oddOver = 1.01;

    // Se houve clamp, recalcular juice efetivo a partir das odds finais
    const juiceEfetivo = (clampUnder || clampOver)
      ? (1 / oddUnder + 1 / oddOver - 1) * 100
      : juiceTeorico;

    const dist = Math.abs(line - linhaBase);
    const afastamento = line === linhaBase ? 'BASE' : `+${dist.toFixed(2)}`;

    return {
      line: line.toFixed(2),
      under: oddUnder.toFixed(2),
      over: oddOver.toFixed(2),
      probUnder: (fairProbUnder * 100).toFixed(1),
      probOver: (fairProbOver * 100).toFixed(1),
      juice: juiceEfetivo.toFixed(2),
      afastamento,
      isBase: line === linhaBase,
    };
  });
}
