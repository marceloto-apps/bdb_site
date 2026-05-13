import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { previsaoQuerySchema } from '@/lib/validations/liga'
import { getSeasonDateFilter } from '@/lib/utils/season-filter'
import { buildTeamMatchStats } from '@/lib/analytics/estatisticas-builder'

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const queryResult = previsaoQuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'INVALID_QUERY', message: 'Parâmetros inválidos', details: queryResult.error.format() },
        { status: 400 }
      )
    }

    const query = queryResult.data
    const { slug } = params

    const competition = await prisma.competition.findUnique({
      where: { slug },
      include: {
        seasons: {
          where: { isCurrent: true },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ error: 'LEAGUE_NOT_FOUND', message: 'Liga não encontrada' }, { status: 404 })
    }

    const activeSeason = competition.seasons[0]
    if (!activeSeason) {
      return NextResponse.json({ error: 'NO_ACTIVE_SEASON', message: 'Nenhuma temporada ativa encontrada' }, { status: 404 })
    }

    const homeTeam = await prisma.team.findUnique({ where: { id: query.homeTeamId } })
    const awayTeam = await prisma.team.findUnique({ where: { id: query.awayTeamId } })

    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: 'TEAMS_NOT_FOUND', message: 'Times não encontrados' }, { status: 404 })
    }

    // Buscar TODOS os jogos finalizados da temporada atual onde um dos times participou
    const todosOsJogos = await prisma.match.findMany({
      where: {
        seasonId: activeSeason.id,
        status: 'FINISHED',
        fthg: { not: null },
        ftag: { not: null },
        utcDate: getSeasonDateFilter(activeSeason.year),
        OR: [
          { homeTeamId: query.homeTeamId },
          { awayTeamId: query.homeTeamId },
          { homeTeamId: query.awayTeamId },
          { awayTeamId: query.awayTeamId }
        ]
      },
      include: {
        odds: {
          where: {
            bookmaker: { name: 'Bet365' },
          },
          orderBy: { createdAt: 'desc' }, // Tenta pegar a mais recente
          include: { market: true }
        },
        stats: true,
      },
      orderBy: { utcDate: 'asc' },
    })

    // Remove duplicates because a match between homeTeam and awayTeam satisfies multiple OR conditions
    const uniqueMatches = Array.from(new Map(todosOsJogos.map(item => [item.id, item])).values())

    let jogosFiltrados = [...uniqueMatches]

    if (query.roundFrom || query.roundTo) {
      jogosFiltrados = jogosFiltrados.filter(j => {
        if (query.roundFrom && j.round != null && j.round < query.roundFrom) return false
        if (query.roundTo && j.round != null && j.round > query.roundTo) return false
        return true
      })
    }

    if (query.months) {
      const allowedMonths = query.months.split(',').map(Number)
      jogosFiltrados = jogosFiltrados.filter(j => {
        const month = new Date(j.utcDate).getMonth() + 1
        return allowedMonths.includes(month)
      })
    }

    let homeMatches = jogosFiltrados
    let awayMatches = jogosFiltrados

    if (query.mandoContext === 'CASA_VISITANTE' || !query.mandoContext) {
      homeMatches = jogosFiltrados.filter(j => j.homeTeamId === homeTeam.id)
      awayMatches = jogosFiltrados.filter(j => j.awayTeamId === awayTeam.id)
    }

    const homeStats = buildTeamMatchStats(homeTeam.id, homeTeam.name, homeMatches)
    const awayStats = buildTeamMatchStats(awayTeam.id, awayTeam.name, awayMatches)

    return NextResponse.json({
      data: {
        homeStats,
        awayStats,
      },
    })
  } catch (error) {
    console.error('[GET /api/ligas/[slug]/estatisticas]', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
