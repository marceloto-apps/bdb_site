import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { hasVipAccess } from '@/lib/auth/check-access'

// Mock do prisma
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
      legacyAccess: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  }
})

describe('check-access - hasVipAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar false para um usuário comum com plano FREE', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBRO',
      plan: 'FREE',
      legacyAccess: null,
    } as any)

    const hasAccess = await hasVipAccess('user-1')
    expect(hasAccess).toBe(false)
  })

  it('deve retornar true para usuários com papel ADMIN ou EDITOR', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-admin',
      role: 'ADMIN',
      plan: 'FREE',
      legacyAccess: null,
    } as any)

    expect(await hasVipAccess('user-admin')).toBe(true)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-editor',
      role: 'EDITOR',
      plan: 'FREE',
      legacyAccess: null,
    } as any)

    expect(await hasVipAccess('user-editor')).toBe(true)
  })

  it('deve retornar true para usuários com plano VIP_BASICO ou VIP_PRO', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-basico',
      role: 'MEMBRO',
      plan: 'VIP_BASICO',
      legacyAccess: null,
    } as any)

    expect(await hasVipAccess('user-basico')).toBe(true)

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-pro',
      role: 'MEMBRO',
      plan: 'VIP_PRO',
      legacyAccess: null,
    } as any)

    expect(await hasVipAccess('user-pro')).toBe(true)
  })

  it('deve retornar true se o usuário tiver acesso legado em LegacyAccess', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-legacy',
      role: 'MEMBRO',
      plan: 'FREE',
      legacyAccess: { id: 'legacy-1', email: 'legacy@example.com' },
    } as any)

    const hasAccess = await hasVipAccess('user-legacy')
    expect(hasAccess).toBe(true)
  })

  it('deve retornar true se o usuário for encontrado por email em LegacyAccess e vinculá-lo', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-legacy-email',
      role: 'MEMBRO',
      plan: 'FREE',
      email: 'legacy-email@example.com',
      legacyAccess: null,
    } as any)

    vi.mocked(prisma.legacyAccess.findUnique).mockResolvedValue({
      id: 'legacy-2',
      email: 'legacy-email@example.com',
      userId: null,
    } as any)

    const hasAccess = await hasVipAccess('user-legacy-email')
    expect(hasAccess).toBe(true)
    expect(prisma.legacyAccess.update).toHaveBeenCalledWith({
      where: { email: 'legacy-email@example.com' },
      data: { userId: 'user-legacy-email' },
    })
  })

  it('deve retornar false se o userId for nulo ou vazio', async () => {
    expect(await hasVipAccess('')).toBe(false)
  })
})
