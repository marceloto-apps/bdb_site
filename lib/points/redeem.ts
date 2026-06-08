import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

export class InsufficientPointsError extends Error {
  constructor() {
    super("SALDO_INSUFICIENTE");
    this.name = "InsufficientPointsError";
  }
}

/**
 * Resgata uma recompensa para o usuário dentro de uma transação do Prisma.
 * 
 * Fluxo de execução:
 * 1. Busca a RewardOption ativa.
 * 2. Recalcula o saldo do usuário DENTRO da transação para evitar leitura stale.
 * 3. Se saldo < pointsCost, lança InsufficientPointsError.
 * 4. Cria a PointTransaction do tipo RESGATE com valor negativo (amount = -pointsCost).
 * 5. Cria o Coupon associado ao usuário.
 * 6. Retorna o cupom criado.
 */
export async function redeemReward(userId: string, rewardOptionId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buscar RewardOption ativa
    const reward = await tx.rewardOption.findUnique({
      where: { id: rewardOptionId },
    });

    if (!reward || !reward.active) {
      throw new Error("RECOMPENSA_INDISPONIVEL");
    }

    const now = new Date();

    // 2. Recalcular saldo dentro da transação
    const balanceResult = await tx.pointTransaction.aggregate({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      _sum: {
        amount: true,
      },
    });

    const currentBalance = balanceResult._sum.amount || 0;

    // 3. Validar se possui saldo suficiente
    if (currentBalance < reward.pointsCost) {
      throw new InsufficientPointsError();
    }

    // 4. Criar transação de resgate (tipo RESGATE, amount negativo)
    const txId = createId();
    const idempotencyKey = `RESGATE:${userId}:${rewardOptionId}:${txId}`;

    await tx.pointTransaction.create({
      data: {
        id: txId,
        userId,
        type: "RESGATE",
        amount: -reward.pointsCost,
        reason: `Resgate de Recompensa: ${reward.label}`,
        idempotencyKey,
      },
    });

    // 5. Gerar Coupon correspondente
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + reward.couponValidityDays);
    
    // Gerar código legível e único para o cupom
    const couponCode = `BDB-${createId().substring(0, 8).toUpperCase()}`;

    const coupon = await tx.coupon.create({
      data: {
        code: couponCode,
        userId,
        discountPct: reward.discountPct,
        appliesTo: reward.appliesTo,
        pointsCost: reward.pointsCost,
        expiresAt,
      },
    });

    return coupon;
  });
}
