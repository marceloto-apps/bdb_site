import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { previsaoQuerySchema } from '@/lib/validations/liga'
import { getSeasonDateFilter } from '@/lib/utils/season-filter'
import { buildTeamMatchStats } from '@/lib/analytics/estatisticas-builder'
import { construirAmostraTime, temFiltroAtivo } from '@/lib/analytics/amostra'

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

    const { searchParams } = new URL(req.url)
    const queryResult = previsaoQuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'INVALID_QUERY', message: 'Parâmetros inválidos', details: queryResult.error.format() },
        { status: 400 }
      )
    }

    const query = queryResult.data

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

    const targetOddsType = query.profitOddsType === 'opening' ? 'PREMATCH_OPENING' : 'PREMATCH_CLOSING'

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
        // Base histórica da bet365: onde o Flashscore cobre a casa, estas linhas SÃO as dele
        // (`source = FLASHSCORE`) — o job flashscore-promote-historical do bdb_ingest
        // substitui as da TheStatsAPI em `MatchOdds`, porque a unique da tabela não deixa as
        // duas fontes conviverem na mesma casa. Nas ligas em que o Flashscore não cota a
        // bet365 (USL, J2, Rússia…), o histórico antigo segue aqui em vez de a amostra sumir.
        // Vêm os dois `oddsType`: a amostra é cortada pela odd de referência (fechamento, senão
        // abertura) e só o cálculo de profit usa o tipo escolhido no toggle — ver `paraProfit`.
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

    // Amostra de cada time sob os Filtros Avançados — mesma função usada em /previsao
    const contexto = query.mandoContext ?? 'CASA_VISITANTE'
    const amostraHome = construirAmostraTime(uniqueMatches, homeTeam.id, 'home', query, contexto)
    const amostraAway = construirAmostraTime(uniqueMatches, awayTeam.id, 'away', query, contexto)

    const paraProfit = (jogos: typeof uniqueMatches) =>
      jogos.map(j => ({ ...j, odds: j.odds.filter(o => o.oddsType === targetOddsType) }))

    const homeMatches = paraProfit(amostraHome.jogos)
    const awayMatches = paraProfit(amostraAway.jogos)

    const homeStats = buildTeamMatchStats(homeTeam.id, homeTeam.name, homeMatches)
    const awayStats = buildTeamMatchStats(awayTeam.id, awayTeam.name, awayMatches)

    return NextResponse.json({
      data: {
        homeStats,
        awayStats,
        amostra: {
          filtrosAtivos: temFiltroAtivo(query),
          contexto,
          home: amostraHome.resumo,
          away: amostraAway.resumo,
        },
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
