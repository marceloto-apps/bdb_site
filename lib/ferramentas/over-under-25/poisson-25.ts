import { poissonCdf } from '@/lib/analytics/poisson'
import { z } from 'zod';

/**
 * Schema de validação para a probabilidade justa de Under 2.5.
 * Limites:
 *  - mínimo 0.0001: evita probabilidades degeneradas (λ explodiria)
 *  - máximo 0.9999: evita o caso patológico onde poissonCdf(0, 2) = 1 exato
 */
const fairProbSchema = z
  .number()
  .min(0.0001, 'Probabilidade muito baixa (mínimo 0.0001)')
  .max(0.9999, 'Probabilidade muito alta (máximo 0.9999)');

/**
 * P(Under 2.5) = P(X ≤ 2) usando CDF de Poisson.
 */
export function probUnder25(lambda: number): number {
  return poissonCdf(lambda, 2)
}

/**
 * Encontra o λ (média esperada de gols por partida) cuja Poisson CDF
 * em k=2 iguala a probabilidade justa de Under 2.5 fornecida.
 *
 * --- Modelo matemático ---
 * Para futebol, modelamos a quantidade de gols por partida como uma
 * distribuição de Poisson com parâmetro λ. A probabilidade de Under 2.5
 * é P(X ≤ 2) = poissonCdf(λ, 2). Dado o mercado (após remover margem),
 * resolvemos a equação inversa para obter o λ implícito.
 *
 * --- Método numérico ---
 * Bisecção sobre o intervalo [0.01, 15]. Como poissonCdf(λ, 2) é
 * estritamente decrescente em λ (mantendo k=2), o método converge
 * monotonicamente para a raiz única.
 *
 * --- Domínio ---
 *  - λ ∈ [0.01, 15]
 *    - 0.01: evita o caso degenerado λ=0 (CDF=1 exato, ambíguo)
 *    - 15:   cobre cenários extremos de futebol (médias altíssimas)
 *  - Tolerância: 1e-7 (precisão muito além da resolução de odds reais)
 *  - Máx. iterações: 60 (mais que suficiente; bisecção converge em ~30)
 *
 * --- Complexidade ---
 * O(log₂((15 - 0.01) / TOL)) ≈ 30 iterações típicas.
 *
 * @param fairProbUnder25 Probabilidade justa de Under 2.5 ∈ [0.0001, 0.9999]
 * @returns λ que satisfaz poissonCdf(λ, 2) ≈ fairProbUnder25
 * @throws {ZodError} se a probabilidade estiver fora do domínio válido
 */
export function encontrarLambdaIterativo(fairProbUnder25: number): number {
  // Valida domínio da entrada antes de iniciar a bisecção
  fairProbSchema.parse(fairProbUnder25);

  let lo = 0.01;
  let hi = 15;
  const TOL = 1e-7;
  const MAX_ITER = 60;

  for (let i = 0; i < MAX_ITER; i++) {
    const mid = (lo + hi) / 2;
    const prob = poissonCdf(mid, 2);

    if (Math.abs(prob - fairProbUnder25) < TOL) {
      return mid;
    }

    // poissonCdf decresce conforme λ aumenta:
    // se prob > alvo → λ atual é pequeno demais → sobe lo
    // se prob < alvo → λ atual é grande demais → desce hi
    if (prob > fairProbUnder25) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return (lo + hi) / 2;
}
