import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { oddsMercadoQuerySchema } from "@/lib/validations/odds-mercado"

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const result = oddsMercadoQuerySchema.safeParse(searchParams)

    if (!result.success) {
      return NextResponse.json(
        { message: "Parâmetros inválidos", errors: result.error.format() },
        { status: 400 }
      )
    }

    const { homeTeamId, awayTeamId, bookmaker: bookmakerSlug } = result.data

    // 1. Validar se o bookmaker existe na tabela
    const bookmaker = await prisma.bookmaker.findUnique({
      where: { slug: bookmakerSlug },
    })

    if (!bookmaker) {
      return NextResponse.json(
        { message: `Bookmaker '${bookmakerSlug}' não encontrado` },
        { status: 404 }
      )
    }

    // 2. Buscar a temporada atual da liga
    const competition = await prisma.competition.findUnique({
      where: { slug: params.slug },
      include: {
        seasons: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    })

    if (!competition || competition.seasons.length === 0) {
      return NextResponse.json(
        { message: "Liga ou temporada ativa não encontrada" },
        { status: 404 }
      )
    }

    const season = competition.seasons[0]

    // 3. Buscar a partida correspondente apenas SCHEDULED (mais próxima)
    const match = await prisma.match.findFirst({
      where: {
        seasonId: season.id,
        homeTeamId,
        awayTeamId,
        status: "SCHEDULED",
      },
      orderBy: {
        utcDate: "asc",
      },
    })

    if (!match) {
      return NextResponse.json(
        { data: null, message: "Nenhuma partida agendada encontrada" },
        { status: 200 } // Retorna 200 com data null para lidar no frontend
      )
    }

    // 4. Buscar Odds
    // Primeiro tenta buscar do histórico em tempo real (OddsMovement) que é onde ficam as atualizações recentes
    const oddsMovements = await prisma.oddsMovement.findMany({
      where: {
        matchId: match.id,
        bookmakerId: bookmaker.id,
      },
      select: {
        id: true,
        selection: true,
        line: true,
        odds: true,
        market: true,
      },
      orderBy: {
        capturedAt: "desc",
      },
    })

    let oddsToProcess: any[] = []

    if (oddsMovements.length > 0) {
      oddsToProcess = oddsMovements
    } else {
      // Fallback para MatchOdds
      const odds = await prisma.matchOdds.findMany({
        where: {
          matchId: match.id,
          bookmakerId: bookmaker.id,
        },
        include: {
          market: true,
        },
      })
      oddsToProcess = odds
    }

    if (oddsToProcess.length === 0) {
      return NextResponse.json(
        { data: null, message: "Nenhuma odd encontrada para este confronto neste bookmaker" },
        { status: 200 }
      )
    }

    // 5. Agrupar odds
    const x1x2 = { home: null as number | null, draw: null as number | null, away: null as number | null }
    const btts = { yes: null as number | null, no: null as number | null }
    const overUnder: Record<string, { over: number | null, under: number | null }> = {}

    const latestOdds = new Map<string, any>()
    
    for (const odd of oddsToProcess) {
      const key = `${odd.market.key}-${odd.selection}-${odd.line || ''}`
      const existing = latestOdds.get(key)
      
      // Se for OddsMovement, a ordenação DESC por capturedAt garante que o primeiro é o mais recente.
      if (!existing) {
        latestOdds.set(key, odd)
      } else if (existing.oddsType === 'PREMATCH_OPENING' && odd.oddsType === 'PREMATCH_CLOSING') {
        // Fallback apenas útil para MatchOdds
        latestOdds.set(key, odd)
      }
    }

    for (const odd of Array.from(latestOdds.values())) {
      const value = odd.odds >= 1.01 ? odd.odds : null
      
      const marketKey = odd.market?.key?.toLowerCase()
      const sel = odd.selection?.toLowerCase()
      
      if (marketKey === "1x2" || marketKey === "match_odds") {
        if (sel === "home") x1x2.home = value
        if (sel === "draw") x1x2.draw = value
        if (sel === "away") x1x2.away = value
      } else if (marketKey === "btts") {
        if (sel === "yes") btts.yes = value
        if (sel === "no") btts.no = value
      } else if (marketKey === "over_under" || marketKey === "total_goals") {
        const line = odd.line?.toString()
        if (line) {
          if (!overUnder[line]) overUnder[line] = { over: null, under: null }
          if (sel === "over") overUnder[line].over = value
          if (sel === "under") overUnder[line].under = value
        }
      }
    }

    // Filtrar apenas over_under que tenham as duas seleções se quisermos, mas o schema já preenche.
    // E só as linhas solicitadas 0.5 a 4.5 ou apenas as disponíveis no DB.
    const requestedLines = ["0.5", "1.5", "2.5", "3.5", "4.5"]
    const finalOverUnder: Record<string, { over: number | null, under: number | null }> = {}
    for (const line of requestedLines) {
      if (overUnder[line]) {
        finalOverUnder[line] = overUnder[line]
      } else {
        finalOverUnder[line] = { over: null, under: null }
      }
    }

    return NextResponse.json({
      data: {
        matchId: match.id,
        utcDate: match.utcDate,
        round: match.round,
        status: match.status,
        bookmaker: bookmaker.slug,
        mercados: {
          x1x2,
          btts,
          overUnder: finalOverUnder,
        },
      }
    })

  } catch (error: any) {
    console.error("[ODDS_MERCADO_GET]", error)
    return NextResponse.json({ message: "Erro interno do servidor", details: error?.message, stack: error?.stack }, { status: 500 })
  }
}
