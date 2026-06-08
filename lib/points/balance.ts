import { prisma } from "@/lib/prisma";
import { getRemainingBalances } from "./fifo";
import { HORIZONTE_EXPIRACAO_DIAS } from "./config";

/**
 * Calcula o saldo atual do usuário.
 * 
 * Regra:
 * - Event sourcing puro: SUM(amount) de todas as transações de pontos.
 * - Filtra transações que expiraram: `expiresAt IS NULL OR expiresAt > now()`.
 * - reverted é apenas para auditoria; transações estornadas são neutralizadas por
 *   transações do tipo ESTORNO com amount negativo correspondente.
 */
export async function getBalance(userId: string): Promise<number> {
  const now = new Date();
  
  const result = await prisma.pointTransaction.aggregate({
    where: {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ]
    },
    _sum: {
      amount: true
    }
  });

  return result._sum.amount || 0;
}

/**
 * Calcula os pontos que expiram nos próximos 60 dias (HORIZONTE_EXPIRACAO_DIAS).
 * Utiliza o saldo remanescente FIFO das transações positivas de ganho.
 */
export async function getExpiringSoonPoints(userId: string): Promise<number> {
  const now = new Date();
  const limitDate = new Date();
  limitDate.setDate(now.getDate() + HORIZONTE_EXPIRACAO_DIAS);

  const remaining = await getRemainingBalances(userId);

  return remaining
    .filter((tx) => tx.expiresAt !== null && tx.expiresAt > now && tx.expiresAt <= limitDate)
    .reduce((sum, tx) => sum + tx.remaining, 0);
}

