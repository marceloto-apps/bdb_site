import { Prisma } from '@prisma/client'
import { ApiMatch, ApiMatchStatsResponse, ApiPlayerStatsResponse, ApiShotmapResponse } from './types'
import { normalizeTeamName } from '../team-normalizer'

export interface MappedMatchData {
  match: Prisma.MatchCreateInput
  stats: Prisma.MatchStatsCreateInput | null
  odds: Prisma.MatchOddsCreateManyInput[]
  playerStats: Prisma.PlayerMatchStatsCreateManyInput[]
  shots: Prisma.ShotCreateManyInput[]
}

export function mapApiMatchToMatch(apiMatch: ApiMatch, seasonId: string): Prisma.MatchCreateInput {
  return {
    externalId: apiMatch.id,
    utcDate: new Date(apiMatch.utc_date),
    round: apiMatch.matchday !== undefined ? apiMatch.matchday : null,
    
    // As relações serão conectadas pelas FKs (homeTeamId, awayTeamId)
    // O sync-engine garantirá que os times existam antes de chamar o mapper
    homeTeam: { 
      connectOrCreate: {
        where: { externalId: apiMatch.home_team.id },
        create: { 
          externalId: apiMatch.home_team.id, 
          name: normalizeTeamName(apiMatch.home_team.name || `Team ${apiMatch.home_team.id}`) 
        }
      } 
    },
    awayTeam: { 
      connectOrCreate: {
        where: { externalId: apiMatch.away_team.id },
        create: { 
          externalId: apiMatch.away_team.id, 
          name: normalizeTeamName(apiMatch.away_team.name || `Team ${apiMatch.away_team.id}`) 
        }
      } 
    },
    season: { connect: { id: seasonId } },
    
    status: apiMatch.status as any,
    fthg: apiMatch.score?.home !== undefined ? apiMatch.score.home : null,
    ftag: apiMatch.score?.away !== undefined ? apiMatch.score.away : null,
    
    xgAvailable: apiMatch.xg_available ?? false,
    oddsAvailable: apiMatch.odds_available ?? false,
  }
}

export function mapApiStatsToMatchStats(apiStats: ApiMatchStatsResponse, matchId: string): Prisma.MatchStatsCreateInput {
  const data = apiStats.data
  return {
    match: { connect: { id: matchId } },
    homePossession: data.overview?.possession?.all?.home ?? null,
    awayPossession: data.overview?.possession?.all?.away ?? null,
    
    homeXg: data.np_expected_goals?.all?.home ?? null,
    awayXg: data.np_expected_goals?.all?.away ?? null,
    
    homeShots: data.shots?.total?.all?.home ?? null,
    awayShots: data.shots?.total?.all?.away ?? null,
    homeShotsOnTarget: data.shots?.on_target?.all?.home ?? null,
    awayShotsOnTarget: data.shots?.on_target?.all?.away ?? null,
    homeShotsOffTarget: data.shots?.off_target?.all?.home ?? null,
    awayShotsOffTarget: data.shots?.off_target?.all?.away ?? null,
    homeShotsBlocked: data.shots?.blocked?.all?.home ?? null,
    awayShotsBlocked: data.shots?.blocked?.all?.away ?? null,
    
    homeCorners: data.attack?.corners?.all?.home ?? null,
    awayCorners: data.attack?.corners?.all?.away ?? null,
    
    homeFouls: data.overview?.fouls?.all?.home ?? null,
    awayFouls: data.overview?.fouls?.all?.away ?? null,
    
    homePassesTotal: data.passes?.total?.all?.home ?? null,
    awayPassesTotal: data.passes?.total?.all?.away ?? null,
    homePassesAccurate: data.passes?.accurate?.all?.home ?? null,
    awayPassesAccurate: data.passes?.accurate?.all?.away ?? null,
    
    homeTackles: data.defending?.tackles?.all?.home ?? null,
    awayTackles: data.defending?.tackles?.all?.away ?? null,
    homeInterceptions: data.defending?.interceptions?.all?.home ?? null,
    awayInterceptions: data.defending?.interceptions?.all?.away ?? null,
    homeClearances: data.defending?.clearances?.all?.home ?? null,
    awayClearances: data.defending?.clearances?.all?.away ?? null,
    
    homeSaves: data.goalkeeping?.saves?.all?.home ?? null,
    awaySaves: data.goalkeeping?.saves?.all?.away ?? null,
  }
}

export function mapApiOddsToMatchOdds(
  apiOdds: any[], 
  matchId: string, 
  bookmakerMap: Map<string, string>, 
  marketMap: Map<string, string>
): Prisma.MatchOddsCreateManyInput[] {
  const oddsInputs: Prisma.MatchOddsCreateManyInput[] = []
  
  // Função auxiliar para evitar DRY
  const addOdd = (bookieCode: string, marketKey: string, selection: string, odds: number | null, line: number | null = null) => {
    if (odds === null || isNaN(odds)) return
    const bookmakerId = bookmakerMap.get(bookieCode)
    const marketId = marketMap.get(marketKey)
    if (!bookmakerId || !marketId) return
    
    oddsInputs.push({
      matchId,
      bookmakerId,
      marketId,
      selection,
      line,
      oddsType: 'PREMATCH_CLOSING',
      odds
    })
  }

  for (const b of apiOdds) {
    const bookieCode = b.bookmaker.toLowerCase() // ex: pinnacle -> pinnacle, mas e se for bet365? Mapearemos.
    let mappedBookie = bookieCode
    if (bookieCode === 'pinnacle') mappedBookie = 'pinnacle'
    else if (bookieCode === 'bet365') mappedBookie = 'bet365'
    else if (bookieCode === 'bfex') mappedBookie = 'betfair-exchange'
    
    if (b.markets?.match_odds) {
      addOdd(mappedBookie, 'match_odds', 'home', parseFloat(b.markets.match_odds.home?.last_seen))
      addOdd(mappedBookie, 'match_odds', 'draw', parseFloat(b.markets.match_odds.draw?.last_seen))
      addOdd(mappedBookie, 'match_odds', 'away', parseFloat(b.markets.match_odds.away?.last_seen))
    }
    if (b.markets?.btts) {
      addOdd(mappedBookie, 'both_teams_to_score', 'yes', parseFloat(b.markets.btts.yes?.last_seen))
      addOdd(mappedBookie, 'both_teams_to_score', 'no', parseFloat(b.markets.btts.no?.last_seen))
    }
    if (b.markets?.total_goals && b.markets.total_goals['2.5']) {
      addOdd(mappedBookie, 'total_goals_2_5', 'over', parseFloat(b.markets.total_goals['2.5'].over?.last_seen), 2.5)
      addOdd(mappedBookie, 'total_goals_2_5', 'under', parseFloat(b.markets.total_goals['2.5'].under?.last_seen), 2.5)
    }
    if (b.markets?.asian_handicap) {
      const ahKeys = Object.keys(b.markets.asian_handicap)
      if (ahKeys.length > 0) {
        const primaryLine = ahKeys[0]
        const lineVal = parseFloat(primaryLine)
        addOdd(mappedBookie, 'asian_handicap', 'home', parseFloat(b.markets.asian_handicap[primaryLine].home?.last_seen), lineVal)
        addOdd(mappedBookie, 'asian_handicap', 'away', parseFloat(b.markets.asian_handicap[primaryLine].away?.last_seen), lineVal)
      }
    }
  }

  return oddsInputs
}

export function mapApiPlayerStatsToPlayerMatchStats(
  apiPlayerStats: ApiPlayerStatsResponse, 
  matchId: string, 
  teamMap: Map<string, string>, // ApiTeamId -> PrismaTeamId
  playerMap: Map<string, string> // ApiPlayerId -> PrismaPlayerId
): Prisma.PlayerMatchStatsCreateManyInput[] {
  const inputs: Prisma.PlayerMatchStatsCreateManyInput[] = []
  
  for (const stat of apiPlayerStats.data) {
    const teamId = teamMap.get(stat.team_id)
    const playerId = playerMap.get(stat.player_id)
    if (!teamId || !playerId) continue

    inputs.push({
      matchId,
      teamId,
      playerId,
      rating: stat.rating,
      minutesPlayed: stat.minutes_played,
      started: stat.started,
      played: stat.played,
      passesTotal: stat.passing?.total ?? null,
      passesAccurate: stat.passing?.accurate ?? null,
      keyPasses: stat.passing?.key_passes ?? null,
      shotsTotal: stat.shooting?.total ?? null,
      shotsOnTarget: stat.shooting?.on_target ?? null,
      goals: stat.shooting?.goals ?? null,
      expectedGoals: stat.shooting?.expected_goals ?? null,
      duelsTotal: stat.duels?.total ?? null,
      duelsWon: stat.duels?.won ?? null,
      tackles: stat.defending?.tackles ?? null,
      interceptions: stat.defending?.interceptions ?? null,
      clearances: stat.defending?.clearances ?? null,
      dribblesAttempted: stat.general?.dribbles_attempted ?? null,
      dribblesSucceeded: stat.general?.dribbles_succeeded ?? null,
      foulsDrawn: stat.general?.fouls_drawn ?? null,
      foulsCommitted: stat.general?.fouls_committed ?? null,
      yellowCards: stat.general?.yellow_cards ?? null,
      redCards: stat.general?.red_cards ?? null,
    })
  }

  return inputs
}

export function mapApiShotmapToShots(
  apiShotmap: ApiShotmapResponse, 
  matchId: string,
  teamMap: Map<string, string>,
  playerMap: Map<string, string>
): Prisma.ShotCreateManyInput[] {
  const inputs: Prisma.ShotCreateManyInput[] = []

  for (const shot of apiShotmap.data) {
    const teamId = teamMap.get(shot.team_id)
    const playerId = playerMap.get(shot.player_id)
    if (!teamId || !playerId) continue

    inputs.push({
      externalId: shot.id,
      matchId,
      teamId,
      playerId,
      x: shot.x,
      y: shot.y,
      minute: shot.minute,
      result: shot.result as any,
      expectedGoals: shot.expected_goals,
      situation: shot.situation as any,
      bodyPart: shot.body_part as any,
      isGoal: shot.is_goal,
      isOnTarget: shot.is_on_target,
      isHeaded: shot.is_headed,
      isOutsideBox: shot.is_outside_box,
      isPenalty: shot.is_penalty,
      goalMouthLocation: shot.goal_mouth_location
    })
  }

  return inputs
}
