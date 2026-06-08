import { prisma } from "@/lib/prisma";

export interface RemainingTransaction {
  id: string;
  amount: number;
  remaining: number;
  expiresAt: Date | null;
  createdAt: Date;
}

/**
 * Calcula o saldo remanescente de cada transação de ganho/ajuste positivo do usuário
 * utilizando a lógica de consumo First-In-First-Out (FIFO).
 */
export async function getRemainingBalances(userId: string): Promise<RemainingTransaction[]> {
  const txs = await prisma.pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const positiveTxs: RemainingTransaction[] = [];
  let totalNegativeAmount = 0;

  for (const tx of txs) {
    if (tx.amount > 0) {
      positiveTxs.push({
        id: tx.id,
        amount: tx.amount,
        remaining: tx.amount,
        expiresAt: tx.expiresAt,
        createdAt: tx.createdAt,
      });
    } else {
      // Usamos o valor absoluto para a conta de abatimento
      totalNegativeAmount += Math.abs(tx.amount);
    }
  }

  // Deduzir o montante negativo (resgates/expirações) das transações positivas (FIFO)
  let remainingSpent = totalNegativeAmount;
  for (const pTx of positiveTxs) {
    if (remainingSpent <= 0) {
      break;
    }
    if (remainingSpent >= pTx.remaining) {
      remainingSpent -= pTx.remaining;
      pTx.remaining = 0;
    } else {
      pTx.remaining -= remainingSpent;
      remainingSpent = 0;
    }
  }

  return positiveTxs;
}
