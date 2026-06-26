// lib/ferramentas/backtest/settlement.ts

export type BacktestMarket = "1X2" | "BTTS" | "OVER_UNDER" | "ASIAN_HANDICAP";
export type BacktestBetSide = "HOME" | "DRAW" | "AWAY" | "OVER" | "UNDER" | "YES" | "NO";
export type BacktestOutcome = "WIN" | "HALF_WIN" | "REFUND" | "HALF_LOSS" | "LOSS";

export interface SettlementParams {
  market: BacktestMarket;
  betSide: BacktestBetSide;
  line?: number; // Requerido para OVER_UNDER e ASIAN_HANDICAP
  stake: number;
  odd: number;
  fthg: number; // Gols do time Mandante no tempo regulamentar
  ftag: number; // Gols do time Visitante no tempo regulamentar
}

export interface SettlementResult {
  outcome: BacktestOutcome;
  pnl: number;
}

/**
 * Liquida uma aposta esportiva com base no placar final regulamentar (fthg, ftag)
 * e retorna o resultado da aposta (WIN, HALF_WIN, REFUND, HALF_LOSS, LOSS) e o P&L líquido.
 */
export function liquidarAposta(params: SettlementParams): SettlementResult {
  const { market, betSide, line = 0, stake, odd, fthg, ftag } = params;

  const totalGoals = fthg + ftag;
  const goalDiff = fthg - ftag;

  switch (market) {
    case "1X2":
      return liquidar1X2(betSide, goalDiff, stake, odd);

    case "BTTS":
      return liquidarBTTS(betSide, fthg, ftag, stake, odd);

    case "OVER_UNDER":
      return liquidarOverUnder(betSide, totalGoals, line, stake, odd);

    case "ASIAN_HANDICAP":
      return liquidarAsianHandicap(betSide, goalDiff, line, stake, odd);

    default:
      throw new Error(`Mercado não suportado: ${market}`);
  }
}

/**
 * Liquida apostas no mercado de 1X2 (Vencedor do Jogo)
 */
function liquidar1X2(
  betSide: BacktestBetSide,
  goalDiff: number,
  stake: number,
  odd: number
): SettlementResult {
  let isWin = false;

  if (betSide === "HOME" && goalDiff > 0) isWin = true;
  else if (betSide === "DRAW" && goalDiff === 0) isWin = true;
  else if (betSide === "AWAY" && goalDiff < 0) isWin = true;

  if (isWin) {
    return { outcome: "WIN", pnl: Number((stake * (odd - 1)).toFixed(4)) };
  }
  return { outcome: "LOSS", pnl: -stake };
}

/**
 * Liquida apostas no mercado de BTTS (Both Teams To Score / Ambos Marcam)
 */
function liquidarBTTS(
  betSide: BacktestBetSide,
  fthg: number,
  ftag: number,
  stake: number,
  odd: number
): SettlementResult {
  const ambosMarcam = fthg > 0 && ftag > 0;
  const isWin = betSide === "YES" ? ambosMarcam : !ambosMarcam;

  if (isWin) {
    return { outcome: "WIN", pnl: Number((stake * (odd - 1)).toFixed(4)) };
  }
  return { outcome: "LOSS", pnl: -stake };
}

/**
 * Liquida apostas no mercado de Over/Under (Totais de Gols)
 */
function liquidarOverUnder(
  betSide: BacktestBetSide,
  totalGoals: number,
  line: number,
  stake: number,
  odd: number
): SettlementResult {
  const totalGoalsX4 = totalGoals * 4;
  const lineX4 = Math.round(line * 4);

  // Over/Under Inteiro e Meio (linhas que são múltiplos de 0.5, ex: 2.0, 2.5)
  if (lineX4 % 2 === 0) {
    if (totalGoalsX4 === lineX4) {
      return { outcome: "REFUND", pnl: 0 };
    }
    const isWin = betSide === "OVER" ? totalGoalsX4 > lineX4 : totalGoalsX4 < lineX4;
    return isWin
      ? { outcome: "WIN", pnl: Number((stake * (odd - 1)).toFixed(4)) }
      : { outcome: "LOSS", pnl: -stake };
  }

  // Over/Under Quartos/Asiático (ex: 2.25, 2.75)
  // Dividido em duas sub-linhas adjacentes: L1 = L - 0.25 e L2 = L + 0.25
  const l1_x4 = lineX4 - 1;
  const l2_x4 = lineX4 + 1;

  if (betSide === "OVER") {
    if (totalGoalsX4 > l2_x4) {
      return { outcome: "WIN", pnl: Number((stake * (odd - 1)).toFixed(4)) };
    }
    if (totalGoalsX4 === l2_x4) {
      return { outcome: "HALF_WIN", pnl: Number((stake * (odd - 1) / 2).toFixed(4)) };
    }
    if (totalGoalsX4 === l1_x4) {
      return { outcome: "HALF_LOSS", pnl: Number((-stake / 2).toFixed(4)) };
    }
    return { outcome: "LOSS", pnl: -stake };
  } else {
    // UNDER
    if (totalGoalsX4 < l1_x4) {
      return { outcome: "WIN", pnl: Number((stake * (odd - 1)).toFixed(4)) };
    }
    if (totalGoalsX4 === l1_x4) {
      return { outcome: "HALF_WIN", pnl: Number((stake * (odd - 1) / 2).toFixed(4)) };
    }
    if (totalGoalsX4 === l2_x4) {
      return { outcome: "HALF_LOSS", pnl: Number((-stake / 2).toFixed(4)) };
    }
    return { outcome: "LOSS", pnl: -stake };
  }
}

/**
 * Liquida apostas no mercado de Asian Handicap (Handicap Asiático)
 */
function liquidarAsianHandicap(
  betSide: BacktestBetSide,
  goalDiff: number,
  line: number, // Linha de handicap do mandante (ex: -0.25, +0.50, -1.0)
  stake: number,
  odd: number
): SettlementResult {
  const goalDiffX4 = goalDiff * 4;
  const lineX4 = Math.round(line * 4);

  // Calcula a diferença efetiva multiplicada por 4
  const diffEfetivaX4 = betSide === "HOME" ? goalDiffX4 + lineX4 : -goalDiffX4 - lineX4;

  if (diffEfetivaX4 >= 2) {
    return { outcome: "WIN", pnl: Number((stake * (odd - 1)).toFixed(4)) };
  }
  if (diffEfetivaX4 === 1) {
    return { outcome: "HALF_WIN", pnl: Number((stake * (odd - 1) / 2).toFixed(4)) };
  }
  if (diffEfetivaX4 === 0) {
    return { outcome: "REFUND", pnl: 0 };
  }
  if (diffEfetivaX4 === -1) {
    return { outcome: "HALF_LOSS", pnl: Number((-stake / 2).toFixed(4)) };
  }
  return { outcome: "LOSS", pnl: -stake };
}

