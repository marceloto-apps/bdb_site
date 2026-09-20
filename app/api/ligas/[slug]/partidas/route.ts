import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { partidasQuerySchema } from '@/lib/validations/liga'
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

    const { searchParams } = new URL(req.url)
    const queryResult = partidasQuerySchema.safeParse(Object.fromEntries(searchParams))
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

    // Montar WHERE
    const whereClause: any = {
      seasonId: activeSeason.id,
      status: 'FINISHED',
      fthg: { not: null },
      ftag: { not: null },
      utcDate: getSeasonDateFilter(activeSeason.year),
    }

    // Aqui usamos uma lógica simples: se for um confronto, tem ambos.
    // Se for um time só e mando = ambos, o frontend deve enviar apenas um deles, 
    // ou a gente trata de outra forma. Seguindo a regra:
    if (query.homeTeamId && query.awayTeamId) {
      whereClause.homeTeamId = query.homeTeamId
      whereClause.awayTeamId = query.awayTeamId
    } else if (query.homeTeamId) {
      // Se tiver só homeTeamId, podemos usar o mando
      if (query.mando === 'casa') {
        whereClause.homeTeamId = query.homeTeamId
      } else if (query.mando === 'fora') {
        // Isso seria meio estranho (homeTeamId contendo o ID do visitante?),
        // mas vamos aplicar o que faz sentido
        whereClause.awayTeamId = query.homeTeamId
      } else {
        whereClause.OR = [
          { homeTeamId: query.homeTeamId },
          { awayTeamId: query.homeTeamId },
        ]
      }
    } else if (query.awayTeamId) {
      if (query.mando === 'casa') {
        whereClause.homeTeamId = query.awayTeamId
      } else if (query.mando === 'fora') {
        whereClause.awayTeamId = query.awayTeamId
      } else {
        whereClause.OR = [
          { homeTeamId: query.awayTeamId },
          { awayTeamId: query.awayTeamId },
        ]
      }
    }

    if (query.roundFrom || query.roundTo) {
      whereClause.round = {}
      if (query.roundFrom) whereClause.round.gte = query.roundFrom
      if (query.roundTo) whereClause.round.lte = query.roundTo
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        homeTeam: { select: { name: true, shortName: true } },
        awayTeam: { select: { name: true, shortName: true } },
        odds: {
          where: {
            // Buscando bet365 isSharp=false/true para usar os odds (maior cobertura)
            bookmaker: {
              name: 'bet365',
            },
            market: { key: 'match_odds' },
          },
        },
      },
      orderBy: { utcDate: 'asc' },
    })

    // Filtros em memória
    let filteredMatches = matches

    // Filtro de meses
    if (query.months) {
      const allowedMonths = query.months.split(',').map(Number)
      filteredMatches = filteredMatches.filter((m) => {
        const month = new Date(m.utcDate).getMonth() + 1 // getMonth é 0-indexed
        return allowedMonths.includes(month)
      })
    }

    // Filtro de odds - suporte a faixas não-contíguas
    const parseFaixas = (csv: string) =>
      csv.split(',').map(f => {
        const [min, max] = f.split('-').map(Number)
        return { min, max }
      })

    const faixasCasa = query.oddsCasaFaixas ? parseFaixas(query.oddsCasaFaixas) : null
    const faixasVis = query.oddsVisFaixas ? parseFaixas(query.oddsVisFaixas) : null

    if (faixasCasa || faixasVis) {
      filteredMatches = filteredMatches.filter((m) => {
        if (faixasCasa) {
          const oddCasa = m.odds.find(o => o.selection === 'home')?.odds
          if (oddCasa && !faixasCasa.some(f => oddCasa >= f.min && oddCasa <= f.max)) return false
        }
        if (faixasVis) {
          const oddVis = m.odds.find(o => o.selection === 'away')?.odds
          if (oddVis && !faixasVis.some(f => oddVis >= f.min && oddVis <= f.max)) return false
        }
        return true
      })
    }

    // Remover odds do payload final para economizar banda, se desejar (ou enviar se for usado)
    const resultData = filteredMatches.map(m => {
      const { odds, ...rest } = m;
      return {
        ...rest,
        // Você pode incluir as odds de fechamento se forem úteis na UI
        oddHome: odds.find((o: any) => o.selection === 'home')?.odds ?? null,
        oddDraw: odds.find((o: any) => o.selection === 'draw')?.odds ?? null,
        oddAway: odds.find((o: any) => o.selection === 'away')?.odds ?? null,
      }
    })

    return NextResponse.json({
      data: resultData,
      meta: { total: resultData.length },
    })
  } catch (error) {
    console.error('[GET /api/ligas/[slug]/partidas]', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
