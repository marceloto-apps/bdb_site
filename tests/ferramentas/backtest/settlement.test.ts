// tests/ferramentas/backtest/settlement.test.ts
import { describe, it, expect } from "vitest";
import { liquidarAposta } from "@/lib/ferramentas/backtest/settlement";

describe("Settlement Engine — 1X2", () => {
  it("deve liquidar vitória do Mandante no mercado 1X2 como HOME", () => {
    const res = liquidarAposta({
      market: "1X2",
      betSide: "HOME",
      stake: 1,
      odd: 2.0,
      fthg: 2,
      ftag: 1,
    });
    expect(res.outcome).toBe("WIN");
    expect(res.pnl).toBe(1.0);
  });

  it("deve liquidar derrota do Mandante no mercado 1X2 como HOME", () => {
    const res = liquidarAposta({
      market: "1X2",
      betSide: "HOME",
      stake: 1,
      odd: 2.0,
      fthg: 1,
      ftag: 1,
    });
    expect(res.outcome).toBe("LOSS");
    expect(res.pnl).toBe(-1.0);
  });

  it("deve liquidar vitória do Empate no mercado 1X2 como DRAW", () => {
    const res = liquidarAposta({
      market: "1X2",
      betSide: "DRAW",
      stake: 1,
      odd: 3.5,
      fthg: 1,
      ftag: 1,
    });
    expect(res.outcome).toBe("WIN");
    expect(res.pnl).toBe(2.5);
  });

  it("deve liquidar derrota do Empate no mercado 1X2 como DRAW", () => {
    const res = liquidarAposta({
      market: "1X2",
      betSide: "DRAW",
      stake: 1,
      odd: 3.5,
      fthg: 2,
      ftag: 1,
    });
    expect(res.outcome).toBe("LOSS");
    expect(res.pnl).toBe(-1.0);
  });

  it("deve liquidar vitória do Visitante no mercado 1X2 como AWAY", () => {
    const res = liquidarAposta({
      market: "1X2",
      betSide: "AWAY",
      stake: 1.5,
      odd: 3.0,
      fthg: 0,
      ftag: 2,
    });
    expect(res.outcome).toBe("WIN");
    expect(res.pnl).toBe(3.0);
  });
});

describe("Settlement Engine — BTTS (Both Teams To Score)", () => {
  it("deve liquidar BTTS YES (2x1) como WIN", () => {
    const res = liquidarAposta({
      market: "BTTS",
      betSide: "YES",
      stake: 1,
      odd: 2.0,
      fthg: 2,
      ftag: 1,
    });
    expect(res.outcome).toBe("WIN");
    expect(res.pnl).toBe(1.0);
  });

  it("deve liquidar BTTS YES (1x0) como LOSS", () => {
    const res = liquidarAposta({
      market: "BTTS",
      betSide: "YES",
      stake: 1,
      odd: 2.0,
      fthg: 1,
      ftag: 0,
    });
    expect(res.outcome).toBe("LOSS");
    expect(res.pnl).toBe(-1.0);
  });

  it("deve liquidar BTTS NO (1x0) como WIN", () => {
    const res = liquidarAposta({
      market: "BTTS",
      betSide: "NO",
      stake: 1,
      odd: 1.8,
      fthg: 1,
      ftag: 0,
    });
    expect(res.outcome).toBe("WIN");
    expect(res.pnl).toBe(0.8);
  });

  it("deve liquidar BTTS NO (1x1) como LOSS", () => {
    const res = liquidarAposta({
      market: "BTTS",
      betSide: "NO",
      stake: 1,
      odd: 1.8,
      fthg: 1,
      ftag: 1,
    });
    expect(res.outcome).toBe("LOSS");
    expect(res.pnl).toBe(-1.0);
  });
});

describe("Settlement Engine — Over/Under", () => {
  // --- Linhas Inteiras ---
  it("deve liquidar Over 2.0 (total de gols = 3) como WIN", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "OVER",
      line: 2.0,
      stake: 1,
      odd: 1.9,
      fthg: 2,
      ftag: 1,
    });
    expect(res.outcome).toBe("WIN");
    expect(res.pnl).toBe(0.9);
  });

  it("deve liquidar Over 2.0 (total de gols = 2) como REFUND", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "OVER",
      line: 2.0,
      stake: 1,
      odd: 1.9,
      fthg: 2,
      ftag: 0,
    });
    expect(res.outcome).toBe("REFUND");
    expect(res.pnl).toBe(0);
  });

  it("deve liquidar Over 2.0 (total de gols = 1) como LOSS", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "OVER",
      line: 2.0,
      stake: 1,
      odd: 1.9,
      fthg: 1,
      ftag: 0,
    });
    expect(res.outcome).toBe("LOSS");
    expect(res.pnl).toBe(-1);
  });

  // --- Linhas Meias ---
  it("deve liquidar Over 2.5 (total de gols = 3) como WIN", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "OVER",
      line: 2.5,
      stake: 1,
      odd: 2.1,
      fthg: 3,
      ftag: 0,
    });
    expect(res.outcome).toBe("WIN");
    expect(res.pnl).toBe(1.1);
  });

  it("deve liquidar Over 2.5 (total de gols = 2) como LOSS", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "OVER",
      line: 2.5,
      stake: 1,
      odd: 2.1,
      fthg: 1,
      ftag: 1,
    });
    expect(res.outcome).toBe("LOSS");
    expect(res.pnl).toBe(-1);
  });

  // --- Linhas Quartos (Over) ---
  it("deve liquidar Over 2.25 (total = 3) como WIN", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "OVER",
      line: 2.25,
      stake: 1,
      odd: 2.0,
      fthg: 2,
      ftag: 1,
    });
    expect(res.outcome).toBe("WIN");
    expect(res.pnl).toBe(1.0);
  });

  it("deve liquidar Over 2.25 (total = 2) como HALF_LOSS", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "OVER",
      line: 2.25,
      stake: 1,
      odd: 2.0,
      fthg: 2,
      ftag: 0,
    });
    expect(res.outcome).toBe("HALF_LOSS");
    expect(res.pnl).toBe(-0.5);
  });

  it("deve liquidar Over 2.75 (total = 3) como HALF_WIN", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "OVER",
      line: 2.75,
      stake: 1,
      odd: 2.0,
      fthg: 2,
      ftag: 1,
    });
    expect(res.outcome).toBe("HALF_WIN");
    expect(res.pnl).toBe(0.5);
  });

  // --- Linhas Quartos (Under) ---
  it("deve liquidar Under 2.25 (total = 2) como HALF_WIN", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "UNDER",
      line: 2.25,
      stake: 1,
      odd: 2.0,
      fthg: 1,
      ftag: 1,
    });
    expect(res.outcome).toBe("HALF_WIN");
    expect(res.pnl).toBe(0.5);
  });

  it("deve liquidar Under 2.25 (total = 3) como LOSS", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "UNDER",
      line: 2.25,
      stake: 1,
      odd: 2.0,
      fthg: 2,
      ftag: 1,
    });
    expect(res.outcome).toBe("LOSS");
    expect(res.pnl).toBe(-1);
  });

  it("deve liquidar Under 2.75 (total = 3) como HALF_LOSS", () => {
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "UNDER",
      line: 2.75,
      stake: 1,
      odd: 2.0,
      fthg: 3,
      ftag: 0,
    });
    expect(res.outcome).toBe("HALF_LOSS");
    expect(res.pnl).toBe(-0.5);
  });
});

describe("Settlement Engine — Asian Handicap", () => {
  it("deve liquidar AH -0.5 Mandante (2x1) como WIN", () => {
    const res = liquidarAposta({
      market: "ASIAN_HANDICAP",
      betSide: "HOME",
      line: -0.5,
      stake: 1,
      odd: 1.9,
      fthg: 2,
      ftag: 1,
    });
    expect(res.outcome).toBe("WIN");
    expect(res.pnl).toBe(0.9);
  });

  it("deve liquidar AH -0.5 Mandante (1x1) como LOSS", () => {
    const res = liquidarAposta({
      market: "ASIAN_HANDICAP",
      betSide: "HOME",
      line: -0.5,
      stake: 1,
      odd: 1.9,
      fthg: 1,
      ftag: 1,
    });
    expect(res.outcome).toBe("LOSS");
    expect(res.pnl).toBe(-1.0);
  });

  it("deve liquidar AH -0.25 Mandante (0x0) como HALF_LOSS", () => {
    const res = liquidarAposta({
      market: "ASIAN_HANDICAP",
      betSide: "HOME",
      line: -0.25,
      stake: 1,
      odd: 1.9,
      fthg: 0,
      ftag: 0,
    });
    expect(res.outcome).toBe("HALF_LOSS");
    expect(res.pnl).toBe(-0.5);
  });

  it("deve liquidar AH +0.25 Mandante (1x1) como HALF_WIN", () => {
    const res = liquidarAposta({
      market: "ASIAN_HANDICAP",
      betSide: "HOME",
      line: 0.25,
      stake: 1,
      odd: 1.9,
      fthg: 1,
      ftag: 1,
    });
    expect(res.outcome).toBe("HALF_WIN");
    expect(res.pnl).toBe(0.45);
  });

  it("deve liquidar AH +0.25 Visitante (1x1) como HALF_WIN (com line de mandante +0.25)", () => {
    // Para o visitante, o handicap dele é oposto ao do mandante, então o handicap é -0.25
    // diffEfetiva = (ftag - fthg) - line = (1 - 1) - 0.25 = -0.25 -> HALF_LOSS
    const res = liquidarAposta({
      market: "ASIAN_HANDICAP",
      betSide: "AWAY",
      line: 0.25, // Linha de handicap do mandante é +0.25, logo do visitante é -0.25
      stake: 1,
      odd: 1.9,
      fthg: 1,
      ftag: 1,
    });
    expect(res.outcome).toBe("HALF_LOSS");
    expect(res.pnl).toBe(-0.5);
  });

  it("deve liquidar AH -1.0 Mandante (2x0) como WIN", () => {
    const res = liquidarAposta({
      market: "ASIAN_HANDICAP",
      betSide: "HOME",
      line: -1.0,
      stake: 1,
      odd: 2.2,
      fthg: 2,
      ftag: 0,
    });
    expect(res.outcome).toBe("WIN");
    expect(res.pnl).toBe(1.2);
  });

  it("deve liquidar AH -1.0 Mandante (2x1) como REFUND", () => {
    const res = liquidarAposta({
      market: "ASIAN_HANDICAP",
      betSide: "HOME",
      line: -1.0,
      stake: 1,
      odd: 2.2,
      fthg: 2,
      ftag: 1,
    });
    expect(res.outcome).toBe("REFUND");
    expect(res.pnl).toBe(0);
  });
});

describe("Settlement Engine — Imunidade contra resíduos de Ponto Flutuante (x4)", () => {
  it("deve liquidar corretamente mesmo com linhas que possuem resíduo de ponto flutuante em JS", () => {
    // 0.3 - 0.05 resulta em 0.25000000000000006 em JavaScript devido à precisão IEEE 754
    const linhaComResiduo = 0.3 - 0.05; 
    
    const res = liquidarAposta({
      market: "ASIAN_HANDICAP",
      betSide: "HOME",
      line: linhaComResiduo, // +0.25 com resíduo de float
      stake: 1,
      odd: 2.0,
      fthg: 1,
      ftag: 1, // goalDiff = 0 (empate) -> diffEfetiva deve ser exatamente 0.25 (HALF_WIN)
    });
    
    expect(res.outcome).toBe("HALF_WIN");
    expect(res.pnl).toBe(0.5);
  });

  it("deve liquidar Over/Under corretamente com resíduo na linha", () => {
    // 2.3 - 0.05 resulta em 2.2500000000000002 em JS
    const linhaComResiduo = 2.3 - 0.05; 
    
    const res = liquidarAposta({
      market: "OVER_UNDER",
      betSide: "OVER",
      line: linhaComResiduo, // 2.25 com resíduo
      stake: 1,
      odd: 2.0,
      fthg: 2,
      ftag: 0, // total goals = 2 -> deve ser HALF_LOSS (pois total < 2.25, mas total === 2.0 que é l1)
    });
    
    expect(res.outcome).toBe("HALF_LOSS");
    expect(res.pnl).toBe(-0.5);
  });
});

