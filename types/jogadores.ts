import { PlayerPosition } from '@prisma/client'

export interface PlayerAggregateStats {
  playerId: string
  name: string
  position: PlayerPosition | null
  sector: 'GOL' | 'DEF' | 'MEI' | 'ATA' | 'N/D'
  totalMinutes: number
  matchesPlayed: number
  weightedRating: number | null
  
  // Métricas Totais Acumuladas
  goals: number | null
  expectedGoals: number | null
  shotsTotal: number | null
  shotsOnTarget: number | null
  shotsOffTarget: number | null
  shotsBlocked: number | null
  dribblesAttempted: number | null
  dribblesSucceeded: number | null
  offsides: number | null

  keyPasses: number | null
  assists: number | null
  expectedAssists: number | null
  passesTotal: number | null
  passesAccurate: number | null
  touches: number | null
  foulsDrawn: number | null
  crossesTotal: number | null
  crossesAccurate: number | null

  tackles: number | null
  interceptions: number | null
  clearances: number | null
  dispossessed: number | null
  saves: number | null
  foulsCommitted: number | null
  yellowCards: number | null
  redCards: number | null

  // Histórico embutido para o Drill-down
  matchHistory: {
    matchId: string
    date: string
    round: number | null
    opponentName: string
    isHome: boolean
    rating: number | null
    minutesPlayed: number | null
    
    // Métricas por partida
    goals: number | null
    expectedGoals: number | null
    shotsTotal: number | null
    shotsOnTarget: number | null
    shotsOffTarget: number | null
    shotsBlocked: number | null
    dribblesAttempted: number | null
    dribblesSucceeded: number | null
    offsides: number | null
    keyPasses: number | null
    assists: number | null
    expectedAssists: number | null
    passesTotal: number | null
    passesAccurate: number | null
    touches: number | null
    foulsDrawn: number | null
    crossesTotal: number | null
    crossesAccurate: number | null
    tackles: number | null
    interceptions: number | null
    clearances: number | null
    dispossessed: number | null
    saves: number | null
    foulsCommitted: number | null
    yellowCards: number | null
    redCards: number | null
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
