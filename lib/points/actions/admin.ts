"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createId } from "@paralleldrive/cuid2"
import { revalidatePath } from "next/cache"

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
 * Retorna todas as regras de pontos registradas
 */
export async function getPointRules() {
  await requireAdmin()
  return await prisma.pointRule.findMany({
    orderBy: { action: "asc" }
  })
}

/**
 * Cria ou atualiza uma regra de pontos
 */
export async function savePointRule(data: {
  id?: string
  action: string
  label: string
  points: number
  dailyCap?: number | null
  monthlyCap?: number | null
  countsToCap: boolean
  active: boolean
}) {
  await requireAdmin()
  const { id, action, label, points, dailyCap, monthlyCap, countsToCap, active } = data

  const payload = {
    action,
    label,
    points,
    dailyCap: dailyCap || null,
    monthlyCap: monthlyCap || null,
    countsToCap,
    active
  }

  if (id) {
    return await prisma.pointRule.update({
      where: { id },
      data: payload
    })
  } else {
    return await prisma.pointRule.create({
      data: payload
    })
  }
}

/**
 * Retorna todas as opções de recompensa
 */
export async function getRewardOptions() {
  await requireAdmin()
  return await prisma.rewardOption.findMany({
    orderBy: { order: "asc" }
  })
}

/**
 * Cria ou atualiza uma opção de recompensa
 */
export async function saveRewardOption(data: {
  id?: string
  label: string
  pointsCost: number
  discountPct: number
  appliesTo: string
  couponValidityDays: number
  active: boolean
  order: number
}) {
  await requireAdmin()
  const { id, label, pointsCost, discountPct, appliesTo, couponValidityDays, active, order } = data

  const payload = {
    label,
    pointsCost,
    discountPct,
    appliesTo,
    couponValidityDays,
    active,
    order
  }

  if (id) {
    return await prisma.rewardOption.update({
      where: { id },
      data: payload
    })
  } else {
    return await prisma.rewardOption.create({
      data: payload
    })
  }
}

/**
 * Realiza um ajuste manual de saldo (crédito ou débito) para um usuário por e-mail
 */
export async function createManualAdjustment(email: string, amount: number, reason: string) {
  await requireAdmin()

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error("Usuário não encontrado com o e-mail informado.")
  }

  const txId = createId()
  const idempotencyKey = `AJUSTE:${user.id}:${Date.now()}:${txId}`

  const tx = await prisma.pointTransaction.create({
    data: {
      id: txId,
      userId: user.id,
      type: "AJUSTE",
      amount,
      reason,
      idempotencyKey
    }
  })

  return tx
}

/**
 * Retorna o histórico global de transações para auditoria (com paginação)
 */
export async function getGlobalHistory(page: number = 1, pageSize: number = 20) {
  await requireAdmin()
  const skip = (page - 1) * pageSize

  const [transactions, total] = await Promise.all([
    prisma.pointTransaction.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize
    }),
    prisma.pointTransaction.count()
  ])

  return {
    transactions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}
