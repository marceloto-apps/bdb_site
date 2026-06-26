// tests/ferramentas/backtest/projections.test.ts
import { describe, it, expect } from "vitest";
import { calcularProjecaoJogo, normalizarMatriz } from "@/lib/ferramentas/backtest/projections";

describe("Projection Engine — Normalização de Matriz", () => {
  it("deve normalizar uma matriz cuja soma difere de 1.0", () => {
    const matriz = [
      [0.2, 0.2],
      [0.2, 0.2],
    ]; // Soma = 0.8
    const normalizada = normalizarMatriz(matriz);
    let soma = 0;
    for (let h = 0; h < normalizada.length; h++) {
      for (let a = 0; a < normalizada[h].length; a++) {
        soma += normalizada[h][a];
      }
    }
    expect(soma).toBeCloseTo(1.0, 5);
    expect(normalizada[0][0]).toBeCloseTo(0.25, 5);
  });
});

describe("Projection Engine — Cálculos dos Modelos", () => {
  const defaultParams = {
    homeStats: {
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.0,
      xg: 1.6,
    },
    awayStats: {
      avgGoalsScored: 1.2,
      avgGoalsConceded: 1.4,
      xg: 1.1,
    },
    leagueParams: {
      muH: 1.4,
      muA: 1.1,
      varH: 1.6,
      varA: 1.3,
      piH: 0.05,
      piA: 0.04,
      rho: -0.08,
      muH_xg: 1.45,
      muA_xg: 1.15,
    },
  };

  it("deve calcular projeção usando POISSON e MEDIA_SIMPLES", () => {
    const res = calcularProjecaoJogo({
      ...defaultParams,
      model: "POISSON",
      lambdaMethod: "MEDIA_SIMPLES",
    });

    expect(res.lambdaH).toBe(1.45); // (1.5 + 1.4) / 2
    expect(res.lambdaA).toBe(1.1);  // (1.2 + 1.0) / 2
    expect(res.probHome).toBeGreaterThan(0);
    expect(res.probDraw).toBeGreaterThan(0);
    expect(res.probAway).toBeGreaterThan(0);
    expect(res.probOver25 + res.probUnder25).toBeCloseTo(1.0, 3);
  });

  it("deve calcular projeção usando POISSON e FORCAS_RELATIVAS", () => {
    const res = calcularProjecaoJogo({
      ...defaultParams,
      model: "POISSON",
      lambdaMethod: "FORCAS_RELATIVAS",
    });

    // fcAtCHome = 1.5 / 1.4, fcDfVAway = 1.4 / 1.4
    // lambdaH = (1.5/1.4) * (1.4/1.4) * 1.4 = 1.5
    expect(res.lambdaH).toBeCloseTo(1.5, 2);
    // fcAtVAway = 1.2 / 1.1, fcDfCHome = 1.0 / 1.1
    // lambdaA = (1.2/1.1) * (1.0/1.1) * 1.1 = 1.09
    expect(res.lambdaA).toBeCloseTo(1.09, 2);
  });

  it("deve calcular projeção usando POISSON e XG", () => {
    const res = calcularProjecaoJogo({
      ...defaultParams,
      model: "POISSON",
      lambdaMethod: "XG",
    });

    // fcAtCHome = 1.6 / 1.45, fcDfVAway = 1.1 / 1.45
    // lambdaH = (1.6/1.45) * (1.1/1.45) * 1.45 = 1.21
    expect(res.lambdaH).toBeCloseTo(1.2138, 2);
  });

  it("deve calcular projeção usando ZIP", () => {
    const res = calcularProjecaoJogo({
      ...defaultParams,
      model: "ZIP",
      lambdaMethod: "MEDIA_SIMPLES",
    });

    expect(res.probHome).toBeGreaterThan(0);
    expect(res.probDraw).toBeGreaterThan(0);
    expect(res.probAway).toBeGreaterThan(0);
  });

  it("deve calcular projeção usando NB (Negative Binomial)", () => {
    const res = calcularProjecaoJogo({
      ...defaultParams,
      model: "NB",
      lambdaMethod: "MEDIA_SIMPLES",
    });

    expect(res.probHome).toBeGreaterThan(0);
    expect(res.probDraw).toBeGreaterThan(0);
    expect(res.probAway).toBeGreaterThan(0);
  });

  it("deve calcular projeção usando DIXON_COLES", () => {
    const res = calcularProjecaoJogo({
      ...defaultParams,
      model: "DIXON_COLES",
      lambdaMethod: "MEDIA_SIMPLES",
    });

    expect(res.probHome).toBeGreaterThan(0);
    expect(res.probDraw).toBeGreaterThan(0);
    expect(res.probAway).toBeGreaterThan(0);
  });
});
