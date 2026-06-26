import { prisma } from '@/lib/prisma'

/**
 * Verifica se um usuário possui acesso aos recursos VIP (ligas VIP).
 * 
 * Regras:
 * 1. ADMIN ou EDITOR possuem acesso total irrestrito.
 * 2. Usuários com plano VIP_BASICO ou VIP_PRO possuem acesso.
 * 3. Usuários que constam na tabela LegacyAccess (acesso vitalício do Hubla) possuem acesso.
 */
export async function hasVipAccess(userId: string): Promise<boolean> {
  if (!userId) return false

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        legacyAccess: true,
      },
    })

    if (!user) return false

    // 1. ADMIN ou EDITOR possuem acesso completo
    if (user.role === 'ADMIN' || user.role === 'EDITOR') {
      return true
    }

    // 2. Planos pagos (VIP_BASICO e VIP_PRO) liberam as ligas VIP na Fase 4
    if (user.plan === 'VIP_BASICO' || user.plan === 'VIP_PRO') {
      return true
    }

    // 3. Usuários legados possuem acesso gratuito vitalício
    if (user.legacyAccess !== null) {
      return true
    }

    if (user.email) {
      const legacyByEmail = await prisma.legacyAccess.findUnique({
        where: { email: user.email },
      })
      if (legacyByEmail) {
        // Vincula o userId para consultas futuras mais rápidas
        await prisma.legacyAccess.update({
          where: { email: user.email },
          data: { userId: user.id },
        })
        return true
      }
    }

    return false
  } catch (error) {
    console.error('[hasVipAccess] Erro ao verificar acesso VIP:', error)
    return false
  }
}

/**
 * Verifica se um usuário possui acesso à ferramenta de Backtest (VIP_PRO).
 * 
 * Regras:
 * 1. ADMIN ou EDITOR possuem acesso.
 * 2. Usuários com plano VIP_PRO possuem acesso.
 * 3. Usuários que constam na tabela LegacyAccess possuem acesso.
 */
export async function hasBacktestAccess(userId: string): Promise<boolean> {
  if (!userId) return false

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        legacyAccess: true,
      },
    })

    if (!user) return false

    // 1. ADMIN ou EDITOR
    if (user.role === 'ADMIN' || user.role === 'EDITOR') {
      return true
    }

    // 2. Plano VIP_PRO
    if (user.plan === 'VIP_PRO') {
      return true
    }

    // 3. Usuários legados vitalícios
    if (user.legacyAccess !== null) {
      return true
    }

    if (user.email) {
      const legacyByEmail = await prisma.legacyAccess.findUnique({
        where: { email: user.email },
      })
      if (legacyByEmail) {
        await prisma.legacyAccess.update({
          where: { email: user.email },
          data: { userId: user.id },
        })
        return true
      }
    }

    return false
  } catch (error) {
    console.error('[hasBacktestAccess] Erro ao verificar acesso ao Backtest:', error)
    return false
  }
}

