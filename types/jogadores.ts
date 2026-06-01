import { PlayerPosition } from '@prisma/client'

export interface PlayerAggregateStats {
  playerId: string
  name: string
  position: PlayerPosition | null
  sector: 'GOL' | 'DEF' | 'MEI' | 'ATA' | 'N/D'
  totalMinutes: number
  matchesPlayed: number
  weightedRating: number | null
  
  // Métricas per 90
  goalsPer90: number | null
  expectedGoalsPer90: number | null
  overperformancePer90: number | null
  shotsTotalPer90: number | null
  shotsOnTargetPer90: number | null
  passesTotalPer90: number | null
  passesAccuratePer90: number | null
  keyPassesPer90: number | null
  tacklesPer90: number | null
  interceptionsPer90: number | null
  clearancesPer90: number | null
  dribblesAttemptedPer90: number | null
  dribblesSucceededPer90: number | null
  foulsDrawnPer90: number | null
  foulsCommittedPer90: number | null
  yellowCardsPer90: number | null
  redCardsPer90: number | null

  // Histórico embutido para o Drill-down
  matchHistory: {
    matchId: string
    date: string
    round: number | null
    opponentName: string
    isHome: boolean
    rating: number | null
    minutesPlayed: number | null
    goals: number | null
    expectedGoals: number | null
    keyPasses: number | null
    tackles: number | null
    interceptions: number | null
  }[]
}

export interface TeamSectorStats {
  teamId: string
  teamName: string
  logoUrl: string | null
  teamRating: number | null // Média ponderada do XI
  sectorRatings: {
    GOL: number | null
    DEF: number | null
    MEI: number | null
    ATA: number | null
  }
  players: PlayerAggregateStats[]
}

export interface JogadoresResponse {
  home: TeamSectorStats
  away: TeamSectorStats
  coverage: Record<string, number>
}
