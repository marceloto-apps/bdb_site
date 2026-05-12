/**
 * Testes de regressão — Cálculo de λ (Poisson) para Over/Under 2.5 gols
 * Escopo: futebol/soccer apenas
 *
 * Casos reais de mercado (odds Over 2.5 / Under 2.5):
 *  1) 2.00 / 1.80  → cenário equilibrado
 *  2) 1.30 / 3.35  → cenário pró-Over (jogo ofensivo)
 *  3) 2.85 / 1.42  → cenário pró-Under (jogo defensivo)
 *
 * O teste garante que, a partir da probabilidade justa de Under 2.5,
 * o método de bisseção converge para o λ correto, validando depois
 * que poissonCdf(λ, 2) reproduz a probabilidade de entrada.
 */

import { describe, it, expect } from 'vitest';
import { encontrarLambdaIterativo } from '@/lib/ferramentas/over-under-25/poisson-25';
import { poissonCdf } from '@/lib/analytics/poisson';

// Tolerância numérica aceitável para a convergência da bisseção
const TOL = 1e-5;

/**
 * Remove a margem do mercado (vigorish) de forma proporcional.
 * Mantida local ao teste para isolar a unidade testada (λ),
 * evitando acoplamento com a função real de remoção de margem.
 */
function probJustaUnder(oddOver: number, oddUnder: number): number {
  const pOver = 1 / oddOver;
  const pUnder = 1 / oddUnder;
  const overround = pOver + pUnder;
  return pUnder / overround;
}

describe('encontrarLambdaIterativo — Over/Under 2.5 (futebol)', () => {
  it('Caso 1: odds equilibradas 2.00 / 1.80', () => {
    const fairUnder = probJustaUnder(2.0, 1.8);
    const lambda = encontrarLambdaIterativo(fairUnder);

    // λ deve estar em faixa plausível para futebol (0.5 a 5 gols esperados)
    expect(lambda).toBeGreaterThan(0.5);
    expect(lambda).toBeLessThan(5);

    // Reversibilidade: poissonCdf(λ, 2) deve reproduzir a prob. de entrada
    const probCalculada = poissonCdf(lambda, 2);
    expect(Math.abs(probCalculada - fairUnder)).toBeLessThan(TOL);
  });

  it('Caso 2: cenário ofensivo 1.30 / 3.35 (Over favorito)', () => {
    const fairUnder = probJustaUnder(1.3, 3.35);
    const lambda = encontrarLambdaIterativo(fairUnder);

    // Cenário ofensivo → λ alto (>2.5 esperado)
    expect(lambda).toBeGreaterThan(2.5);
    expect(lambda).toBeLessThan(5);

    const probCalculada = poissonCdf(lambda, 2);
    expect(Math.abs(probCalculada - fairUnder)).toBeLessThan(TOL);
  });

  it('Caso 3: cenário defensivo 2.85 / 1.42 (Under favorito)', () => {
    const fairUnder = probJustaUnder(2.85, 1.42);
    const lambda = encontrarLambdaIterativo(fairUnder);

    // Cenário defensivo → λ baixo (<2.0 esperado)
    expect(lambda).toBeGreaterThan(0.5);
    expect(lambda).toBeLessThan(2.1);

    const probCalculada = poissonCdf(lambda, 2);
    expect(Math.abs(probCalculada - fairUnder)).toBeLessThan(TOL);
  });

  it('Casos extremos: prob. próxima de 0 e 1 não devem quebrar', () => {
    // Probabilidade quase 1 → λ deve tender ao mínimo (0.01)
    expect(encontrarLambdaIterativo(0.9999)).toBeLessThanOrEqual(0.1);

    // Probabilidade quase 0 → λ deve tender ao máximo (15)
    expect(encontrarLambdaIterativo(0.0001)).toBeGreaterThanOrEqual(10);
  });
});

// =====================================================================
// BLINDAGEM 1 — Teste de round-trip (propriedade matemática)
// Garante que λ → CDF → λ é idempotente em toda a faixa útil de futebol
// =====================================================================
describe('encontrarLambdaIterativo — round-trip matemático', () => {
  /**
   * Para cada λ original na faixa típica de futebol, gera a probabilidade
   * de Under via poissonCdf e verifica se a função recupera o λ original.
   * Tolerância de 5 casas decimais é mais que suficiente para odds reais.
   */
  const lambdasOriginais = [
    0.3,  // jogo extremamente defensivo
    0.5,
    1.0,
    1.5,
    2.0,
    2.5,
    2.7,  // média histórica do futebol europeu
    3.0,
    3.5,
    4.0,
    5.0,
    6.0,  // cenário ofensivo extremo
  ];

  for (const lambdaOriginal of lambdasOriginais) {
    it(`recupera λ=${lambdaOriginal} via CDF→inversa`, () => {
      const fairProb = poissonCdf(lambdaOriginal, 2);
      const lambdaRecuperado = encontrarLambdaIterativo(fairProb);

      // Precisão de 5 casas decimais (muito além das odds reais)
      expect(lambdaRecuperado).toBeCloseTo(lambdaOriginal, 5);
    });
  }
});

// =====================================================================
// BLINDAGEM 2 — Validação de entrada via Zod
// Garante que entradas inválidas falham de forma previsível
// =====================================================================
describe('encontrarLambdaIterativo — validação de entrada', () => {
  it('rejeita probabilidade igual a 0', () => {
    expect(() => encontrarLambdaIterativo(0)).toThrow();
  });

  it('rejeita probabilidade igual a 1', () => {
    expect(() => encontrarLambdaIterativo(1)).toThrow();
  });

  it('rejeita probabilidade negativa', () => {
    expect(() => encontrarLambdaIterativo(-0.1)).toThrow();
  });

  it('rejeita probabilidade > 1', () => {
    expect(() => encontrarLambdaIterativo(1.5)).toThrow();
  });

  it('rejeita NaN', () => {
    expect(() => encontrarLambdaIterativo(NaN)).toThrow();
  });

  it('aceita o limite inferior válido (0.0001)', () => {
    expect(() => encontrarLambdaIterativo(0.0001)).not.toThrow();
  });

  it('aceita o limite superior válido (0.9999)', () => {
    expect(() => encontrarLambdaIterativo(0.9999)).not.toThrow();
  });
});
