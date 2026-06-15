import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { calcularMapaValor } from '@/lib/analytics'
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

    const isFree = slug === 'brasileirao-serie-a'
    if (!isFree) {
      const { hasVipAccess } = await import('@/lib/auth/check-access')
      const hasAccess = await hasVipAccess(session.user.id)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Acesso VIP necessário.' },
          { status: 403 }
        )
      }
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
      return NextResponse.json({ error: 'LEAGUE_NOT_FOUND', message: 'Liga não encontrada' }, { status: 404 })
    }

    const activeSeason = competition.seasons[0]
    if (!activeSeason) {
      return NextResponse.json({ error: 'NO_ACTIVE_SEASON', message: 'Nenhuma temporada ativa encontrada' }, { status: 404 })
    }

    // Buscar partidas finalizadas com odds Bet365 para 1x2, BTTS e Over/Under 2.5
    const partidas = await prisma.match.findMany({
      where: {
        seasonId: activeSeason.id,
        status: 'FINISHED',
        fthg: { not: null },
        ftag: { not: null },
        utcDate: getSeasonDateFilter(activeSeason.year),
      },
      include: {
        odds: {
          where: {
            bookmaker: {
              OR: [
                { slug: 'bet365' },
                { name: 'Bet365' }
              ]
            },
            OR: [
              { market: { key: { in: ['match_odds', '1x2'] } } },
              { market: { key: 'btts' } },
              {
                market: { key: { in: ['over_under', 'total_goals', 'total_goals_2_5'] } },
                line: 2.5
              }
            ]
          },
          include: {
            market: true
          }
        }
      }
    })

    const jogosComOdds = partidas.map(p => {
      let ftr: 'H' | 'D' | 'A' = 'D'
      if (p.fthg! > p.ftag!) ftr = 'H'
      else if (p.ftag! > p.fthg!) ftr = 'A'

      const oddHome = p.odds.find((o: any) => (o.market.key === 'match_odds' || o.market.key === '1x2') && o.selection === 'home')?.odds || null
      const oddDraw = p.odds.find((o: any) => (o.market.key === 'match_odds' || o.market.key === '1x2') && o.selection === 'draw')?.odds || null
      const oddAway = p.odds.find((o: any) => (o.market.key === 'match_odds' || o.market.key === '1x2') && o.selection === 'away')?.odds || null

      const oddBttsYes = p.odds.find((o: any) => o.market.key === 'btts' && o.selection === 'yes')?.odds || null
      const oddBttsNo = p.odds.find((o: any) => o.market.key === 'btts' && o.selection === 'no')?.odds || null

      const oddOver25 = p.odds.find((o: any) => ['over_under', 'total_goals', 'total_goals_2_5'].includes(o.market.key) && o.line === 2.5 && o.selection === 'over')?.odds || null
      const oddUnder25 = p.odds.find((o: any) => ['over_under', 'total_goals', 'total_goals_2_5'].includes(o.market.key) && o.line === 2.5 && o.selection === 'under')?.odds || null

      return {
        fthg: p.fthg!,
        ftag: p.ftag!,
        ftr,
        oddHome,
        oddDraw,
        oddAway,
        oddBttsYes,
        oddBttsNo,
        oddOver25,
        oddUnder25
      }
    }).filter(j => j.oddHome !== null || j.oddBttsYes !== null || j.oddOver25 !== null)

    const mapaValor = calcularMapaValor(jogosComOdds as any)

    return NextResponse.json({ data: mapaValor })
  } catch (error) {
    console.error('[GET /api/ligas/[slug]/mapa-valor]', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
