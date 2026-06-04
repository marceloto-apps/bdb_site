import { TeamMatchStats, StatSummary, ProfitSummary, OverUnderSummary } from '@/types/estatisticas'
import { calculateStatSummary, calculateProfitSummary, calculateOverUnderSummary, ProfitBetResult } from './estatisticas'

// Assumes matches have `stats` and `odds` populated.
export function buildTeamMatchStats(teamId: string, teamName: string, matches: any[]): TeamMatchStats {
  const teamMatches = matches.filter(m => m.homeTeamId === teamId || m.awayTeamId === teamId)
  
  // Extract odds (Bet365 only assumed in the query)
  const homeOdds: (number | null)[] = []
  const drawOdds: (number | null)[] = []
  const awayOdds: (number | null)[] = []
  const over25Odds: (number | null)[] = []
  const under25Odds: (number | null)[] = []
  const bttsYesOdds: (number | null)[] = []
  const bttsNoOdds: (number | null)[] = []

  // Profit results
  const teamWinProfit: ProfitBetResult[] = []
  const drawProfit: ProfitBetResult[] = []
  const over25Profit: ProfitBetResult[] = []
  const under25Profit: ProfitBetResult[] = []
  const bttsYesProfit: ProfitBetResult[] = []
  const bttsNoProfit: ProfitBetResult[] = []

  // Gols / xG / Finalizações
  const goalsFT: (number | null)[] = []
  const goalsConcededFT: (number | null)[] = []
  const goals1H: (number | null)[] = []
  const goalsConceded1H: (number | null)[] = []
  const goals2H: (number | null)[] = []
  const goalsConceded2H: (number | null)[] = []
  
  // Note: Gols por xG is calculated at the end directly from averages
  
  const xgFT: (number | null)[] = []
  const xgConcededFT: (number | null)[] = []
  const xg1H: (number | null)[] = []
  const xgConceded1H: (number | null)[] = []
  const xg2H: (number | null)[] = []
  const xgConceded2H: (number | null)[] = []

  const shotsFT: (number | null)[] = []
  const shotsConcededFT: (number | null)[] = []
  const shotsOnTargetFT: (number | null)[] = []
  const shotsOnTargetConcededFT: (number | null)[] = []
  
  const shots1H: (number | null)[] = []
  const shotsConceded1H: (number | null)[] = []
  const shotsOnTarget1H: (number | null)[] = []
  const shotsOnTargetConceded1H: (number | null)[] = []
  
  const shots2H: (number | null)[] = []
  const shotsConceded2H: (number | null)[] = []
  const shotsOnTarget2H: (number | null)[] = []
  const shotsOnTargetConceded2H: (number | null)[] = []

  // Escanteios / Cartões / Faltas
  const cornersFT: (number | null)[] = []
  const cornersConcededFT: (number | null)[] = []
  const corners1H: (number | null)[] = []
  const cornersConceded1H: (number | null)[] = []
  const corners2H: (number | null)[] = []
  const cornersConceded2H: (number | null)[] = []

  const yellowCardsFT: (number | null)[] = []
  const yellowCardsConcededFT: (number | null)[] = []
  const yellowCards1H: (number | null)[] = []
  const yellowCardsConceded1H: (number | null)[] = []
  const yellowCards2H: (number | null)[] = []
  const yellowCardsConceded2H: (number | null)[] = []

  const redCardsFT: (number | null)[] = []
  const redCardsConcededFT: (number | null)[] = []

  const foulsFT: (number | null)[] = []
  const foulsConcededFT: (number | null)[] = []
  const fouls1H: (number | null)[] = []
  const foulsConceded1H: (number | null)[] = []
  const fouls2H: (number | null)[] = []
  const foulsConceded2H: (number | null)[] = []

  // Totais for Over/Under
  const totalGoalsFT: number[] = []
  const totalGoalsHT: number[] = []
  const totalCornersFT: number[] = []
  const totalCornersHT: number[] = []
  const totalYellowCardsFT: number[] = []
  const bttsResults: boolean[] = []

  teamMatches.forEach(m => {
    const isHome = m.homeTeamId === teamId
    
    // Odds Arrays
    const odd1 = m.odds.find((o: any) => o.market?.key === 'match_odds' && o.selection === 'home')?.odds || null
    const oddX = m.odds.find((o: any) => o.market?.key === 'match_odds' && o.selection === 'draw')?.odds || null
    const odd2 = m.odds.find((o: any) => o.market?.key === 'match_odds' && o.selection === 'away')?.odds || null
    
    const teamOdd = isHome ? odd1 : odd2
    const oppOdd = isHome ? odd2 : odd1
    
    homeOdds.push(odd1)
    drawOdds.push(oddX)
    awayOdds.push(odd2)

    const oddOver25 = m.odds.find((o: any) => o.market?.key === 'total_goals' && o.selection === 'over' && o.line === 2.5)?.odds || null
    const oddUnder25 = m.odds.find((o: any) => o.market?.key === 'total_goals' && o.selection === 'under' && o.line === 2.5)?.odds || null
    over25Odds.push(oddOver25)
    under25Odds.push(oddUnder25)

    const oddBttsYes = m.odds.find((o: any) => o.market?.key === 'btts' && o.selection === 'yes')?.odds || null
    const oddBttsNo = m.odds.find((o: any) => o.market?.key === 'btts' && o.selection === 'no')?.odds || null
    bttsYesOdds.push(oddBttsYes)
    bttsNoOdds.push(oddBttsNo)

    // Match Outcomes
    const fthg = m.fthg
    const ftag = m.ftag
    const teamGoals = isHome ? fthg : ftag
    const oppGoals = isHome ? ftag : fthg
    
    goalsFT.push(teamGoals)
    goalsConcededFT.push(oppGoals)

    if (fthg !== null && ftag !== null) {
      totalGoalsFT.push(fthg + ftag)
      bttsResults.push(fthg > 0 && ftag > 0)
    }

    const hthg = m.hthg
    const htag = m.htag
    const teamGoals1H = isHome ? hthg : htag
    const oppGoals1H = isHome ? htag : hthg
    
    if (hthg != null && htag != null) {
      goals1H.push(teamGoals1H)
      goalsConceded1H.push(oppGoals1H)
      totalGoalsHT.push(hthg + htag)
      
      goals2H.push(teamGoals !== null ? teamGoals - teamGoals1H : null)
      goalsConceded2H.push(oppGoals !== null ? oppGoals - oppGoals1H : null)
    } else {
      goals2H.push(null)
      goalsConceded2H.push(null)
    }

    const teamWon = teamGoals > oppGoals
    const isDraw = teamGoals === oppGoals
    const totalGoals = fthg + ftag
    const isOver25 = totalGoals > 2.5
    const isBtts = fthg > 0 && ftag > 0

    // Profit Data
    teamWinProfit.push({ won: teamWon, odd: teamOdd || 0, valid: !!teamOdd })
    drawProfit.push({ won: isDraw, odd: oddX || 0, valid: !!oddX })
    over25Profit.push({ won: isOver25, odd: oddOver25 || 0, valid: !!oddOver25 })
    under25Profit.push({ won: !isOver25, odd: oddUnder25 || 0, valid: !!oddUnder25 })
    bttsYesProfit.push({ won: isBtts, odd: oddBttsYes || 0, valid: !!oddBttsYes })
    bttsNoProfit.push({ won: !isBtts, odd: oddBttsNo || 0, valid: !!oddBttsNo })

    // Stats
    const stats = m.stats
    if (stats) {
      const teamXg = isHome ? stats.homeXg : stats.awayXg
      const oppXg = isHome ? stats.awayXg : stats.homeXg
      const teamXg1H = isHome ? stats.homeXgFirstHalf : stats.awayXgFirstHalf
      const oppXg1H = isHome ? stats.awayXgFirstHalf : stats.homeXgFirstHalf
      const teamXg2H = isHome ? stats.homeXgSecondHalf : stats.awayXgSecondHalf
      const oppXg2H = isHome ? stats.awayXgSecondHalf : stats.homeXgSecondHalf

      // Gols FT
      const teamGoalsFT = teamGoals
      const oppGoalsFT = oppGoals

      // Gols 1H
      const teamGoals1H = isHome ? hthg : htag
      const oppGoals1H = isHome ? htag : hthg

      // Gols 2H
      const teamGoals2H = (teamGoalsFT !== null && teamGoals1H !== null) ? teamGoalsFT - teamGoals1H : null
      const oppGoals2H = (oppGoalsFT !== null && oppGoals1H !== null) ? oppGoalsFT - oppGoals1H : null


      // xG
      xgFT.push(isHome ? stats.homeXg : stats.awayXg)
      xgConcededFT.push(isHome ? stats.awayXg : stats.homeXg)
      xg1H.push(isHome ? stats.homeXgFirstHalf : stats.awayXgFirstHalf)
      xgConceded1H.push(isHome ? stats.awayXgFirstHalf : stats.homeXgFirstHalf)
      xg2H.push(isHome ? stats.homeXgSecondHalf : stats.awayXgSecondHalf)
      xgConceded2H.push(isHome ? stats.awayXgSecondHalf : stats.homeXgSecondHalf)

      // Shots
      shotsFT.push(isHome ? stats.homeShots : stats.awayShots)
      shotsConcededFT.push(isHome ? stats.awayShots : stats.homeShots)
      shotsOnTargetFT.push(isHome ? stats.homeShotsOnTarget : stats.awayShotsOnTarget)
      shotsOnTargetConcededFT.push(isHome ? stats.awayShotsOnTarget : stats.homeShotsOnTarget)
      
      shots1H.push(isHome ? stats.homeShotsFirstHalf : stats.awayShotsFirstHalf)
      shotsConceded1H.push(isHome ? stats.awayShotsFirstHalf : stats.homeShotsFirstHalf)
      shotsOnTarget1H.push(isHome ? stats.homeShotsOnTargetFirstHalf : stats.awayShotsOnTargetFirstHalf)
      shotsOnTargetConceded1H.push(isHome ? stats.awayShotsOnTargetFirstHalf : stats.homeShotsOnTargetFirstHalf)

      shots2H.push(isHome ? stats.homeShotsSecondHalf : stats.awayShotsSecondHalf)
      shotsConceded2H.push(isHome ? stats.awayShotsSecondHalf : stats.homeShotsSecondHalf)
      shotsOnTarget2H.push(isHome ? stats.homeShotsOnTargetSecondHalf : stats.awayShotsOnTargetSecondHalf)
      shotsOnTargetConceded2H.push(isHome ? stats.awayShotsOnTargetSecondHalf : stats.homeShotsOnTargetSecondHalf)

      // Corners
      cornersFT.push(isHome ? stats.homeCorners : stats.awayCorners)
      cornersConcededFT.push(isHome ? stats.awayCorners : stats.homeCorners)
      corners1H.push(isHome ? stats.homeCornersFirstHalf : stats.awayCornersFirstHalf)
      cornersConceded1H.push(isHome ? stats.awayCornersFirstHalf : stats.homeCornersFirstHalf)
      corners2H.push(isHome ? stats.homeCornersSecondHalf : stats.awayCornersSecondHalf)
      cornersConceded2H.push(isHome ? stats.awayCornersSecondHalf : stats.homeCornersSecondHalf)

      if (stats.homeCorners !== null && stats.awayCorners !== null) {
        totalCornersFT.push(stats.homeCorners + stats.awayCorners)
      }
      if (stats.homeCornersFirstHalf !== null && stats.awayCornersFirstHalf !== null) {
        totalCornersHT.push(stats.homeCornersFirstHalf + stats.awayCornersFirstHalf)
      }

      // Yellow Cards
      yellowCardsFT.push(isHome ? stats.homeYellowCards : stats.awayYellowCards)
      yellowCardsConcededFT.push(isHome ? stats.awayYellowCards : stats.homeYellowCards)
      yellowCards1H.push(isHome ? stats.homeYellowCardsFirstHalf : stats.awayYellowCardsFirstHalf)
      yellowCardsConceded1H.push(isHome ? stats.awayYellowCardsFirstHalf : stats.homeYellowCardsFirstHalf)
      yellowCards2H.push(isHome ? stats.homeYellowCardsSecondHalf : stats.awayYellowCardsSecondHalf)
      yellowCardsConceded2H.push(isHome ? stats.awayYellowCardsSecondHalf : stats.homeYellowCardsSecondHalf)

      if (stats.homeYellowCards !== null && stats.awayYellowCards !== null) {
        totalYellowCardsFT.push(stats.homeYellowCards + stats.awayYellowCards)
      }

      // Red Cards
      redCardsFT.push(isHome ? stats.homeRedCards : stats.awayRedCards)
      redCardsConcededFT.push(isHome ? stats.awayRedCards : stats.homeRedCards)

      // Fouls
      foulsFT.push(isHome ? stats.homeFouls : stats.awayFouls)
      foulsConcededFT.push(isHome ? stats.awayFouls : stats.homeFouls)
      fouls1H.push(isHome ? stats.homeFoulsFirstHalf : stats.awayFoulsFirstHalf)
      foulsConceded1H.push(isHome ? stats.awayFoulsFirstHalf : stats.homeFoulsFirstHalf)
      fouls2H.push(isHome ? stats.homeFoulsSecondHalf : stats.awayFoulsSecondHalf)
      foulsConceded2H.push(isHome ? stats.awayFoulsSecondHalf : stats.homeFoulsSecondHalf)
    }
  })

  // Saldo e Total Helpers
  const calcDiff = (forArr: (number|null)[], againstArr: (number|null)[]) => {
    return forArr.map((v, i) => v !== null && againstArr[i] !== null ? v - againstArr[i]! : null)
  }
  const calcTotal = (forArr: (number|null)[], againstArr: (number|null)[]) => {
    return forArr.map((v, i) => v !== null && againstArr[i] !== null ? v + againstArr[i]! : null)
  }
  const makeRatioSummary = (golsSummary: StatSummary, xgSummary: StatSummary) => {
    const avgGols = golsSummary.average
    const avgXg = xgSummary.average
    
    if (avgGols === null || avgXg === null) {
      return {
        average: null,
        standardDeviation: null,
        coefficientOfVariation: null,
        sampleSize: xgSummary.sampleSize
      }
    }
    
    if (avgXg === 0) {
      return {
        average: 0,
        standardDeviation: null,
        coefficientOfVariation: null,
        sampleSize: xgSummary.sampleSize
      }
    }
    
    const ratio = avgGols / avgXg
    const average = isNaN(ratio) || !isFinite(ratio) ? 0 : ratio
    return {
      average,
      standardDeviation: null,
      coefficientOfVariation: null,
      sampleSize: xgSummary.sampleSize
    }
  }

  const gTotalFT = calculateStatSummary(calcTotal(goalsFT, goalsConcededFT))
  const gFT = calculateStatSummary(goalsFT)
  const gConcededFT = calculateStatSummary(goalsConcededFT)
  const gDiffFT = calculateStatSummary(calcDiff(goalsFT, goalsConcededFT))

  const gTotal1H = calculateStatSummary(calcTotal(goals1H, goalsConceded1H))
  const g1H = calculateStatSummary(goals1H)
  const gConceded1H = calculateStatSummary(goalsConceded1H)
  const gDiff1H = calculateStatSummary(calcDiff(goals1H, goalsConceded1H))

  const gTotal2H = calculateStatSummary(calcTotal(goals2H, goalsConceded2H))
  const g2H = calculateStatSummary(goals2H)
  const gConceded2H = calculateStatSummary(goalsConceded2H)
  const gDiff2H = calculateStatSummary(calcDiff(goals2H, goalsConceded2H))

  const xgTotalFTVal = calculateStatSummary(calcTotal(xgFT, xgConcededFT))
  const xgFTVal = calculateStatSummary(xgFT)
  const xgConcededFTVal = calculateStatSummary(xgConcededFT)
  const xgDiffFTVal = calculateStatSummary(calcDiff(xgFT, xgConcededFT))

  const xgTotal1HVal = calculateStatSummary(calcTotal(xg1H, xgConceded1H))
  const xg1HVal = calculateStatSummary(xg1H)
  const xgConceded1HVal = calculateStatSummary(xgConceded1H)
  const xgDiff1HVal = calculateStatSummary(calcDiff(xg1H, xgConceded1H))

  const xgTotal2HVal = calculateStatSummary(calcTotal(xg2H, xgConceded2H))
  const xg2HVal = calculateStatSummary(xg2H)
  const xgConceded2HVal = calculateStatSummary(xgConceded2H)
  const xgDiff2HVal = calculateStatSummary(calcDiff(xg2H, xgConceded2H))

  const totalBtts = bttsResults.length
  const yesCount = bttsResults.filter(r => r).length
  const noCount = totalBtts - yesCount
  const yesPercent = totalBtts > 0 ? (yesCount / totalBtts) * 100 : 0
  const noPercent = totalBtts > 0 ? (noCount / totalBtts) * 100 : 0

  return {
    teamId,
    teamName,
    sampleSize: teamMatches.length,
    btts: {
      yesCount,
      noCount,
      total: totalBtts,
      yesPercent,
      noPercent,
    },
    odds: {
      home: calculateStatSummary(homeOdds),
      draw: calculateStatSummary(drawOdds),
      away: calculateStatSummary(awayOdds),
      over25: calculateStatSummary(over25Odds),
      under25: calculateStatSummary(under25Odds),
      bttsYes: calculateStatSummary(bttsYesOdds),
      bttsNo: calculateStatSummary(bttsNoOdds),
    },
    profit: {
      teamWin: calculateProfitSummary(teamWinProfit),
      draw: calculateProfitSummary(drawProfit),
      over25: calculateProfitSummary(over25Profit),
      under25: calculateProfitSummary(under25Profit),
      bttsYes: calculateProfitSummary(bttsYesProfit),
      bttsNo: calculateProfitSummary(bttsNoProfit),
    },
    goalsXgShots: {
      goalsTotalFT: gTotalFT,
      goalsFT: gFT,
      goalsConcededFT: gConcededFT,
      goalsDiffFT: gDiffFT,
      goalsTotal1H: gTotal1H,
      goals1H: g1H,
      goalsConceded1H: gConceded1H,
      goalsDiff1H: gDiff1H,
      goalsTotal2H: gTotal2H,
      goals2H: g2H,
      goalsConceded2H: gConceded2H,
      goalsDiff2H: gDiff2H,
      
      xgTotalFT: xgTotalFTVal,
      xgFT: xgFTVal,
      xgConcededFT: xgConcededFTVal,
      xgDiffFT: xgDiffFTVal,
      xgTotal1H: xgTotal1HVal,
      xg1H: xg1HVal,
      xgConceded1H: xgConceded1HVal,
      xgDiff1H: xgDiff1HVal,
      xgTotal2H: xgTotal2HVal,
      xg2H: xg2HVal,
      xgConceded2H: xgConceded2HVal,
      xgDiff2H: xgDiff2HVal,

      goalsPerXgTotalFT: makeRatioSummary(gTotalFT, xgTotalFTVal),
      goalsPerXgFT: makeRatioSummary(gFT, xgFTVal),
      goalsPerXgConcededFT: makeRatioSummary(gConcededFT, xgConcededFTVal),
      goalsPerXgDiffFT: makeRatioSummary(gDiffFT, xgDiffFTVal),

      goalsPerXgTotal1H: makeRatioSummary(gTotal1H, xgTotal1HVal),
      goalsPerXg1H: makeRatioSummary(g1H, xg1HVal),
      goalsPerXgConceded1H: makeRatioSummary(gConceded1H, xgConceded1HVal),
      goalsPerXgDiff1H: makeRatioSummary(gDiff1H, xgDiff1HVal),

      goalsPerXgTotal2H: makeRatioSummary(gTotal2H, xgTotal2HVal),
      goalsPerXg2H: makeRatioSummary(g2H, xg2HVal),
      goalsPerXgConceded2H: makeRatioSummary(gConceded2H, xgConceded2HVal),
      goalsPerXgDiff2H: makeRatioSummary(gDiff2H, xgDiff2HVal),

      shotsTotalFT: calculateStatSummary(calcTotal(shotsFT, shotsConcededFT)),
      shotsFT: calculateStatSummary(shotsFT),
      shotsConcededFT: calculateStatSummary(shotsConcededFT),
      shotsDiffFT: calculateStatSummary(calcDiff(shotsFT, shotsConcededFT)),
      shotsOnTargetTotalFT: calculateStatSummary(calcTotal(shotsOnTargetFT, shotsOnTargetConcededFT)),
      shotsOnTargetFT: calculateStatSummary(shotsOnTargetFT),
      shotsOnTargetConcededFT: calculateStatSummary(shotsOnTargetConcededFT),
      shotsOnTargetDiffFT: calculateStatSummary(calcDiff(shotsOnTargetFT, shotsOnTargetConcededFT)),

      shotsTotal1H: calculateStatSummary(calcTotal(shots1H, shotsConceded1H)),
      shots1H: calculateStatSummary(shots1H),
      shotsConceded1H: calculateStatSummary(shotsConceded1H),
      shotsDiff1H: calculateStatSummary(calcDiff(shots1H, shotsConceded1H)),
      shotsOnTargetTotal1H: calculateStatSummary(calcTotal(shotsOnTarget1H, shotsOnTargetConceded1H)),
      shotsOnTarget1H: calculateStatSummary(shotsOnTarget1H),
      shotsOnTargetConceded1H: calculateStatSummary(shotsOnTargetConceded1H),
      shotsOnTargetDiff1H: calculateStatSummary(calcDiff(shotsOnTarget1H, shotsOnTargetConceded1H)),

      shotsTotal2H: calculateStatSummary(calcTotal(shots2H, shotsConceded2H)),
      shots2H: calculateStatSummary(shots2H),
      shotsConceded2H: calculateStatSummary(shotsConceded2H),
      shotsDiff2H: calculateStatSummary(calcDiff(shots2H, shotsConceded2H)),
      shotsOnTargetTotal2H: calculateStatSummary(calcTotal(shotsOnTarget2H, shotsOnTargetConceded2H)),
      shotsOnTarget2H: calculateStatSummary(shotsOnTarget2H),
      shotsOnTargetConceded2H: calculateStatSummary(shotsOnTargetConceded2H),
      shotsOnTargetDiff2H: calculateStatSummary(calcDiff(shotsOnTarget2H, shotsOnTargetConceded2H)),
    },
    cornersCardsFouls: {
      cornersTotalFT: calculateStatSummary(calcTotal(cornersFT, cornersConcededFT)),
      cornersFT: calculateStatSummary(cornersFT),
      cornersConcededFT: calculateStatSummary(cornersConcededFT),
      cornersDiffFT: calculateStatSummary(calcDiff(cornersFT, cornersConcededFT)),
      cornersTotal1H: calculateStatSummary(calcTotal(corners1H, cornersConceded1H)),
      corners1H: calculateStatSummary(corners1H),
      cornersConceded1H: calculateStatSummary(cornersConceded1H),
      cornersDiff1H: calculateStatSummary(calcDiff(corners1H, cornersConceded1H)),
      cornersTotal2H: calculateStatSummary(calcTotal(corners2H, cornersConceded2H)),
      corners2H: calculateStatSummary(corners2H),
      cornersConceded2H: calculateStatSummary(cornersConceded2H),
      cornersDiff2H: calculateStatSummary(calcDiff(corners2H, cornersConceded2H)),

      yellowCardsTotalFT: calculateStatSummary(calcTotal(yellowCardsFT, yellowCardsConcededFT)),
      yellowCardsFT: calculateStatSummary(yellowCardsFT),
      yellowCardsConcededFT: calculateStatSummary(yellowCardsConcededFT),
      yellowCardsDiffFT: calculateStatSummary(calcDiff(yellowCardsFT, yellowCardsConcededFT)),
      yellowCardsTotal1H: calculateStatSummary(calcTotal(yellowCards1H, yellowCardsConceded1H)),
      yellowCards1H: calculateStatSummary(yellowCards1H),
      yellowCardsConceded1H: calculateStatSummary(yellowCardsConceded1H),
      yellowCardsDiff1H: calculateStatSummary(calcDiff(yellowCards1H, yellowCardsConceded1H)),
      yellowCardsTotal2H: calculateStatSummary(calcTotal(yellowCards2H, yellowCardsConceded2H)),
      yellowCards2H: calculateStatSummary(yellowCards2H),
      yellowCardsConceded2H: calculateStatSummary(yellowCardsConceded2H),
      yellowCardsDiff2H: calculateStatSummary(calcDiff(yellowCards2H, yellowCardsConceded2H)),

      redCardsTotalFT: calculateStatSummary(calcTotal(redCardsFT, redCardsConcededFT)),
      redCardsFT: calculateStatSummary(redCardsFT),
      redCardsConcededFT: calculateStatSummary(redCardsConcededFT),
      redCardsDiffFT: calculateStatSummary(calcDiff(redCardsFT, redCardsConcededFT)),

      foulsTotalFT: calculateStatSummary(calcTotal(foulsFT, foulsConcededFT)),
      foulsFT: calculateStatSummary(foulsFT),
      foulsConcededFT: calculateStatSummary(foulsConcededFT),
      foulsDiffFT: calculateStatSummary(calcDiff(foulsFT, foulsConcededFT)),
      foulsTotal1H: calculateStatSummary(calcTotal(fouls1H, foulsConceded1H)),
      fouls1H: calculateStatSummary(fouls1H),
      foulsConceded1H: calculateStatSummary(foulsConceded1H),
      foulsDiff1H: calculateStatSummary(calcDiff(fouls1H, foulsConceded1H)),
      foulsTotal2H: calculateStatSummary(calcTotal(fouls2H, foulsConceded2H)),
      fouls2H: calculateStatSummary(fouls2H),
      foulsConceded2H: calculateStatSummary(foulsConceded2H),
      foulsDiff2H: calculateStatSummary(calcDiff(fouls2H, foulsConceded2H)),
    },
    overUnder: {
      goalsFT: calculateOverUnderSummary(totalGoalsFT, [0.5, 1.5, 2.5, 3.5]),
      goalsHT: calculateOverUnderSummary(totalGoalsHT, [0.5, 1.5]),
      cornersFT: calculateOverUnderSummary(totalCornersFT, [5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5]),
      cornersHT: calculateOverUnderSummary(totalCornersHT, [2.5, 3.5, 4.5, 5.5]),
      yellowCardsFT: calculateOverUnderSummary(totalYellowCardsFT, [2.5, 3.5, 4.5, 5.5]),
    }
  }
}
