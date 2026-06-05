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

    // 1. Validar se o bookmaker existe
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

    // 3. Buscar a partida correspondente (SCHEDULED)
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
        { status: 200 }
      )
    }

    // 4. Buscar histórico total de movimentação de odds
    const oddsMovements = await prisma.oddsMovement.findMany({
      where: {
        matchId: match.id,
        bookmakerId: bookmaker.id,
      },
      include: {
        market: true,
      },
      orderBy: {
        capturedAt: "asc",
      },
    })

    // 5. Agrupar dados por timestamp
    const x1x2Group: Record<string, { capturedAt: string; home: number | null; draw: number | null; away: number | null }> = {}
    const bttsGroup: Record<string, { capturedAt: string; yes: number | null; no: number | null }> = {}
    const ouGroup: Record<string, Record<string, { capturedAt: string; over: number | null; under: number | null }>> = {}

    for (const mov of oddsMovements) {
      const ts = mov.capturedAt.toISOString()
      const mKey = mov.market.key.toLowerCase()
      const sel = mov.selection.toLowerCase()
      const val = mov.odds >= 1.01 ? mov.odds : null

      if (mKey === "1x2" || mKey === "match_odds") {
        if (!x1x2Group[ts]) {
          x1x2Group[ts] = { capturedAt: ts, home: null, draw: null, away: null }
        }
        if (sel === "home") x1x2Group[ts].home = val
        if (sel === "draw") x1x2Group[ts].draw = val
        if (sel === "away") x1x2Group[ts].away = val
      } else if (mKey === "btts") {
        if (!bttsGroup[ts]) {
          bttsGroup[ts] = { capturedAt: ts, yes: null, no: null }
        }
        if (sel === "yes") bttsGroup[ts].yes = val
        if (sel === "no") bttsGroup[ts].no = val
      } else if (mKey === "over_under" || mKey === "total_goals" || mKey === "total_goals_2_5") {
        const lineStr = mov.line?.toString()
        if (lineStr) {
          if (!ouGroup[lineStr]) {
            ouGroup[lineStr] = {}
          }
          if (!ouGroup[lineStr][ts]) {
            ouGroup[lineStr][ts] = { capturedAt: ts, over: null, under: null }
          }
          if (sel === "over") ouGroup[lineStr][ts].over = val
          if (sel === "under") ouGroup[lineStr][ts].under = val
        }
      }
    }

    // Converter para arrays ordenados
    const x1x2 = Object.values(x1x2Group).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
    const btts = Object.values(bttsGroup).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
    const overUnder: Record<string, Array<{ capturedAt: string; over: number | null; under: number | null }>> = {}
    for (const line of Object.keys(ouGroup)) {
      overUnder[line] = Object.values(ouGroup[line]).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
    }

    // Executar forward fill para suavizar linhas com valores ausentes
    forwardFillX1X2(x1x2)
    forwardFillBtts(btts)
    for (const line of Object.keys(overUnder)) {
      forwardFillOU(overUnder[line])
    }

    return NextResponse.json({
      data: {
        matchId: match.id,
        bookmaker: bookmaker.slug,
        history: {
          x1x2,
          btts,
          overUnder,
        }
      }
    })

  } catch (error: any) {
    console.error("[ODDS_HISTORICO_GET]", error)
    return NextResponse.json({ message: "Erro interno do servidor", details: error?.message }, { status: 500 })
  }
}

// Funções auxiliares para forward fill
function forwardFillX1X2(arr: Array<{ capturedAt: string; home: number | null; draw: number | null; away: number | null }>) {
  let lastHome: number | null = null
  let lastDraw: number | null = null
  let lastAway: number | null = null
  for (const item of arr) {
    if (item.home !== null) lastHome = item.home
    else item.home = lastHome

    if (item.draw !== null) lastDraw = item.draw
    else item.draw = lastDraw

    if (item.away !== null) lastAway = item.away
    else item.away = lastAway
  }
}

function forwardFillBtts(arr: Array<{ capturedAt: string; yes: number | null; no: number | null }>) {
  let lastYes: number | null = null
  let lastNo: number | null = null
  for (const item of arr) {
    if (item.yes !== null) lastYes = item.yes
    else item.yes = lastYes

    if (item.no !== null) lastNo = item.no
    else item.no = lastNo
  }
}

function forwardFillOU(arr: Array<{ capturedAt: string; over: number | null; under: number | null }>) {
  let lastOver: number | null = null
  let lastUnder: number | null = null
  for (const item of arr) {
    if (item.over !== null) lastOver = item.over
    else item.over = lastOver

    if (item.under !== null) lastUnder = item.under
    else item.under = lastUnder
  }
}
