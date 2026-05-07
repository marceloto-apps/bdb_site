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

    // 4. Buscar MatchOdds
    const odds = await prisma.matchOdds.findMany({
      where: {
        matchId: match.id,
        bookmakerId: bookmaker.id,
      },
      include: {
        market: true,
      },
    })

    if (odds.length === 0) {
      return NextResponse.json(
        { data: null, message: "Nenhuma odd encontrada para este confronto neste bookmaker" },
        { status: 200 }
      )
    }

    // 5. Agrupar odds
    const x1x2 = { home: null as number | null, draw: null as number | null, away: null as number | null }
    const btts = { yes: null as number | null, no: null as number | null }
    const overUnder: Record<string, { over: number | null, under: number | null }> = {}

    // Pegar apenas PREMATCH_CLOSING preferencialmente, se não PREMATCH_OPENING
    // Vamos agrupar por market.key + selection
    const latestOdds = new Map<string, typeof odds[0]>()
    
    for (const odd of odds) {
      const key = `${odd.market.key}-${odd.selection}-${odd.line || ''}`
      const existing = latestOdds.get(key)
      if (!existing || (existing.oddsType === 'PREMATCH_OPENING' && odd.oddsType === 'PREMATCH_CLOSING')) {
        latestOdds.set(key, odd)
      }
    }

    for (const odd of Array.from(latestOdds.values())) {
      const value = odd.odds >= 1.01 ? odd.odds : null
      
      if (odd.market.key === "1x2") {
        if (odd.selection === "Home") x1x2.home = value
        if (odd.selection === "Draw") x1x2.draw = value
        if (odd.selection === "Away") x1x2.away = value
      } else if (odd.market.key === "btts") {
        if (odd.selection === "Yes") btts.yes = value
        if (odd.selection === "No") btts.no = value
      } else if (odd.market.key === "over_under") {
        const line = odd.line?.toString()
        if (line) {
          if (!overUnder[line]) overUnder[line] = { over: null, under: null }
          if (odd.selection === "Over") overUnder[line].over = value
          if (odd.selection === "Under") overUnder[line].under = value
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

  } catch (error) {
    console.error("[ODDS_MERCADO_GET]", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
