import { prisma } from '@/lib/prisma'
import { hasVipAccess } from '@/lib/auth/check-access'
import { isLeagueAccessible, isLeagueFree, LEAGUE_ORDER_RANK } from '@/lib/auth/free-leagues'
import {
  getSaoPauloDayRange,
  getSaoPauloDateString,
  formatHoraSP,
  formatDataCompletaSP,
} from '@/lib/utils/date-sp'
import { nomeExibicao } from '@/lib/utils/team-name'

export interface MatchItem {
  id: string
  utcDate: string
  horaSP: string
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED'
  round: number | null
  fthg: number | null
  ftag: number | null
  hasXg: boolean
  homeTeam: {
    id: string
    name: string
    displayName: string
    logoUrl: string | null
  }
  awayTeam: {
    id: string
    name: string
    displayName: string
    logoUrl: string | null
  }
  competition: {
    id: string
    name: string
    slug: string
    country: string | null
    tier: 'FREE' | 'VIP'
  }
}

export interface LeagueFilterOption {
  slug: string
  name: string
  country: string | null
  tier: 'FREE' | 'VIP'
  totalJogos: number
}

export interface JogosDoDiaResult {
  partidas: MatchItem[]
  ligas: LeagueFilterOption[]
  estatisticas: {
    total: number
    aoVivo: number
    agendados: number
    finalizados: number
  }
  dataReferencia: {
    dateStr: string
    dataCompleta: string
  }
  isVip: boolean
}

/**
 * Carrega exclusivamente as partidas do dia NÃO INICIADAS e NÃO FINALIZADAS (SCHEDULED),
 * com horário de início a partir do momento atual até o fim do dia em São Paulo,
 * filtrando estritamente pelas ligas às quais o usuário possui acesso.
 */
export async function carregarJogosDoDia(
  userId: string,
  targetDate: Date = new Date()
): Promise<JogosDoDiaResult> {
  const now = new Date()
  const { startUtc, endUtc, dateStr } = getSaoPauloDayRange(targetDate)
  const todayStr = getSaoPauloDateString(now)
  const isVip = await hasVipAccess(userId)

  // Como o sync da API roda apenas 2 vezes ao dia, exibimos apenas partidas
  // que ainda NÃO INICIARAM e NÃO FINALIZARAM (status SCHEDULED).
  // Se a data de referência for o dia de hoje, consideramos partidas com início a partir de agora.
  const gteDate = dateStr === todayStr ? now : startUtc

  const matches = await prisma.match.findMany({
    where: {
      status: 'SCHEDULED',
      utcDate: {
        gte: gteDate,
        lte: endUtc,
      },
      season: {
        competition: {
          active: true,
          type: 'LEAGUE',
          NOT: {
            OR: [
              { slug: 'copa-do-mundo-2026' },
              { slug: 'copa-2026' },
              { externalId: 'comp_6107' },
            ],
          },
        },
      },
    },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          nameReviewedAt: true,
          logoUrl: true,
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          shortName: true,
          nameReviewedAt: true,
          logoUrl: true,
        },
      },
      season: {
        select: {
          competition: {
            select: {
              id: true,
              name: true,
              slug: true,
              country: true,
            },
          },
        },
      },
      stats: {
        select: {
          homeXg: true,
          awayXg: true,
        },
      },
    },
    orderBy: {
      utcDate: 'asc',
    },
  })

  // Filtrar apenas partidas de ligas que o usuário tem acesso
  const partidasAcessiveis = matches.filter((m) => {
    const slug = m.season.competition.slug
    return isLeagueAccessible(slug, isVip)
  })

  // Mapear para MatchItem
  const partidas: MatchItem[] = partidasAcessiveis.map((m) => {
    const comp = m.season.competition
    const tier = isLeagueFree(comp.slug) ? 'FREE' : 'VIP'
    const hasXg = m.stats?.homeXg != null || m.stats?.awayXg != null

    return {
      id: m.id,
      utcDate: m.utcDate.toISOString(),
      horaSP: formatHoraSP(m.utcDate),
      status: m.status as MatchItem['status'],
      round: m.round,
      fthg: m.fthg,
      ftag: m.ftag,
      hasXg,
      homeTeam: {
        id: m.homeTeam.id,
        name: m.homeTeam.name,
        displayName: nomeExibicao(m.homeTeam),
        logoUrl: m.homeTeam.logoUrl,
      },
      awayTeam: {
        id: m.awayTeam.id,
        name: m.awayTeam.name,
        displayName: nomeExibicao(m.awayTeam),
        logoUrl: m.awayTeam.logoUrl,
      },
      competition: {
        id: comp.id,
        name: comp.name,
        slug: comp.slug,
        country: comp.country,
        tier,
      },
    }
  })

  // Contabilizar partidas por liga
  const ligasMap = new Map<string, LeagueFilterOption>()
  for (const p of partidas) {
    const slug = p.competition.slug
    const existing = ligasMap.get(slug)
    if (existing) {
      existing.totalJogos += 1
    } else {
      ligasMap.set(slug, {
        slug,
        name: p.competition.name,
        country: p.competition.country,
        tier: p.competition.tier,
        totalJogos: 1,
      })
    }
  }

  // Ordenar ligas pelo ranking de relevância
  const ligas = Array.from(ligasMap.values()).sort((a, b) => {
    const rankA = LEAGUE_ORDER_RANK[a.slug] ?? 999
    const rankB = LEAGUE_ORDER_RANK[b.slug] ?? 999
    if (rankA !== rankB) return rankA - rankB
    return a.name.localeCompare(b.name)
  })

  return {
    partidas,
    ligas,
    estatisticas: {
      total: partidas.length,
      aoVivo: 0,
      agendados: partidas.length,
      finalizados: 0,
    },
    dataReferencia: {
      dateStr,
      dataCompleta: formatDataCompletaSP(targetDate),
    },
    isVip,
  }
}
