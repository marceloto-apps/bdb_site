// tests/ferramentas/backtest/aggregation.test.ts
import { describe, it, expect } from "vitest";
import { calcularKPIs } from "@/lib/ferramentas/backtest/kpis";

describe("KPI Aggregation — Múltiplos Cenários de Liquidação", () => {
  it("deve calcular o ROI e hitRate corretos para um cenário misto (1 win, 1 half-loss, 1 refund)", () => {
    const bets = [
      { outcome: "WIN" as const, pnl: 100, stake: 100 },       // Exposta: 100, PnL: +100
      { outcome: "HALF_LOSS" as const, pnl: -50, stake: 100 }, // Exposta: 50, PnL: -50
      { outcome: "REFUND" as const, pnl: 0, stake: 100 },      // Exposta: 0, PnL: 0
    ];

    const kpis = calcularKPIs(bets);

    // Lucro líquido = +50
    expect(kpis.totalPnL).toBe(50.0);
    
    // Stake exposto = 100 (WIN) + 50 (HALF_LOSS) = 150
    expect(kpis.totalStakeExposed).toBe(150.0);
    
    // ROI = 50 / 150 = 33.33% (0.3333)
    expect(kpis.roi).toBe(0.3333);
    
    // Total apostas não anuladas = 2. Acertos = 1 (WIN). Hit Rate = 1 / 2 = 50% (0.50)
    expect(kpis.hitRate).toBe(0.5);
    expect(kpis.winCount).toBe(1);
    expect(kpis.halfLossCount).toBe(1);
    expect(kpis.refundCount).toBe(1);
  });

  it("deve calcular o ROI e hitRate corretos contendo half-wins", () => {
    const bets = [
      { outcome: "WIN" as const, pnl: 100, stake: 100 },       // Exposta: 100, PnL: +100
      { outcome: "HALF_WIN" as const, pnl: 50, stake: 100 },   // Exposta: 100, PnL: +50
      { outcome: "LOSS" as const, pnl: -100, stake: 100 },     // Exposta: 100, PnL: -100
    ];

    const kpis = calcularKPIs(bets);

    // Lucro líquido = 50
    expect(kpis.totalPnL).toBe(50.0);
    
    // Stake exposto = 300
    expect(kpis.totalStakeExposed).toBe(300.0);
    
    // ROI = 50 / 300 = 16.67% (0.1667)
    expect(kpis.roi).toBe(0.1667);
    
    // Non-refunded = 3. Acertos = 1 (WIN) + 0.5 (HALF_WIN) = 1.5. Hit Rate = 1.5 / 3 = 50% (0.50)
    expect(kpis.hitRate).toBe(0.5);
  });
});
