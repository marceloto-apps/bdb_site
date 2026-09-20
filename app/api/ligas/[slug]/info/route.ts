import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { calcularMediasLiga } from '@/lib/analytics'
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

    // Contar total de times da temporada ativa
    const totalTimes = await prisma.teamSeason.count({
      where: { seasonId: activeSeason.id },
    })

    // Buscar todas as partidas finalizadas da temporada ativa
    const matches = await prisma.match.findMany({
      where: {
        seasonId: activeSeason.id,
        status: 'FINISHED',
        fthg: { not: null },
        ftag: { not: null },
        utcDate: getSeasonDateFilter(activeSeason.year),
      },
    })

    const totalJogos = matches.length

    const medias = { muH: null as number | null, muA: null as number | null }
    const insuficiente = totalJogos < 20

    if (!insuficiente) {
      // Garantir que não são nulos para o TS
      const jogosParaMedias = matches.map((m) => ({
        ...m,
        fthg: m.fthg!,
        ftag: m.ftag!,
      }))
      const mediasCalc = calcularMediasLiga(jogosParaMedias as any)
      medias.muH = mediasCalc.muH
      medias.muA = mediasCalc.muA
    }

    return NextResponse.json({
      data: {
        id: competition.id,
        name: competition.name,
        slug: competition.slug,
        country: competition.country,
        logoUrl: (competition as any).logoUrl,
        temporada: {
          id: activeSeason.id,
          year: activeSeason.year,
          startDate: activeSeason.startDate,
          endDate: activeSeason.endDate,
        },
        totalTimes,
        totalJogos,
        medias,
        insuficiente,
      },
    })
  } catch (error) {
    console.error('[GET /api/ligas/[slug]/info]', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
