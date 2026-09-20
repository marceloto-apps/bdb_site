import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getSaoPauloDayRange,
  formatHoraSP,
  getSaoPauloDateString,
} from '@/lib/utils/date-sp'
import { carregarJogosDoDia } from '@/lib/dashboard/jogos-do-dia'
import { prisma } from '@/lib/prisma'
import { hasVipAccess } from '@/lib/auth/check-access'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth/check-access', () => ({
  hasVipAccess: vi.fn(),
}))

describe('Date SP utilities', () => {
  it('deve calcular corretamente o range UTC do dia em São Paulo', () => {
    // 2026-09-20 às 15:00 UTC = 12:00 em SP
    const testDate = new Date('2026-09-20T15:00:00.000Z')
    const { startUtc, endUtc, dateStr } = getSaoPauloDayRange(testDate)

    expect(dateStr).toBe('2026-09-20')
    // 00:00 em SP = 03:00 UTC
    expect(startUtc.toISOString()).toBe('2026-09-20T03:00:00.000Z')
    // 23:59:59.999 em SP = 02:59:59.999 UTC do dia seguinte
    expect(endUtc.toISOString()).toBe('2026-09-21T02:59:59.999Z')
  })

  it('deve formatar hora no Horário de Brasília (HH:mm)', () => {
    // 19:00 UTC = 16:00 em Brasília
    const hora = formatHoraSP('2026-09-20T19:00:00.000Z')
    expect(hora).toBe('16:00')
  })

  it('deve retornar a data no formato YYYY-MM-DD em São Paulo', () => {
    // 2026-09-21T01:30:00Z ainda é 22:30 de 2026-09-20 em São Paulo!
    const dataNoturna = new Date('2026-09-21T01:30:00.000Z')
    expect(getSaoPauloDateString(dataNoturna)).toBe('2026-09-20')
  })
})

describe('carregarJogosDoDia service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve carregar, ordenar por LEAGUE_ORDER_RANK e calcular estatísticas de partidas', async () => {
    vi.mocked(hasVipAccess).mockResolvedValue(false)

    const mockMatches = [
      {
        id: 'match-1',
        utcDate: new Date('2026-09-20T19:00:00.000Z'),
        status: 'SCHEDULED',
        round: 26,
        fthg: null,
        ftag: null,
        homeTeam: {
          id: 'team-fla',
          name: 'Flamengo',
          shortName: 'FLA',
          nameReviewedAt: new Date(),
          logoUrl: 'https://example.com/fla.png',
        },
        awayTeam: {
          id: 'team-pal',
          name: 'Palmeiras',
          shortName: 'PAL',
          nameReviewedAt: new Date(),
          logoUrl: 'https://example.com/pal.png',
        },
        season: {
          competition: {
            id: 'comp-br-a',
            name: 'Brasileirão Série A',
            slug: 'brasileirao-serie-a',
            country: 'Brazil',
          },
        },
        stats: {
          homeXg: 1.5,
          awayXg: 1.2,
        },
      },
      {
        id: 'match-2',
        utcDate: new Date('2026-09-20T15:30:00.000Z'),
        status: 'LIVE',
        round: 5,
        fthg: 1,
        ftag: 0,
        homeTeam: {
          id: 'team-ars',
          name: 'Arsenal',
          shortName: 'ARS',
          nameReviewedAt: null,
          logoUrl: null,
        },
        awayTeam: {
          id: 'team-che',
          name: 'Chelsea',
          shortName: 'CHE',
          nameReviewedAt: null,
          logoUrl: null,
        },
        season: {
          competition: {
            id: 'comp-pl',
            name: 'Premier League',
            slug: 'premier-league',
            country: 'England',
          },
        },
        stats: null,
      },
      {
        id: 'match-3',
        utcDate: new Date('2026-09-20T13:00:00.000Z'),
        status: 'FINISHED',
        round: 5,
        fthg: 2,
        ftag: 1,
        homeTeam: {
          id: 'team-san',
          name: 'Santos',
          shortName: 'SAN',
          nameReviewedAt: new Date(),
          logoUrl: null,
        },
        awayTeam: {
          id: 'team-spo',
          name: 'Sport Recife',
          shortName: 'SPO',
          nameReviewedAt: new Date(),
          logoUrl: null,
        },
        season: {
          competition: {
            id: 'comp-br-b',
            name: 'Brasileirão Série B',
            slug: 'brasileirao-serie-b',
            country: 'Brazil',
          },
        },
        stats: null,
      },
    ]

    vi.mocked(prisma.match.findMany).mockResolvedValue(mockMatches as any)

    const result = await carregarJogosDoDia('user-1', new Date('2026-09-20T12:00:00Z'))

    expect(result.partidas.length).toBe(3)
    expect(result.estatisticas.total).toBe(3)
    expect(result.estatisticas.aoVivo).toBe(1)
    expect(result.estatisticas.agendados).toBe(1)
    expect(result.estatisticas.finalizados).toBe(1)

    // Ligas devem estar ordenadas por LEAGUE_ORDER_RANK (Brasileirão A -> B -> Premier League)
    expect(result.ligas[0].slug).toBe('brasileirao-serie-a')
    expect(result.ligas[1].slug).toBe('brasileirao-serie-b')
    expect(result.ligas[2].slug).toBe('premier-league')

    // Formatação de hora SP
    const match1 = result.partidas.find((p) => p.id === 'match-1')
    expect(match1?.horaSP).toBe('16:00')
    expect(match1?.hasXg).toBe(true)
  })
})
