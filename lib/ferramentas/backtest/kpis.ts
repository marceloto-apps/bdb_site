// lib/ferramentas/backtest/kpis.ts

export interface BetKPIInput {
  outcome: "WIN" | "HALF_WIN" | "REFUND" | "HALF_LOSS" | "LOSS";
  pnl: number;
  stake: number;
}

export function calcularKPIs(bets: BetKPIInput[]) {
  let totalPnL = 0;
  let totalStakeExposed = 0;
  const totalBets = bets.length;
  let winCount = 0;
  let halfWinCount = 0;
  let refundCount = 0;
  let halfLossCount = 0;
  let lossCount = 0;

  for (const bet of bets) {
    totalPnL += bet.pnl;

    if (bet.outcome === "WIN") {
      winCount++;
      totalStakeExposed += bet.stake;
    } else if (bet.outcome === "HALF_WIN") {
      halfWinCount++;
      totalStakeExposed += bet.stake;
    } else if (bet.outcome === "REFUND") {
      refundCount++;
      // Reembolso completo não expõe capital no resultado final
    } else if (bet.outcome === "HALF_LOSS") {
      halfLossCount++;
      totalStakeExposed += bet.stake / 2; // Apenas metade da stake foi exposta a risco de perda
    } else if (bet.outcome === "LOSS") {
      lossCount++;
      totalStakeExposed += bet.stake;
    }
  }

  const roi = totalStakeExposed > 0 ? totalPnL / totalStakeExposed : 0;
  const nonRefunded = totalBets - refundCount;
  const hitRate = nonRefunded > 0 ? (winCount + 0.5 * halfWinCount) / nonRefunded : 0;

  return {
    totalBets,
    winCount,
    halfWinCount,
    refundCount,
    halfLossCount,
    lossCount,
    totalPnL: Number(totalPnL.toFixed(4)),
    totalStakeExposed: Number(totalStakeExposed.toFixed(4)),
    roi: Number(roi.toFixed(4)),
    hitRate: Number(hitRate.toFixed(4)),
  };
}
