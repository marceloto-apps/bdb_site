import { prisma } from "@/lib/prisma";
import { FAIXAS_STATUS } from "./config";

export type BDBStatus = typeof FAIXAS_STATUS[number]["nome"];

export interface UserStatusInfo {
  currentStatus: BDBStatus;
  nextStatus: BDBStatus | null;
  pointsInPeriod: number;
  pointsToNextStatus: number | null;
  progressPercentage: number;
}

/**
 * Calcula o status de fidelidade do usuário com base nos pontos GANHOS nos últimos 12 meses.
 * Critério diferente do saldo (soma apenas transações de GANHO no período).
 */
export async function getStatus(userId: string): Promise<UserStatusInfo> {
  const now = new Date();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

  // Soma apenas transações type = GANHO criadas nos últimos 12 meses
  const result = await prisma.pointTransaction.aggregate({
    where: {
      userId,
      type: "GANHO",
      createdAt: {
        gte: twelveMonthsAgo,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const pointsInPeriod = result._sum.amount || 0;

  // Determinar faixa de status atual
  let currentStatus: BDBStatus = FAIXAS_STATUS[0].nome;
  let currentMin: number = FAIXAS_STATUS[0].min;
  let nextStatus: BDBStatus | null = null;
  let nextMin: number | null = null;

  for (let i = 0; i < FAIXAS_STATUS.length; i++) {
    if (pointsInPeriod >= FAIXAS_STATUS[i].min) {
      currentStatus = FAIXAS_STATUS[i].nome;
      currentMin = FAIXAS_STATUS[i].min;
      if (i + 1 < FAIXAS_STATUS.length) {
        nextStatus = FAIXAS_STATUS[i + 1].nome;
        nextMin = FAIXAS_STATUS[i + 1].min;
      } else {
        nextStatus = null;
        nextMin = null;
      }
    } else {
      break;
    }
  }

  let pointsToNextStatus: number | null = null;
  let progressPercentage = 100;

  if (nextMin !== null && nextStatus !== null) {
    pointsToNextStatus = nextMin - pointsInPeriod;
    const range = nextMin - currentMin;
    const earnedInRange = pointsInPeriod - currentMin;
    progressPercentage = Math.min(
      100,
      Math.max(0, Math.round((earnedInRange / range) * 100))
    );
  }

  return {
    currentStatus,
    nextStatus,
    pointsInPeriod,
    pointsToNextStatus,
    progressPercentage,
  };
}
