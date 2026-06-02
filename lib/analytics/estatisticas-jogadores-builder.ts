import { PlayerPosition, Prisma } from '@prisma/client'
import { PlayerAggregateStats, TeamSectorStats } from '@/types/jogadores'

// Tipo exato com a assinatura das relações necessárias para a agregação
export type PlayerMatchStatWithRelations = Prisma.PlayerMatchStatsGetPayload<{
  include: {
    player: true
    match: {
      include: {
        homeTeam: { select: { name: true } }
        awayTeam: { select: { name: true } }
      }
    }
  }
}>

/**
 * Mapeia a posição do banco de dados (enum PlayerPosition) para o setor da equipe.
 */
export function mapPositionToSector(position: PlayerPosition | null): 'GOL' | 'DEF' | 'MEI' | 'ATA' | 'N/D' {
  if (!position) return 'N/D'
  switch (position) {
    case PlayerPosition.GOALKEEPER:
      return 'GOL'
    case PlayerPosition.DEFENDER:
      return 'DEF'
    case PlayerPosition.MIDFIELDER:
      return 'MEI'
    case PlayerPosition.FORWARD:
      return 'ATA'
    default:
      return 'N/D'
  }
}

/**
 * Helper tipado de forma segura para ler campos estatísticos numéricos do PlayerMatchStats sem violar o TS estrito.
 */
function getStatValue(stat: PlayerMatchStatWithRelations, key: string): number | null {
  const record = stat as unknown as Record<string, number | null | undefined>
  const value = record[key]
  return value !== undefined ? value : null
}

/**
 * Calcula a taxa de cobertura (0..1) de cada métrica no confronto (Home + Away).
 */
export function calculateConfrontationCoverage(allMatchStats: PlayerMatchStatWithRelations[]): Record<string, number> {
  const total = allMatchStats.length
  if (total === 0) return {}

  const metrics = [
    'goals',
    'expectedGoals',
    'shotsTotal',
    'shotsOnTarget',
    'shotsOffTarget',
    'shotsBlocked',
    'dribblesAttempted',
    'dribblesSucceeded',
    'offsides',
    'keyPasses',
    'assists',
    'expectedAssists',
    'passesTotal',
    'passesAccurate',
    'touches',
    'foulsDrawn',
    'crossesTotal',
    'crossesAccurate',
    'tackles',
    'interceptions',
    'clearances',
    'dispossessed',
    'saves',
    'foulsCommitted',
    'yellowCards',
    'redCards'
  ]

  const coverage: Record<string, number> = {}
  for (const metric of metrics) {
    const nonNullCount = allMatchStats.filter(
      s => getStatValue(s, metric) !== null
    ).length
    coverage[metric] = nonNullCount / total
  }

  return coverage
}

/**
 * Constrói as estatísticas agregadas de setor e jogadores para uma equipe.
 */
export function buildTeamSectorStats(
  teamId: string,
  teamName: string,
  logoUrl: string | null,
  teamMatchStats: PlayerMatchStatWithRelations[], // Histórico bruto de PlayerMatchStats da equipe na janela
  cutoff: { dataPartida?: Date; rodada?: number } // Parâmetro para garantir o corte temporal estrito anti-vazamento no builder
): TeamSectorStats {
  // Defesa em profundidade: refiltra mesmo que a query já tenha cortado
  const safeStats = teamMatchStats.filter(s => {
    if (cutoff.dataPartida) {
      return s.match.utcDate < cutoff.dataPartida
    }
    if (cutoff.rodada != null) {
      return s.match.round != null && s.match.round < cutoff.rodada
    }
    return true
  })

  // 1. Agrupar PlayerMatchStats por jogador
  const statsByPlayer: Record<string, PlayerMatchStatWithRelations[]> = {}
  for (const stat of safeStats) {
    if (!statsByPlayer[stat.playerId]) {
      statsByPlayer[stat.playerId] = []
    }
    statsByPlayer[stat.playerId].push(stat)
  }

  const allPlayersAggregated: PlayerAggregateStats[] = []

  // 2. Agregar estatísticas de cada jogador
  for (const playerId in statsByPlayer) {
    const playerStats = statsByPlayer[playerId]
    const firstStat = playerStats[0]
    
    // Obter dados básicos do jogador
    const playerInfo = firstStat.player
    const position = playerInfo?.position || null
    const sector = mapPositionToSector(position)
    
    // Filtrar apenas partidas onde o jogador efetivamente esteve em campo (minutesPlayed > 0)
    const playedMatches = playerStats.filter(s => s.minutesPlayed !== null && s.minutesPlayed > 0)
    
    const totalMinutes = playedMatches.reduce((acc, s) => acc + (s.minutesPlayed || 0), 0)
    const matchesPlayed = playedMatches.length

    // Aplicar o piso de elegibilidade estrito de 180 minutos na janela
    if (totalMinutes < 180) {
      continue
    }

    // A. Calcular weightedRating (Média ponderada baseada nos minutos onde rating != null)
    let ratingNumerator = 0
    let ratingDenominator = 0
    for (const s of playedMatches) {
      if (s.rating !== null && s.rating !== undefined) {
        ratingNumerator += s.rating * (s.minutesPlayed || 0)
        ratingDenominator += (s.minutesPlayed || 0)
      }
    }
    const weightedRating = ratingDenominator > 0 ? ratingNumerator / ratingDenominator : null

    // B. Função auxiliar para calcular valores totais absolutos acumulados
    const calcTotal = (field: string): number | null => {
      let sum = 0
      let hasValue = false
      for (const s of playedMatches) {
        const val = getStatValue(s, field)
        if (val !== null) {
          sum += val
          hasValue = true
        }
      }
      return hasValue ? sum : null
    }

    const goals = calcTotal('goals')
    const expectedGoals = calcTotal('expectedGoals')
    const shotsTotal = calcTotal('shotsTotal')
    const shotsOnTarget = calcTotal('shotsOnTarget')
    const shotsOffTarget = calcTotal('shotsOffTarget')
    const shotsBlocked = calcTotal('shotsBlocked')
    const dribblesAttempted = calcTotal('dribblesAttempted')
    const dribblesSucceeded = calcTotal('dribblesSucceeded')
    const offsides = calcTotal('offsides')

    const keyPasses = calcTotal('keyPasses')
    const assists = calcTotal('assists')
    const expectedAssists = calcTotal('expectedAssists')
    const passesTotal = calcTotal('passesTotal')
    const passesAccurate = calcTotal('passesAccurate')
    const touches = calcTotal('touches')
    const foulsDrawn = calcTotal('foulsDrawn')
    const crossesTotal = calcTotal('crossesTotal')
    const crossesAccurate = calcTotal('crossesAccurate')

    const tackles = calcTotal('tackles')
    const interceptions = calcTotal('interceptions')
    const clearances = calcTotal('clearances')
    const dispossessed = calcTotal('dispossessed')
    const saves = calcTotal('saves')
    const foulsCommitted = calcTotal('foulsCommitted')
    const yellowCards = calcTotal('yellowCards')
    const redCards = calcTotal('redCards')

    // C. Montar histórico individual do jogador para o Drill-down
    const matchHistory = playedMatches.map(s => {
      const isHome = s.teamId === s.match.homeTeamId
      const opponentName = isHome ? s.match.awayTeam.name : s.match.homeTeam.name
      return {
        matchId: s.matchId,
        date: s.match.utcDate.toISOString(),
        round: s.match.round,
        opponentName,
        isHome,
        rating: s.rating,
        minutesPlayed: s.minutesPlayed,
        
        goals: s.goals,
        expectedGoals: s.expectedGoals,
        shotsTotal: s.shotsTotal,
        shotsOnTarget: s.shotsOnTarget,
        shotsOffTarget: s.shotsOffTarget,
        shotsBlocked: s.shotsBlocked,
        dribblesAttempted: s.dribblesAttempted,
        dribblesSucceeded: s.dribblesSucceeded,
        offsides: s.offsides,
        keyPasses: s.keyPasses,
        assists: s.assists,
        expectedAssists: s.expectedAssists,
        passesTotal: s.passesTotal,
        passesAccurate: s.passesAccurate,
        touches: s.touches,
        foulsDrawn: s.foulsDrawn,
        crossesTotal: s.crossesTotal,
        crossesAccurate: s.crossesAccurate,
        tackles: s.tackles,
        interceptions: s.interceptions,
        clearances: s.clearances,
        dispossessed: s.dispossessed,
        saves: s.saves,
        foulsCommitted: s.foulsCommitted,
        yellowCards: s.yellowCards,
        redCards: s.redCards
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    allPlayersAggregated.push({
      playerId,
      name: playerInfo?.name || 'Jogador sem nome',
      position,
      sector,
      totalMinutes,
      matchesPlayed,
      weightedRating,
      
      goals,
      expectedGoals,
      shotsTotal,
      shotsOnTarget,
      shotsOffTarget,
      shotsBlocked,
      dribblesAttempted,
      dribblesSucceeded,
      offsides,

      keyPasses,
      assists,
      expectedAssists,
      passesTotal,
      passesAccurate,
      touches,
      foulsDrawn,
      crossesTotal,
      crossesAccurate,

      tackles,
      interceptions,
      clearances,
      dispossessed,
      saves,
      foulsCommitted,
      yellowCards,
      redCards,

      matchHistory
    })
  }

  // 3. Eleição do XI Provável (Top 11 Elegíveis com desempate determinístico)
  const sortPlayersDeterministically = (players: PlayerAggregateStats[]) => {
    return [...players].sort((a, b) => {
      if (b.totalMinutes !== a.totalMinutes) return b.totalMinutes - a.totalMinutes
      if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed
      const ratingB = b.weightedRating ?? 0
      const ratingA = a.weightedRating ?? 0
      if (ratingB !== ratingA) return ratingB - ratingA
      return a.playerId.localeCompare(b.playerId)
    })
  }

  const goalkeepers = allPlayersAggregated.filter(p => p.sector === 'GOL')
  const outfieldPlayers = allPlayersAggregated.filter(p => p.sector === 'DEF' || p.sector === 'MEI' || p.sector === 'ATA')

  const sortedGk = sortPlayersDeterministically(goalkeepers)
  const sortedOutfield = sortPlayersDeterministically(outfieldPlayers)

  // Selecionar exatamente 1 goleiro + até 10 jogadores de linha
  const xiPlayers: PlayerAggregateStats[] = []
  if (sortedGk.length > 0) {
    xiPlayers.push(sortedGk[0])
  }
  const outfieldSelected = sortedOutfield.slice(0, 10)
  xiPlayers.push(...outfieldSelected)

  // 4. Calcular ratings de equipe e por setor com base nos jogadores do XI provável
  const calculateWeightedAverageRating = (playersInXI: PlayerAggregateStats[]): number | null => {
    const validPlayers = playersInXI.filter(p => p.weightedRating !== null)
    if (validPlayers.length === 0) return null

    let numerator = 0
    let denominator = 0
    for (const p of validPlayers) {
      numerator += (p.weightedRating || 0) * p.totalMinutes
      denominator += p.totalMinutes
    }
    return denominator > 0 ? numerator / denominator : null
  }

  const teamRating = calculateWeightedAverageRating(xiPlayers)

  const sectorRatings = {
    GOL: calculateWeightedAverageRating(xiPlayers.filter(p => p.sector === 'GOL')),
    DEF: calculateWeightedAverageRating(xiPlayers.filter(p => p.sector === 'DEF')),
    MEI: calculateWeightedAverageRating(xiPlayers.filter(p => p.sector === 'MEI')),
    ATA: calculateWeightedAverageRating(xiPlayers.filter(p => p.sector === 'ATA'))
  }

  return {
    teamId,
    teamName,
    logoUrl,
    teamRating,
    sectorRatings,
    players: allPlayersAggregated
  }
}
