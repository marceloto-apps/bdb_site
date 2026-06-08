import { describe, it, expect } from "vitest";
import { avaliarPalpite } from "../../lib/bolao/avaliarPalpite";

describe("avaliarPalpite", () => {
  // Regra 1: Placar Exato (4 pts) + Over/Under Correto (+1 pt) = 5 pts
  it("deve dar 5 pontos para placar exato e over/under correto (OVER)", () => {
    const palpite = { golsMandante: 3, golsVisitante: 1, palpiteOverUnder: "OVER" as const };
    const real = { home: 3, away: 1 }; // soma = 4 gols (OVER)
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(5);
    expect(res.acertouPlacar).toBe(true);
    expect(res.acertouResultado).toBe(true);
    expect(res.acertouOverUnder).toBe(true);
  });

  it("deve dar 5 pontos para placar exato e over/under correto (UNDER)", () => {
    const palpite = { golsMandante: 1, golsVisitante: 0, palpiteOverUnder: "UNDER" as const };
    const real = { home: 1, away: 0 }; // soma = 1 gol (UNDER)
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(5);
    expect(res.acertouPlacar).toBe(true);
    expect(res.acertouResultado).toBe(true);
    expect(res.acertouOverUnder).toBe(true);
  });

  // Regra 2: Placar Exato (4 pts) + Over/Under Incorreto (0 pt) = 4 pts
  it("deve dar 4 pontos para placar exato e over/under incorreto", () => {
    const palpite = { golsMandante: 2, golsVisitante: 1, palpiteOverUnder: "UNDER" as const };
    const real = { home: 2, away: 1 }; // real é 3 gols (OVER), mas palpite diz UNDER
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(4);
    expect(res.acertouPlacar).toBe(true);
    expect(res.acertouResultado).toBe(true);
    expect(res.acertouOverUnder).toBe(false);
  });

  // Regra 3: Só resultado correto (2 pts) + Over/Under Correto (+1 pt) = 3 pts
  it("deve dar 3 pontos para resultado correto (HOME) e over/under correto", () => {
    const palpite = { golsMandante: 2, golsVisitante: 0, palpiteOverUnder: "UNDER" as const };
    const real = { home: 1, away: 0 }; // real é HOME e UNDER
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(3);
    expect(res.acertouPlacar).toBe(false);
    expect(res.acertouResultado).toBe(true);
    expect(res.acertouOverUnder).toBe(true);
  });

  // Regra 4: Só resultado correto (2 pts) + Over/Under Incorreto (0 pt) = 2 pts
  it("deve dar 2 pontos para resultado correto e over/under incorreto", () => {
    const palpite = { golsMandante: 3, golsVisitante: 0, palpiteOverUnder: "UNDER" as const };
    const real = { home: 2, away: 1 }; // real é HOME e OVER
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(2);
    expect(res.acertouPlacar).toBe(false);
    expect(res.acertouResultado).toBe(true);
    expect(res.acertouOverUnder).toBe(false);
  });

  // Regra 5: Resultado incorreto (0 pt) + Over/Under Correto (+1 pt) = 1 pt
  it("deve dar 1 ponto para resultado incorreto mas over/under correto", () => {
    const palpite = { golsMandante: 1, golsVisitante: 2, palpiteOverUnder: "OVER" as const };
    const real = { home: 2, away: 1 }; // real é HOME, mas palpite é AWAY (0 pt). Ambos são OVER (+1 pt)
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(1);
    expect(res.acertouPlacar).toBe(false);
    expect(res.acertouResultado).toBe(false);
    expect(res.acertouOverUnder).toBe(true);
  });

  // Regra 6: Tudo incorreto = 0 pts
  it("deve dar 0 pontos para erro total", () => {
    const palpite = { golsMandante: 0, golsVisitante: 2, palpiteOverUnder: "UNDER" as const };
    const real = { home: 3, away: 0 }; // real é HOME/OVER, palpite é AWAY/UNDER
    const res = avaliarPalpite(palpite, real);
    expect(res.pontos).toBe(0);
    expect(res.acertouPlacar).toBe(false);
    expect(res.acertouResultado).toBe(false);
    expect(res.acertouOverUnder).toBe(false);
  });
});
