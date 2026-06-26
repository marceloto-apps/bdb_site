// app/api/backtest/run/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hasBacktestAccess } from '@/lib/auth/check-access'
import { auth } from '@/auth'
import { z } from 'zod'
import { gerarMatrizProjecao } from '@/lib/ferramentas/backtest/projections'
import { liquidarAposta } from '@/lib/ferramentas/backtest/settlement'
import { calcularKPIs } from '@/lib/ferramentas/backtest/kpis'
import { matchesOddRanges } from '@/lib/ferramentas/backtest/oddsFilter'

const backtestRunSchema = z.object({
  competitionId: z.string().optional().nullable(),
  competitionIds: z.array(z.string()).optional().nullable(),
  seasonId: z.string().optional().nullable(),
  seasonIds: z.array(z.string()).optional().nullable(),
  seasonYear: z.string().optional().nullable(),
  seasonYears: z.array(z.string()).optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  model: z.enum(["POISSON", "ZIP", "NB", "DIXON_COLES"]),
  lambdaMethod: z.enum(["MEDIA_SIMPLES", "FORCAS_RELATIVAS", "XG"]),
  minProbability: z.number().min(0).max(1),
  maxProbability: z.number().min(0).max(1).optional().nullable(),
  minOdd: z.number().optional().nullable(),
  maxOdd: z.number().optional().nullable(),
  market: z.enum(["1X2", "BTTS", "OVER_UNDER", "ASIAN_HANDICAP"]),
  betSide: z.enum(["HOME", "DRAW", "AWAY", "OVER", "UNDER", "YES", "NO"]),
  line: z.number().optional().nullable(),
  stake: z.number().default(100),
  oddsType: z.enum(["PREMATCH_OPENING", "PREMATCH_CLOSING"]).default("PREMATCH_CLOSING"),
  filterOddsType: z.enum(["PREMATCH_OPENING", "PREMATCH_CLOSING"]).default("PREMATCH_CLOSING"),
  windowSize: z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(40)]).nullable().optional(),
  criterion: z.enum(["VALUE_ONLY", "PROBABILITY_ONLY", "VALUE_AND_PROBABILITY"]).default("PROBABILITY_ONLY"),
  minEv: z.number().default(0),
  maxEv: z.number().optional().nullable(),
  filterOdds: z.object({
    homeRanges: z.array(z.string()).optional().nullable(),
    drawRanges: z.array(z.string()).optional().nullable(),
    awayRanges: z.array(z.string()).optional().nullable(),
    over25Ranges: z.array(z.string()).optional().nullable(),
    under25Ranges: z.array(z.string()).optional().nullable(),
  }).optional().nullable(),
}).refine(
  (data) => {
    if ((data.market === "OVER_UNDER" || data.market === "ASIAN_HANDICAP") && data.line == null) {
      return false
    }
    return true
  },
  {
    message: "A linha é obrigatória para os mercados Over/Under e Asian Handicap.",
    path: ["line"],
  }
)



function obterOddDeMercado(
  odds: any[],
  market: string,
  betSide: string,
  line: number | null,
  targetOddsType: string
): { odd: number; bookmakerName: string } | null {
  const selecionarOdd = (candidates: any[]) => {
    if (candidates.length === 0) return null
    const b365 = candidates.find(
      (o) => o.bookmaker.slug === "bet365" || o.bookmaker.name.toLowerCase() === "bet365"
    )
    const chosen = b365 || candidates[0]
    return { odd: chosen.odds, bookmakerName: chosen.bookmaker.name }
  }

  const oddsFiltradas = odds.filter((o) => o.oddsType === targetOddsType)

  if (market === "1X2") {
    const selectionName = betSide.toLowerCase() // home, draw, away
    const candidates = oddsFiltradas.filter(
      (o) =>
        (o.market.key === "match_odds" || o.market.key === "1x2") &&
        o.selection.toLowerCase() === selectionName
    )
    return selecionarOdd(candidates)
  } else if (market === "BTTS") {
    const selectionName = betSide.toLowerCase() // yes, no
    const candidates = oddsFiltradas.filter(
      (o) =>
        o.market.key === "btts" &&
        o.selection.toLowerCase() === selectionName
    )
    return selecionarOdd(candidates)
  } else if (market === "OVER_UNDER") {
    const selectionName = betSide.toLowerCase() // over, under
    if (line !== null) {
      const candidates = oddsFiltradas.filter(
        (o) =>
          ((o.market.key === "over_under" || o.market.key === "total_goals" || o.market.key === `total_goals_${line.toString().replace(".", "_")}`) &&
            o.line !== null && Math.abs(o.line - line) < 1e-4 &&
            o.selection.toLowerCase() === selectionName) ||
          (o.market.key.endsWith(line.toString().replace(".", "_")) &&
            o.selection.toLowerCase() === selectionName)
      )
      return selecionarOdd(candidates)
    }
  } else if (market === "ASIAN_HANDICAP") {
    const selectionName = betSide.toLowerCase() // home, away
    if (line !== null) {
      const candidates = oddsFiltradas.filter(
        (o) =>
          o.market.key === "asian_handicap" &&
          o.line !== null &&
          Math.abs(o.line - line) < 1e-4 &&
          o.selection.toLowerCase() === selectionName
      )
      return selecionarOdd(candidates)
    }
  }
  return null
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const hasAccess = await hasBacktestAccess(session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'UNAUTHORIZED_PLAN' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = backtestRunSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_PARAMETERS', details: parsed.error.format() }, { status: 400 })
    }

    const {
      competitionId,
      competitionIds: rawCompetitionIds,
      seasonId,
      seasonIds: rawSeasonIds,
      seasonYear,
      seasonYears: rawSeasonYears,
      startDate,
      endDate,
      model,
      lambdaMethod,
      minProbability,
      maxProbability,
      minOdd,
      maxOdd,
      market,
      betSide,
      line,
      stake,
      oddsType,
      filterOddsType,
      windowSize,
      criterion,
      minEv,
      maxEv,
      filterOdds,
    } = parsed.data

    // Resolver os IDs de competições a serem simuladas
    let competitionIds: string[] = []
    if (rawCompetitionIds && rawCompetitionIds.length > 0) {
      competitionIds = rawCompetitionIds
    } else if (competitionId) {
      competitionIds = [competitionId]
    }

    if (competitionIds.length === 0) {
      return NextResponse.json({ error: 'Nenhuma competição selecionada.' }, { status: 400 })
    }

    // Resolver seasonIds/seasonYears para compatibilidade legada
    let seasonIds: string[] = []
    if (rawSeasonIds && rawSeasonIds.length > 0) {
      seasonIds = rawSeasonIds
    } else if (seasonId && seasonId !== 'ALL_SEASONS') {
      seasonIds = [seasonId]
    }

    let seasonYears: string[] = []
    if (rawSeasonYears && rawSeasonYears.length > 0) {
      seasonYears = rawSeasonYears
    } else if (seasonYear && seasonYear !== 'ALL_SEASONS') {
      seasonYears = [seasonYear]
    }

    // Montar filtros de busca das partidas
    const matchWhere: any = {
      season: {
        competitionId: { in: competitionIds },
        competition: {
          type: 'LEAGUE',
        },
      },
      status: "FINISHED",
    }

    if (seasonIds.length > 0) {
      matchWhere.seasonId = { in: seasonIds }
    } else if (seasonYears.length > 0) {
      matchWhere.season = {
        competitionId: { in: competitionIds },
        year: { in: seasonYears },
        competition: {
          type: 'LEAGUE',
        },
      }
    }

    if (startDate || endDate) {
      matchWhere.utcDate = {}
      if (startDate) matchWhere.utcDate.gte = new Date(startDate)
      if (endDate) matchWhere.utcDate.lte = new Date(endDate)
    }

    // Carregar partidas com snapshots, médias móveis e odds
    const matches = await prisma.match.findMany({
      where: matchWhere,
      include: {
        leagueSnapshot: true,
        teamStats: {
          where: {
            window: windowSize === undefined ? null : windowSize,
          },
        },
        odds: {
          where: {
            oddsType: {
              in: [oddsType, filterOddsType]
            },
          },
          include: {
            market: true,
            bookmaker: true,
          },
        },
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        season: {
          select: {
            year: true,
            competition: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        utcDate: "asc",
      },
    })

    const betsPlaced: any[] = []
    const betsInputsForKPIs: any[] = []
    let cumulativePnL = 0
    let skippedNoOdds = 0
    let skippedMissingStats = 0

    // Processar cada partida e avaliar
    for (const match of matches) {
      // Filtragem por faixas de odds de confronto
      if (filterOdds) {
        if (filterOdds.homeRanges && filterOdds.homeRanges.length > 0) {
          const homeOdd = obterOddDeMercado(match.odds, "1X2", "HOME", null, filterOddsType)?.odd
          if (!matchesOddRanges(homeOdd, filterOdds.homeRanges)) continue
        }
        if (filterOdds.drawRanges && filterOdds.drawRanges.length > 0) {
          const drawOdd = obterOddDeMercado(match.odds, "1X2", "DRAW", null, filterOddsType)?.odd
          if (!matchesOddRanges(drawOdd, filterOdds.drawRanges)) continue
        }
        if (filterOdds.awayRanges && filterOdds.awayRanges.length > 0) {
          const awayOdd = obterOddDeMercado(match.odds, "1X2", "AWAY", null, filterOddsType)?.odd
          if (!matchesOddRanges(awayOdd, filterOdds.awayRanges)) continue
        }
        if (filterOdds.over25Ranges && filterOdds.over25Ranges.length > 0) {
          const overOdd = obterOddDeMercado(match.odds, "OVER_UNDER", "OVER", 2.5, filterOddsType)?.odd
          if (!matchesOddRanges(overOdd, filterOdds.over25Ranges)) continue
        }
        if (filterOdds.under25Ranges && filterOdds.under25Ranges.length > 0) {
          const underOdd = obterOddDeMercado(match.odds, "OVER_UNDER", "UNDER", 2.5, filterOddsType)?.odd
          if (!matchesOddRanges(underOdd, filterOdds.under25Ranges)) continue
        }
      }

      const snapshot = match.leagueSnapshot
      if (!snapshot) {
        skippedMissingStats++
        continue // Pula se não houver snapshot temporal da liga
      }

      const statsHome = match.teamStats.find((s: any) => s.teamId === match.homeTeamId)
      const statsAway = match.teamStats.find((s: any) => s.teamId === match.awayTeamId)

      if (!statsHome || !statsAway) {
        skippedMissingStats++
        continue // Pula se faltar estatísticas pré-jogo dos times
      }
      if (
        statsHome.avgGoalsScored === null ||
        statsHome.avgGoalsConceded === null ||
        statsAway.avgGoalsScored === null ||
        statsAway.avgGoalsConceded === null
      ) {
        skippedMissingStats++
        continue
      }

      // Procurar odds do bookmaker no mercado escolhido para a simulação/resultado
      const oddData = obterOddDeMercado(match.odds, market, betSide, line ?? null, oddsType)
      if (!oddData) {
        skippedNoOdds++
        continue // Pula se não houver cotação válida para a linha
      }
      const oddVal = oddData.odd

      // Verificar restrição de Odd
      if (minOdd && oddVal < minOdd) continue
      if (maxOdd && oddVal > maxOdd) continue

      // Projetar matriz 11x11 de gols
      const homeStatsInput = {
        avgGoalsScored: statsHome.avgGoalsScored,
        avgGoalsConceded: statsHome.avgGoalsConceded,
        xg: statsHome.xg,
      }
      const awayStatsInput = {
        avgGoalsScored: statsAway.avgGoalsScored,
        avgGoalsConceded: statsAway.avgGoalsConceded,
        xg: statsAway.xg,
      }
      const leagueParamsInput = {
        muH: snapshot.muH,
        muA: snapshot.muA,
        varH: snapshot.varH,
        varA: snapshot.varA,
        piH: snapshot.piH,
        piA: snapshot.piA,
        rho: snapshot.rho,
        muH_xg: snapshot.muH_xg,
        muA_xg: snapshot.muA_xg,
      }

      const { matriz } = gerarMatrizProjecao({
        model,
        lambdaMethod,
        homeStats: homeStatsInput,
        awayStats: awayStatsInput,
        leagueParams: leagueParamsInput,
      })

      // Calcular probabilidade projetada do modelo e EV usando liquidação teórica em cada score da matriz
      let pWin = 0
      let pLoss = 0
      let pRefund = 0
      let expectedPayout = 0

      for (let h = 0; h <= 10; h++) {
        for (let a = 0; a <= 10; a++) {
          const prob = matriz[h][a]
          if (prob === 0) continue

          const cellRes = liquidarAposta({
            market,
            betSide,
            line: line ?? 0,
            stake: 1.0,
            odd: oddVal,
            fthg: h,
            ftag: a,
          })

          if (cellRes.outcome === "WIN" || cellRes.outcome === "HALF_WIN") {
            pWin += prob
          } else if (cellRes.outcome === "LOSS" || cellRes.outcome === "HALF_LOSS") {
            pLoss += prob
          } else if (cellRes.outcome === "REFUND") {
            pRefund += prob
          }

          const payout = cellRes.pnl + 1.0
          expectedPayout += prob * payout
        }
      }

      const ev = expectedPayout - 1.0
      // Proporção de ganho dada pela distribuição excluindo reembolsos
      const projProb = pRefund > 0.99 ? 0 : pWin / (1.0 - pRefund)

      // Validar critérios de entrada
      let triggerAposta = false
      if (criterion === "PROBABILITY_ONLY") {
        triggerAposta = projProb >= minProbability && (maxProbability == null || projProb <= maxProbability)
      } else if (criterion === "VALUE_ONLY") {
        triggerAposta = ev >= minEv && (maxEv == null || ev <= maxEv)
      } else if (criterion === "VALUE_AND_PROBABILITY") {
        triggerAposta = projProb >= minProbability && (maxProbability == null || projProb <= maxProbability) && ev >= minEv && (maxEv == null || ev <= maxEv)
      }

      if (!triggerAposta) continue

      // Executar liquidação contra o placar real do jogo
      if (match.fthg === null || match.ftag === null) continue
      const realSettlement = liquidarAposta({
        market,
        betSide,
        line: line ?? 0,
        stake,
        odd: oddVal,
        fthg: match.fthg,
        ftag: match.ftag,
      })

      cumulativePnL += realSettlement.pnl

      betsInputsForKPIs.push({
        outcome: realSettlement.outcome,
        pnl: realSettlement.pnl,
        stake,
      })

      betsPlaced.push({
        matchId: match.id,
        utcDate: match.utcDate,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        fthg: match.fthg,
        ftag: match.ftag,
        odd: oddVal,
        stake,
        bookmaker: oddData.bookmakerName,
        modelProb: Number(projProb.toFixed(4)),
        ev: Number(ev.toFixed(4)),
        outcome: realSettlement.outcome,
        pnl: realSettlement.pnl,
        cumulativePnL: Number(cumulativePnL.toFixed(4)),
        homeGoalsAvgScored: statsHome.avgGoalsScored,
        homeGoalsAvgConceded: statsHome.avgGoalsConceded,
        awayGoalsAvgScored: statsAway.avgGoalsScored,
        awayGoalsAvgConceded: statsAway.avgGoalsConceded,
        leagueMuH: snapshot.muH,
        leagueMuA: snapshot.muA,
        competitionName: match.season.competition.name,
        seasonYear: match.season.year,
      })
    }

    // Calcular KPIs consolidados
    const summary = calcularKPIs(betsInputsForKPIs)

    // Gerar pontos da curva de saldo para gráficos
    const curve = betsPlaced.map((bet, idx) => ({
      index: idx + 1,
      date: bet.utcDate,
      pnl: bet.pnl,
      cumulativePnL: bet.cumulativePnL,
    }))

    return NextResponse.json({
      data: {
        summary: {
          ...summary,
          skippedNoOdds,
          skippedMissingStats,
        },
        curve,
        bets: betsPlaced,
      }
    })

  } catch (error: any) {
    console.error('[BACKTEST_RUN_POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
