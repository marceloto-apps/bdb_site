import { prisma } from "@/lib/prisma";
import { getRemainingBalances } from "./fifo";

/**
 * Varre o banco de dados em busca de transações do tipo GANHO que já expiraram (expiresAt <= now())
 * e cria transações de EXPIRACAO para deduzir o saldo remanescente de cada ganho usando a lógica FIFO.
 * 
 * Retorna o número de transações de expiração criadas.
 */
export async function expirePoints(): Promise<number> {
  const now = new Date();

  // 1. Buscar transações de GANHO cuja data de expiração passou
  const expiredGains = await prisma.pointTransaction.findMany({
    where: {
      type: "GANHO",
      expiresAt: {
        lte: now,
      },
    },
  });

  let expiredCount = 0;

  for (const gain of expiredGains) {
    const idempotencyKey = `EXPIRACAO:${gain.id}`;

    // 2. Verificar se já existe uma transação de expiração correspondente (idempotência)
    const existingExpiration = await prisma.pointTransaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingExpiration) {
      continue;
    }

    // 3. Obter saldo remanescente daquele ganho usando a lógica FIFO do usuário
    const remainingBalances = await getRemainingBalances(gain.userId);
    const matchedGain = remainingBalances.find((r) => r.id === gain.id);

    if (matchedGain && matchedGain.remaining > 0) {
      try {
        // 4. Inserir a transação de EXPIRACAO com amount negativo
        await prisma.pointTransaction.create({
          data: {
            userId: gain.userId,
            type: "EXPIRACAO",
            amount: -matchedGain.remaining,
            reason: `Expiração de pontos da transação: ${gain.id}`,
            idempotencyKey,
            refType: "PointTransaction",
            refId: gain.id,
          },
        });
        expiredCount++;
      } catch (error: any) {
        if (error.code === "P2002") {
          // Tratamento para evitar erro em caso de processamento paralelo
          continue;
        }
        throw error;
      }
    }
  }

  return expiredCount;
}
