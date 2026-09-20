import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { getSeasonDateFilter } from '@/lib/utils/season-filter'

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const { slug } = params

    const { isLeagueAccessible } = await import('@/lib/auth/free-leagues')
    const { hasVipAccess } = await import('@/lib/auth/check-access')
    const hasAccess = await hasVipAccess(session.user.id)
    if (!isLeagueAccessible(slug, hasAccess)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Acesso VIP necessário.' },
        { status: 403 }
      )
    }

    const competition = await prisma.competition.findUnique({
      where: { slug },
      include: {
        seasons: {
          where: { isCurrent: true },
        },
      },
    })

    if (!competition) {
      return NextResponse.json(
        { error: 'LEAGUE_NOT_FOUND', message: 'Liga não encontrada' },
        { status: 404 }
      )
    }

    const activeSeason = competition.seasons[0]
    if (!activeSeason) {
      return NextResponse.json(
        { error: 'NO_ACTIVE_SEASON', message: 'Nenhuma temporada ativa encontrada' },
        { status: 404 }
      )
    }

    // Buscar times que realmente jogaram na temporada atual
    // (não confiar em TeamSeason pois pode conter times de temporadas anteriores)
    const partidas = await prisma.match.findMany({
      where: {
        seasonId: activeSeason.id,
        status: 'FINISHED',
        utcDate: getSeasonDateFilter(activeSeason.year),
      },
      select: {
        homeTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      },
    })

    const timesMap = new Map<string, { id: string; name: string; shortName: string | null; logoUrl: string | null }>()
    partidas.forEach(p => {
      if (!timesMap.has(p.homeTeam.id)) timesMap.set(p.homeTeam.id, p.homeTeam)
      if (!timesMap.has(p.awayTeam.id)) timesMap.set(p.awayTeam.id, p.awayTeam)
    })

    const times = Array.from(timesMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ data: times })
  } catch (error) {
    console.error('[GET /api/ligas/[slug]/times]', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
