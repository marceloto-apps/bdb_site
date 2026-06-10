import { describe, it, expect } from "vitest";
import { avaliarPalpite } from "../../lib/bolao/avaliarPalpite";

describe("avaliarPalpite", () => {
  // Regra 1: Placar Exato (4 pts), Over/Under desativado (sempre false / 0 pt)
  it("deve dar 4 pontos para placar exato", () => {
    const palpite = { golsMandante: 3, golsVisitante: 1, palpiteOverUnder: "OVER" as const };
    const real = { home: 3, away: 1 };
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(4);
    expect(res.acertouPlacar).toBe(true);
    expect(res.acertouResultado).toBe(true);
    expect(res.acertouOverUnder).toBe(false);
  });

  it("deve dar 4 pontos para placar exato mesmo com palpite/real diferentes de over/under", () => {
    const palpite = { golsMandante: 1, golsVisitante: 0, palpiteOverUnder: "UNDER" as const };
    const real = { home: 1, away: 0 };
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(4);
    expect(res.acertouPlacar).toBe(true);
    expect(res.acertouResultado).toBe(true);
    expect(res.acertouOverUnder).toBe(false);
  });

  // Regra 2: Apenas resultado correto (2 pts), Over/Under desativado (sempre false / 0 pt)
  it("deve dar 2 pontos para resultado correto (HOME) e over/under desativado", () => {
    const palpite = { golsMandante: 2, golsVisitante: 0, palpiteOverUnder: "UNDER" as const };
    const real = { home: 1, away: 0 };
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(2);
    expect(res.acertouPlacar).toBe(false);
    expect(res.acertouResultado).toBe(true);
    expect(res.acertouOverUnder).toBe(false);
  });

  it("deve dar 2 pontos para resultado correto e over/under desativado (outro caso)", () => {
    const palpite = { golsMandante: 3, golsVisitante: 0, palpiteOverUnder: "UNDER" as const };
    const real = { home: 2, away: 1 };
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(2);
    expect(res.acertouPlacar).toBe(false);
    expect(res.acertouResultado).toBe(true);
    expect(res.acertouOverUnder).toBe(false);
  });

  // Regra 3: Resultado incorreto e placar incorreto (0 pt)
  it("deve dar 0 pontos para resultado incorreto", () => {
    const palpite = { golsMandante: 1, golsVisitante: 2, palpiteOverUnder: "OVER" as const };
    const real = { home: 2, away: 1 };
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(0);
    expect(res.acertouPlacar).toBe(false);
    expect(res.acertouResultado).toBe(false);
    expect(res.acertouOverUnder).toBe(false);
  });

  it("deve dar 0 pontos para erro total", () => {
    const palpite = { golsMandante: 0, golsVisitante: 2, palpiteOverUnder: "UNDER" as const };
    const real = { home: 3, away: 0 };
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(0);
    expect(res.acertouPlacar).toBe(false);
    expect(res.acertouResultado).toBe(false);
    expect(res.acertouOverUnder).toBe(false);
  });
});
