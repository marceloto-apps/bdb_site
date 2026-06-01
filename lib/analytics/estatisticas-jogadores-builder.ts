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
 * Chave = nome do campo per90 sem o sufixo "Per90".
 */
export function calculateConfrontationCoverage(allMatchStats: PlayerMatchStatWithRelations[]): Record<string, number> {
  const total = allMatchStats.length
  if (total === 0) return {}

  const metrics = [
    'goals',
    'expectedGoals',
    'shotsTotal',
    'shotsOnTarget',
    'passesTotal',
    'passesAccurate',
    'keyPasses',
    'tackles',
    'interceptions',
    'clearances',
    'dribblesAttempted',
    'dribblesSucceeded',
    'foulsDrawn',
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
  // O corte temporal é estritamente menor (<). Se round for nulo em um cutoff por rodada, ele é excluído.
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

    // Aplicar o piso de elegibilidade estrito de 270 minutos na janela
    if (totalMinutes < 270) {
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

    // B. Função auxiliar para calcular métricas volumétricas per 90 independentes
    const calcPer90 = (field: string): number | null => {
      let eventSum = 0
      let minutesSum = 0
      for (const s of playedMatches) {
        const val = getStatValue(s, field)
        if (val !== null && s.minutesPlayed !== null && s.minutesPlayed > 0) {
          eventSum += val
          minutesSum += s.minutesPlayed
        }
      }
      return minutesSum > 0 ? (eventSum / minutesSum) * 90 : null
    }

    const goalsPer90 = calcPer90('goals')
    const expectedGoalsPer90 = calcPer90('expectedGoals')
    
    // overperformancePer90 = goalsPer90 - expectedGoalsPer90 (apenas se ambos forem válidos)
    const overperformancePer90 = (goalsPer90 !== null && expectedGoalsPer90 !== null)
      ? goalsPer90 - expectedGoalsPer90
      : null

    const shotsTotalPer90 = calcPer90('shotsTotal')
    const shotsOnTargetPer90 = calcPer90('shotsOnTarget')
    const passesTotalPer90 = calcPer90('passesTotal')
    const passesAccuratePer90 = calcPer90('passesAccurate')
    const keyPassesPer90 = calcPer90('keyPasses')
    const tacklesPer90 = calcPer90('tackles')
    const interceptionsPer90 = calcPer90('interceptions')
    const clearancesPer90 = calcPer90('clearances')
    const dribblesAttemptedPer90 = calcPer90('dribblesAttempted')
    const dribblesSucceededPer90 = calcPer90('dribblesSucceeded')
    const foulsDrawnPer90 = calcPer90('foulsDrawn')
    const foulsCommittedPer90 = calcPer90('foulsCommitted')
    const yellowCardsPer90 = calcPer90('yellowCards')
    const redCardsPer90 = calcPer90('redCards')

    // C. Montar histórico individual do jogador para o Drill-down
    // Mapeado a partir de playedMatches para não exibir partidas em que ficou no banco
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
        keyPasses: s.keyPasses,
        tackles: s.tackles,
        interceptions: s.interceptions
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
      goalsPer90,
      expectedGoalsPer90,
      overperformancePer90,
      shotsTotalPer90,
      shotsOnTargetPer90,
      passesTotalPer90,
      passesAccuratePer90,
      keyPassesPer90,
      tacklesPer90,
      interceptionsPer90,
      clearancesPer90,
      dribblesAttemptedPer90,
      dribblesSucceededPer90,
      foulsDrawnPer90,
      foulsCommittedPer90,
      yellowCardsPer90,
      redCardsPer90,
      matchHistory
    })
  }

  // 3. Eleição do XI Provável (Top 11 Elegíveis com desempate determinístico)
  // Critério de ordenação: totalMinutes DESC -> matchesPlayed DESC -> weightedRating DESC -> playerId ASC
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
