"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

/**
 * Helper para verificar privilégios de administrador
 */
async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Acesso negado: Apenas administradores.")
  }
  return session.user
}

/**
 * Retorna todos os planos ordenados por ordem de exibição
 */
export async function getPlans() {
  await requireAdmin()
  return await prisma.planConfig.findMany({
    orderBy: { order: "asc" }
  })
}

/**
 * Salva (cria ou atualiza) um plano no banco de dados
 */
export async function savePlan(data: {
  id?: string
  name: string
  priceCents: number
  stripePriceId: string
  description?: string | null
  features: string // JSON string de array de strings
  order: number
  active: boolean
}) {
  await requireAdmin()
  const { id, name, priceCents, stripePriceId, description, features, order, active } = data

  const payload = {
    name,
    priceCents,
    stripePriceId,
    description: description || null,
    features,
    order,
    active
  }

  if (id) {
    return await prisma.planConfig.update({
      where: { id },
      data: payload
    })
  } else {
    return await prisma.planConfig.create({
      data: payload
    })
  }
}

/**
 * Exclui um plano pelo ID
 */
export async function deletePlan(id: string) {
  await requireAdmin()
  return await prisma.planConfig.delete({
    where: { id }
  })
}
