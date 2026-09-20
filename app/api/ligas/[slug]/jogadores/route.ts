import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { jogadoresQuerySchema } from '@/lib/validations/liga'
import { getSeasonDateFilter } from '@/lib/utils/season-filter'
import {
  buildTeamSectorStats,
  calculateConfrontationCoverage
} from '@/lib/analytics/estatisticas-jogadores-builder'

/**
 * GET /api/ligas/[slug]/jogadores
 * 
 * Retorna a análise agregada de jogadores por setor para as equipes informadas.
 * Parâmetros de consulta (Query params):
 *  - temporada (obrigatório, ano da liga ex: "2024")
 *  - rodada ou dataPartida (ao menos um é obrigatório)
 *  - time (opcional, ID do time ou IDs separados por vírgula para confronto ex: "id1,id2")
 *  - setor (opcional, 'GOL' | 'DEF' | 'MEI' | 'ATA')
 */
export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // 1. Validar autenticação do usuário
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
    
    // 2. Validar query params com Zod
    const queryResult = jogadoresQuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'INVALID_QUERY', message: 'Parâmetros inválidos', details: queryResult.error.format() },
        { status: 400 }
      )
    }

    const query = queryResult.data
    const { temporada, rodada, dataPartida, time, setor } = query

    // 3. Buscar competição e verificar existência da temporada ativa
    const competition = await prisma.competition.findUnique({
      where: { slug },
      include: {
        seasons: {
          where: { year: temporada, isCurrent: true }
        }
      }
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
        { error: 'NO_ACTIVE_SEASON', message: 'Temporada não encontrada ou inativa para o ano fornecido' },
        { status: 404 }
      )
    }

    // 4. Mapear os IDs dos times (se fornecidos)
    const teamIds = time ? time.split(',').filter(Boolean) : []
    const homeTeamId = teamIds[0] || null
    const awayTeamId = teamIds[1] || null

    // Buscar informações básicas dos times (nome e logo)
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } }
    })
    const homeTeam = teams.find(t => t.id === homeTeamId) || null
    const awayTeam = teams.find(t => t.id === awayTeamId) || null

    // 5. Definir os filtros de corte temporal e precedência
    const parsedCutoffDate = dataPartida ? new Date(dataPartida) : undefined
    const cutoff = parsedCutoffDate
      ? { dataPartida: parsedCutoffDate }
      : { rodada }

    const seasonDateFilter = getSeasonDateFilter(activeSeason.year)

    // Montar a query Prisma otimizada em lote (anti-N+1)
    const whereClause: any = {
      match: {
        seasonId: activeSeason.id,
        status: 'FINISHED',
        utcDate: parsedCutoffDate
          ? { lt: parsedCutoffDate, gte: seasonDateFilter.gte }
          : seasonDateFilter,
        ...(rodada && !parsedCutoffDate
          ? { round: { lt: rodada } }
          : {}
        )
      }
    }

    // Se informou times, limita a busca a esses times
    if (teamIds.length > 0) {
      whereClause.teamId = { in: teamIds }
    }

    // 6. Buscar PlayerMatchStats consolidados do banco
    const rawMatchStats = await prisma.playerMatchStats.findMany({
      where: whereClause,
      include: {
        player: true,
        match: {
          include: {
            homeTeam: { select: { name: true } },
            awayTeam: { select: { name: true } }
          }
        }
      }
    })

    // Calcular a cobertura sobre todo o conjunto de dados retornado do confronto
    const coverage = calculateConfrontationCoverage(rawMatchStats)

    // Separar os registros por time para os builders
    const homeMatchStats = rawMatchStats.filter(s => s.teamId === homeTeamId)
    const awayMatchStats = rawMatchStats.filter(s => s.teamId === awayTeamId)

    // Rodar os builders de estatísticas setoriais
    const homeStats = homeTeam
      ? buildTeamSectorStats(homeTeam.id, homeTeam.name, homeTeam.logoUrl, homeMatchStats, cutoff)
      : null

    const awayStats = awayTeam
      ? buildTeamSectorStats(awayTeam.id, awayTeam.name, awayTeam.logoUrl, awayMatchStats, cutoff)
      : null

    // Se houver filtro de setor no query param, filtra os jogadores retornados
    if (setor && homeStats) {
      homeStats.players = homeStats.players.filter(p => p.sector === setor)
    }
    if (setor && awayStats) {
      awayStats.players = awayStats.players.filter(p => p.sector === setor)
    }

    return NextResponse.json({
      data: {
        home: homeStats,
        away: awayStats,
        coverage
      }
    })
  } catch (error) {
    console.error('[GET /api/ligas/[slug]/jogadores]', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
