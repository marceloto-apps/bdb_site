import { NextRequest } from 'next/server'
import { GET } from '../../app/api/ligas/[slug]/previsao/route'
import { prisma } from '../../lib/prisma'

import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'user_123', email: 'test@example.com' },
  }),
}))

// Mock do prisma para não bater no banco real
vi.mock('../../lib/prisma', () => ({
  prisma: {
    competition: {
      findUnique: vi.fn()
    },
    match: {
      findFirst: vi.fn(),
      findMany: vi.fn()
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'user_123',
        role: 'MEMBRO',
        plan: 'VIP_PRO',
        legacyAccess: null,
      }),
    },
    legacyAccess: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  }
}))

describe('GET /api/ligas/[slug]/previsao', () => {
  const baseUrl = 'http://localhost/api/ligas/brazil-serie-a/previsao'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar 400 se homeTeamId ou awayTeamId estiverem ausentes', async () => {
    // Apenas awayTeamId presente
    const req = new NextRequest(`${baseUrl}?awayTeamId=cm2a2q0o0000008ld2x201xyz`)
    const res = await GET(req, { params: { slug: 'brazil-serie-a' } })
    
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('INVALID_QUERY')
    expect(json.message).toContain('Parâmetros inválidos')
  })

  it('deve retornar 400 se modelo for invalido', async () => {
    const req = new NextRequest(`${baseUrl}?homeTeamId=cm2a2q0o0000108ld2x202xyz&awayTeamId=cm2a2q0o0000008ld2x201xyz&modelo=MODELO_FALSO`)
    const res = await GET(req, { params: { slug: 'brazil-serie-a' } })
    
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('INVALID_QUERY')
    expect(json.message).toBe('Parâmetros inválidos')
  })

  it('deve retornar 200 com estrutura correta para params validos', async () => {
    ;(prisma.competition.findUnique as any).mockResolvedValue({ 
      id: 'c1',
      seasons: [{ id: 's1', year: 2026 }] 
    })
    
    // Mock do confronto (jogo futuro)
    ;(prisma.match.findFirst as any).mockResolvedValue({
      utcDate: new Date('2026-10-10T20:00:00Z'),
      odds: []
    })
    
    // Mock dos jogos históricos para calcularMediasLiga (precisa de >= 20) e calcularMediasTime (>=5 casa e >=5 fora por time)
    const mockGames = Array.from({ length: 40 }).map((_, i) => {
      let home = 'tx', away = 'ty';
      if (i < 10) { home = 'cm2a2q0o0000108ld2x202xyz'; away = 'cm2a2q0o0000308ld2x204xyz'; } // t1 home
      else if (i < 20) { home = 'cm2a2q0o0000308ld2x204xyz'; away = 'cm2a2q0o0000108ld2x202xyz'; } // t1 away
      else if (i < 30) { home = 'cm2a2q0o0000008ld2x201xyz'; away = 'cm2a2q0o0000408ld2x205xyz'; } // t2 home
      else { home = 'cm2a2q0o0000408ld2x205xyz'; away = 'cm2a2q0o0000008ld2x201xyz'; } // t2 away
      
      return {
        fthg: i % 3,
        ftag: i % 2,
        homeTeamId: home,
        awayTeamId: away,
        utcDate: new Date(`2026-05-${(i % 28) + 1}T20:00:00Z`),
        round: i + 1,
        odds: []
      }
    })
    ;(prisma.match.findMany as any).mockResolvedValue(mockGames)

    const req = new NextRequest(`${baseUrl}?homeTeamId=cm2a2q0o0000108ld2x202xyz&awayTeamId=cm2a2q0o0000008ld2x201xyz&modelo=POISSON`)
    const res = await GET(req, { params: { slug: 'brazil-serie-a' } })
    
    expect(res.status).toBe(200)
    const json = await res.json()
    
    expect(json.data).toBeDefined()
    expect(json.data.modelo).toBe('POISSON')
    expect(json.data.medias).toBeDefined()
    expect(json.data.forcas).toBeDefined()
    expect(json.data.lambdas).toBeDefined()
    expect(json.data.matrizPlacares).toBeDefined()
    expect(json.data.mercados).toBeDefined()
  })
})
