"use server"

import { awardPoints } from "../award";

/**
 * Server action para conceder pontos por eventos da conta de forma segura.
 * É idempotente por natureza, pois utiliza idempotencyKey única por usuário para cada tipo de ação.
 */
export async function awardOnAccountEvents(
  userId: string,
  event: "CRIAR_CONTA" | "CONFIRMAR_EMAIL" | "COMPLETAR_PERFIL"
) {
  try {
    await awardPoints(userId, event);
  } catch (error) {
    console.error(`[Points Server Action] Erro ao conceder pontos por evento ${event} ao usuário ${userId}:`, error);
  }
}
