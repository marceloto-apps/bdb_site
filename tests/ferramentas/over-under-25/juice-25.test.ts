import { describe, it, expect } from 'vitest';
import { calcularLinhas25, extrairJuice25 } from '@/lib/ferramentas/over-under-25/juice';

describe('calcularLinhas25 — espelhamento Gemini', () => {
  describe('juice negativo permitido', () => {
    it('deve aceitar juiceMinima negativa quando linha base está distante de 2.5', () => {
      // lambda alto → linha base alta → stepsRef grande → juiceMinima negativa
      const linhas = calcularLinhas25(3.5, 0.5);
      const base = linhas.find((l) => l.isBase);
      expect(base).toBeDefined();
      expect(parseFloat(base!.juice)).toBeLessThan(0.5);
    });

    it('overround pode ser menor que 1.0 em linhas com juice negativo', () => {
      const linhas = calcularLinhas25(3.5, 0.5);
      const comJuiceNegativo = linhas.filter((l) => parseFloat(l.juice) < 0);
      expect(comJuiceNegativo.length).toBeGreaterThan(0);
    });
  });

  describe('incremento absoluto de +0.25% por degrau', () => {
    it('cada degrau de 0.25 na linha deve somar exatamente 0.25% ao juice', () => {
      const linhas = calcularLinhas25(2.5, 5.0);
      const baseIdx = linhas.findIndex((l) => l.isBase);
      
      for (let i = 0; i < linhas.length; i++) {
        const stepsEsperados = Math.abs(i - baseIdx);
        const juiceEsperado = parseFloat(linhas[baseIdx].juice) + stepsEsperados * 0.25;
        expect(parseFloat(linhas[i].juice)).toBeCloseTo(juiceEsperado, 2);
      }
    });
  });

  describe('integridade estrutural', () => {
    it('deve retornar exatamente 10 linhas', () => {
      expect(calcularLinhas25(2.5, 5.0)).toHaveLength(10);
    });

    it('exatamente uma linha deve ser marcada como BASE', () => {
      const linhas = calcularLinhas25(2.5, 5.0);
      expect(linhas.filter((l) => l.isBase)).toHaveLength(1);
    });

    it('odds nunca devem ser inferiores a 1.01', () => {
      const linhas = calcularLinhas25(2.5, 5.0);
      linhas.forEach((l) => {
        expect(parseFloat(l.under)).toBeGreaterThanOrEqual(1.01);
        expect(parseFloat(l.over)).toBeGreaterThanOrEqual(1.01);
      });
    });

    it('probUnder + probOver deve somar ~100%', () => {
      const linhas = calcularLinhas25(2.5, 5.0);
      linhas.forEach((l) => {
        const soma = parseFloat(l.probUnder) + parseFloat(l.probOver);
        expect(soma).toBeCloseTo(100, 1);
      });
    });
  });
});

describe('calcularLinhas25 — paridade Gemini (cenários validados)', () => {
  /**
   * Cenário 1 — Mercado equilibrado
   * Inputs: Under 2.5 = 1.75 / Over 2.5 = 2.05
   * Juice extraído: 5.92% | λ = 2.517
   * Base esperada: LINE 2.25 (juice 5.67%)
   */
  it('cenário 1: mercado equilibrado (1.75 / 2.05)', () => {
    const { juice, lambda } = extrairJuice25({ under: 1.75, over: 2.05 });
    expect(juice).toBeCloseTo(5.92, 1);
    expect(lambda).toBeCloseTo(2.517, 2);

    const linhas = calcularLinhas25(lambda, juice);
    const base = linhas.find((l) => l.isBase);
    expect(base?.line).toBe('2.25');
    expect(parseFloat(base!.juice)).toBeCloseTo(5.67, 1);

    // Validar odds da linha base
    expect(parseFloat(base!.under)).toBeCloseTo(1.98, 1);
    expect(parseFloat(base!.over)).toBeCloseTo(1.82, 1);

    // Validar linha 2.5 (juice teórico 5.92%)
    const line25 = linhas.find((l) => l.line === '2.50');
    expect(parseFloat(line25!.juice)).toBeCloseTo(5.92, 1);
  });

  /**
   * Cenário 2 — Under muito favorito (clamp ativa)
   * Inputs: Under 2.5 = 1.15 / Over 2.5 = 4.90
   * Juice extraído: 7.36% | λ = 1.496
   * Base esperada: LINE 1.50 (juice 6.36%)
   * Atenção: LINE 3.50 e 3.75 disparam clamp em 1.01 → juice efetivo cai
   */
  it('cenário 2: under favorito com clamp em 1.01 (1.15 / 4.90)', () => {
    const { juice, lambda } = extrairJuice25({ under: 1.15, over: 4.90 });
    expect(juice).toBeCloseTo(7.36, 1);
    expect(lambda).toBeCloseTo(1.496, 2);

    const linhas = calcularLinhas25(lambda, juice);
    const base = linhas.find((l) => l.isBase);
    expect(base?.line).toBe('1.50');
    expect(parseFloat(base!.juice)).toBeCloseTo(6.36, 1);

    // LINE 3.50 — clamp ativo, juice efetivo recalcula com nova prob
    const line350 = linhas.find((l) => l.line === '3.50');
    expect(parseFloat(line350!.under)).toBeCloseTo(1.01, 2);

    // LINE 3.75 — clamp ativo, juice efetivo recalcula com nova prob
    const line375 = linhas.find((l) => l.line === '3.75');
    expect(parseFloat(line375!.under)).toBeCloseTo(1.01, 2);
  });

  /**
   * Cenário 3 — Over muito favorito
   * Inputs: Under 2.5 = 3.70 / Over 2.5 = 1.25
   * Juice extraído: 7.03% | λ = 3.904
   * Base esperada: LINE 3.75 (juice 5.78%)
   */
  it('cenário 3: over favorito (3.70 / 1.25)', () => {
    const { juice, lambda } = extrairJuice25({ under: 3.70, over: 1.25 });
    expect(juice).toBeCloseTo(7.03, 1);
    expect(lambda).toBeCloseTo(3.904, 2);

    const linhas = calcularLinhas25(lambda, juice);
    const base = linhas.find((l) => l.isBase);
    expect(base?.line).toBe('3.75');
    expect(parseFloat(base!.juice)).toBeCloseTo(5.78, 1);

    // Validar odds da linha base
    expect(parseFloat(base!.under)).toBeCloseTo(1.93, 1);
    expect(parseFloat(base!.over)).toBeCloseTo(1.85, 1);

    // Validar linha 2.5
    const line25 = linhas.find((l) => l.line === '2.50');
    expect(parseFloat(line25!.juice)).toBeCloseTo(7.03, 1);
  });
});

describe('calcularLinhas25 — comportamento de clamp', () => {
  it('quando odd seria < 1.01, deve travar em 1.01 e recalcular juice efetivo', () => {
    // λ baixo + juice alto → garantia de clamp em linhas altas
    const linhas = calcularLinhas25(1.496, 7.36);
    const comClamp = linhas.filter(
      (l) => parseFloat(l.under) === 1.01 || parseFloat(l.over) === 1.01
    );
    expect(comClamp.length).toBeGreaterThan(0);

    // Para linhas com clamp, juice efetivo ≠ juice teórico
    comClamp.forEach((l) => {
      const juiceEfetivo = parseFloat(l.juice);
      const juiceRecalc = (1 / parseFloat(l.under) + 1 / parseFloat(l.over) - 1) * 100;
      expect(juiceEfetivo).toBeCloseTo(juiceRecalc, 1);
    });
  });
});
