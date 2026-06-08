import { prisma } from "@/lib/prisma";
import { LIMITE_MENSAL_POR_PLANO, MESES_EXPIRACAO } from "./config";

/**
 * Concede pontos a um usuário com base em uma regra de ação (PointRule).
 * 
 * Fluxo de execução:
 * 1. Busca a PointRule ativa correspondente ao `action`. Se inexistente/inativa, cancela (no-op).
 * 2. Gera a idempotencyKey:
 *    - Se refId informado: `${action}:${userId}:${refId}`
 *    - Se dailyCap === 1: `${action}:${userId}:${YYYY-MM-DD}`
 *    - Caso contrário: `${action}:${userId}` (ou customIdempotencyKey se informado)
 * 3. Valida dailyCap e monthlyCap da regra (número de transações criadas no período).
 * 4. Se countsToCap for true: valida o limite mensal do plano do usuário (User.plan).
 *    Trunca os pontos a conceder para não estourar o limite.
 * 5. Cria a PointTransaction com idempotencyKey. Trata o erro Prisma P2002 como no-op.
 */
export async function awardPoints(
  userId: string,
  action: string,
  refId?: string,
  customIdempotencyKey?: string
) {
  // 1. Buscar regra ativa
  const rule = await prisma.pointRule.findUnique({
    where: { action },
  });

  if (!rule || !rule.active) {
    console.log(`[Points] Regra para ação '${action}' não encontrada ou inativa.`);
    return null;
  }

  const now = new Date();
  
  // Datas de início do dia e do mês
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setUTCHours(0, 0, 0, 0);
  startOfMonth.setUTCDate(1);

  // 2. Montar idempotencyKey
  let idempotencyKey = customIdempotencyKey;
  if (!idempotencyKey) {
    if (refId) {
      idempotencyKey = `${action}:${userId}:${refId}`;
    } else if (rule.dailyCap === 1) {
      const yyyyMmDd = now.toISOString().split("T")[0];
      idempotencyKey = `${action}:${userId}:${yyyyMmDd}`;
    } else {
      idempotencyKey = `${action}:${userId}`;
    }
  }

  // 3. Validar dailyCap e monthlyCap da regra
  if (rule.dailyCap) {
    const dailyCount = await prisma.pointTransaction.count({
      where: {
        userId,
        refType: action,
        createdAt: { gte: startOfDay },
      },
    });
    if (dailyCount >= rule.dailyCap) {
      console.log(`[Points] Daily cap de ${rule.dailyCap} transações atingido para '${action}' e usuário ${userId}.`);
      return null;
    }
  }

  if (rule.monthlyCap) {
    const monthlyCount = await prisma.pointTransaction.count({
      where: {
        userId,
        refType: action,
        createdAt: { gte: startOfMonth },
      },
    });
    if (monthlyCount >= rule.monthlyCap) {
      console.log(`[Points] Monthly cap de ${rule.monthlyCap} transações atingido para '${action}' e usuário ${userId}.`);
      return null;
    }
  }

  let pointsToAward = rule.points;

  // 4. Validar limite mensal do plano (apenas regras que somam para o cap)
  if (rule.countsToCap) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      console.log(`[Points] Usuário ${userId} não encontrado para validação de plano.`);
      return null;
    }

    const plan = user.plan || "FREE";
    const planLimit = LIMITE_MENSAL_POR_PLANO[plan] ?? 300;

    // Obter todas as regras que entram no cap mensal
    const capRules = await prisma.pointRule.findMany({
      where: { countsToCap: true, active: true },
      select: { action: true },
    });
    const capActions = capRules.map((r) => r.action);

    // Somar amount de ganhos do usuário no mês corrente para essas regras
    const monthlySumResult = await prisma.pointTransaction.aggregate({
      where: {
        userId,
        type: "GANHO",
        refType: { in: capActions },
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        amount: true,
      },
    });

    const currentMonthlyEarned = monthlySumResult._sum.amount || 0;

    if (currentMonthlyEarned >= planLimit) {
      console.log(`[Points] Limite mensal do plano ${plan} (${planLimit} pts) atingido para o usuário ${userId}.`);
      return null;
    }

    if (currentMonthlyEarned + pointsToAward > planLimit) {
      pointsToAward = planLimit - currentMonthlyEarned;
    }
  }

  if (pointsToAward <= 0) {
    console.log(`[Points] Quantidade de pontos a conceder é 0 após truncamento de limite.`);
    return null;
  }

  // Define data de expiração (12 meses a partir de agora)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + MESES_EXPIRACAO);

  // 5. Inserir transação com garantia de idempotência
  try {
    const tx = await prisma.pointTransaction.create({
      data: {
        userId,
        type: "GANHO",
        amount: pointsToAward,
        reason: rule.label,
        refType: action,
        refId: refId || null,
        expiresAt,
        idempotencyKey,
      },
    });
    return tx;
  } catch (error: any) {
    // Código Prisma P2002 significa erro de restrição única (idempotencyKey duplicada)
    if (error.code === "P2002") {
      console.log(`[Points] Transação ignorada por idempotência. Chave existente: ${idempotencyKey}`);
      return null;
    }
    throw error;
  }
}
