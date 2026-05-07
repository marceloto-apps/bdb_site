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
    if (!session?.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Autenticação necessária' },
        { status: 401 }
      )
    }

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

    // Buscar partidas finalizadas com odds Pinnacle
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
            bookmaker: { name: 'Pinnacle' }, // ou isSharp: true
            market: { key: 'match_odds' }
          }
        }
      }
    })

    const jogosComOdds = partidas.map(p => {
      let ftr = 'D'
      if (p.fthg! > p.ftag!) ftr = 'H'
      else if (p.ftag! > p.fthg!) ftr = 'A'

      const oddHome = p.odds.find((o: any) => o.selection === 'home')?.odds
      const oddDraw = p.odds.find((o: any) => o.selection === 'draw')?.odds
      const oddAway = p.odds.find((o: any) => o.selection === 'away')?.odds

      return {
        fthg: p.fthg!,
        ftag: p.ftag!,
        ftr,
        oddHome,
        oddDraw,
        oddAway
      }
    }).filter(j => j.oddHome && j.oddDraw && j.oddAway) // Apenas jogos com odds válidas

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
