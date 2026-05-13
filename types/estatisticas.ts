export type StatSummary = {
  average: number | null
  standardDeviation: number | null
  coefficientOfVariation: number | null
  sampleSize: number
}

export type ProfitSummary = {
  profit: number
  roi: number
  bets: number
  wins: number
  hitRate: number
  averageOdd: number | null
}

export type OverUnderSummary = {
  line: number
  overCount: number
  underCount: number
  total: number
  overPercent: number
  underPercent: number
}

export type TeamMatchStats = {
  teamId: string
  teamName: string
  sampleSize: number
  odds: {
    home: StatSummary
    draw: StatSummary
    away: StatSummary
    over25: StatSummary
    under25: StatSummary
    bttsYes: StatSummary
    bttsNo: StatSummary
  }
  profit: {
    teamWin: ProfitSummary
    draw: ProfitSummary
    over25: ProfitSummary
    under25: ProfitSummary
    bttsYes: ProfitSummary
    bttsNo: ProfitSummary
  }
  goalsXgShots: Record<string, StatSummary>
  cornersCardsFouls: Record<string, StatSummary>
  overUnder: {
    goalsFT: OverUnderSummary[]
    goalsHT: OverUnderSummary[]
    cornersFT: OverUnderSummary[]
    cornersHT: OverUnderSummary[]
    yellowCardsFT: OverUnderSummary[]
  }
}
