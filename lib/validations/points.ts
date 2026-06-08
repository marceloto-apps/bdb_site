import { z } from "zod";

/**
 * Validação para resgate de recompensa
 */
export const redeemSchema = z.object({
  rewardOptionId: z.string().cuid("ID de recompensa inválido"),
});

/**
 * Validação para consulta de histórico de transações paginado
 */
export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type RedeemInput = z.infer<typeof redeemSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
