import { prisma } from '@/lib/prisma'
import { 
  fetchAllFinishedMatches, 
  fetchAllScheduledMatches, 
  fetchMatchOdds,
  fetchMatchStats,
  fetchMatchShotmap,
  fetchMatchPlayerStats
} from './thestatsapi/endpoints'
import { 
  mapApiMatchToMatch, 
  mapApiStatsToMatchStats, 
  mapApiOddsToMatchOdds,
  mapApiShotmapToShots,
  mapApiPlayerStatsToPlayerMatchStats
} from './thestatsapi/mappers'

export interface SyncOptions {
  leagueSlug: string
  mode: 'full' | 'incremental'
  includeOdds: boolean
  includeFuture: boolean
  limit?: number
}

export interface SyncResult {
  matchesProcessed: number
  matchesCreated: number
  matchesUpdated: number
  matchesSkipped: number
  oddsUpdated: number
  statsUpdated: number
  shotsUpdated: number
  playersUpdated: number
  requestsUsed: number
  errors: string[]
}

export async function syncLeague(options: SyncOptions): Promise<SyncResult> {
  const result: SyncResult = {
    matchesProcessed: 0,
    matchesCreated: 0,
    matchesUpdated: 0,
    matchesSkipped: 0,
    oddsUpdated: 0,
    statsUpdated: 0,
    shotsUpdated: 0,
    playersUpdated: 0,
    requestsUsed: 0,
    errors: []
  }

  try {
    const competition = await prisma.competition.findUnique({
      where: { slug: options.leagueSlug }
    })

    if (!competition) {
      throw new Error(`Competition ${options.leagueSlug} não encontrada.`)
    }

    const season = await prisma.season.findFirst({
      where: { competitionId: competition.id, isCurrent: true }
    })

    if (!season) {
      throw new Error(`Nenhuma Season ativa encontrada para ${competition.name}.`)
    }

    // Carregar mapas globais para odds
    const bookmakers = await prisma.bookmaker.findMany()
    const bookmakerMap = new Map(bookmakers.map(b => [b.slug, b.id]))

    const markets = await prisma.market.findMany()
    const marketMap = new Map(markets.map(m => [m.key, m.id]))

    // 4. GET /matches?competition_id&season_id&status=finished → upsert Match
    const matches = await fetchAllFinishedMatches(competition.externalId)
    if (options.includeFuture) {
      const scheduled = await fetchAllScheduledMatches(competition.externalId)
      matches.push(...scheduled)
    }

    let matchesToProcess = matches
    if (options.limit && options.limit > 0) {
      matchesToProcess = matches.slice(0, options.limit)
      console.log(`[sync] Limitado a ${options.limit} partidas (modo teste)`)
    }

    for (const apiMatch of matchesToProcess) {
      result.matchesProcessed++

      try {
        const existingMatch = await prisma.match.findUnique({
          where: { externalId: apiMatch.id.toString() }
        })

        const prevStatus = existingMatch?.status
        const mappedMatch = mapApiMatchToMatch(apiMatch, season.id)
        let matchId = ''

        if (existingMatch) {
          if (options.mode === 'incremental' && existingMatch.ftr !== null && !options.includeOdds) {
            result.matchesSkipped++
            continue
          }

          const updated = await prisma.match.update({
            where: { id: existingMatch.id },
            data: mappedMatch
          })
          matchId = updated.id
          result.matchesUpdated++
        } else {
          const created = await prisma.match.create({
            data: mappedMatch
          })
          matchId = created.id
          result.matchesCreated++
        }

        // Chamar avaliação de palpites para qualquer partida finalizada que tenha placar
        if (mappedMatch.status === 'FINISHED' && mappedMatch.fthg !== null && mappedMatch.fthg !== undefined && mappedMatch.ftag !== null && mappedMatch.ftag !== undefined) {
          const { avaliarPalpitesDePartida } = await import('@/lib/bolao/avaliarPalpite')
          await avaliarPalpitesDePartida(matchId, mappedMatch.fthg, mappedMatch.ftag)
        }

        const matchRecord = await prisma.match.findUnique({
          where: { id: matchId },
          include: {
            stats: true,
            odds: { take: 1 },
            shots: { take: 1 },
            playerStats: { take: 1 },
            homeTeam: true,
            awayTeam: true
          }
        })

        if (!matchRecord) continue

        // 5b. MatchStats
        if (apiMatch.status === 'finished' || apiMatch.xg_available) {
          if (!matchRecord.stats || options.mode === 'full') {
            const statsData = await fetchMatchStats(apiMatch.id)
            result.requestsUsed++
            if (statsData) {
              const mappedStats = mapApiStatsToMatchStats(statsData, matchId)
              if (matchRecord.stats) {
                await prisma.matchStats.update({
                  where: { id: matchRecord.stats.id },
                  data: mappedStats
                })
              } else {
                await prisma.matchStats.create({
                  data: mappedStats
                })
              }
              result.statsUpdated++
            }
          }
        }

        // 5c. MatchOdds
        if (options.includeOdds && apiMatch.odds_available) {
          if (matchRecord.odds.length === 0 || options.mode === 'full') {
            const oddsData = await fetchMatchOdds(apiMatch.id)
            result.requestsUsed++
            if (oddsData.bookmakers && oddsData.bookmakers.length > 0) {
              const oddsInputs = mapApiOddsToMatchOdds(oddsData.bookmakers, matchId, bookmakerMap, marketMap)
              
              // Deletar existentes se for modo full para re-inserir limpo
              if (matchRecord.odds.length > 0 && options.mode === 'full') {
                await prisma.matchOdds.deleteMany({ where: { matchId } })
              }
              
              if (oddsInputs.length > 0) {
                await prisma.matchOdds.createMany({
                  data: oddsInputs,
                  skipDuplicates: true
                })
                result.oddsUpdated++
              }
            }
          }
        }

        // Helpers para mapeamento de times
        const teamMap = new Map<string, string>()
        teamMap.set(apiMatch.home_team.id, matchRecord.homeTeamId)
        teamMap.set(apiMatch.away_team.id, matchRecord.awayTeamId)

        // 5e. PlayerMatchStats
        if (apiMatch.xg_available) {
          if (matchRecord.playerStats.length === 0 || options.mode === 'full') {
            const playerStatsData = await fetchMatchPlayerStats(apiMatch.id)
            result.requestsUsed++
            
            if (playerStatsData && playerStatsData.data) {
              // Primeiro upsert de todos os players
              for (const pStat of playerStatsData.data) {
                await prisma.player.upsert({
                  where: { externalId: pStat.player_id.toString() },
                  create: {
                    externalId: pStat.player_id.toString(),
                    name: pStat.player_name,
                    position: pStat.position as any,
                    currentTeamId: teamMap.get(pStat.team_id)
                  },
                  update: {
                    name: pStat.player_name,
                    position: pStat.position as any,
                    currentTeamId: teamMap.get(pStat.team_id)
                  }
                })
              }

              // Carregar os IDs gerados
              const playersInMatch = playerStatsData.data.map((p: any) => p.player_id.toString())
              const dbPlayers = await prisma.player.findMany({
                where: { externalId: { in: playersInMatch } }
              })
              const playerMap = new Map(dbPlayers.map(p => [p.externalId, p.id]))

              const pStatsInputs = mapApiPlayerStatsToPlayerMatchStats(playerStatsData, matchId, teamMap, playerMap)
              
              if (matchRecord.playerStats.length > 0 && options.mode === 'full') {
                await prisma.playerMatchStats.deleteMany({ where: { matchId } })
              }

              if (pStatsInputs.length > 0) {
                await prisma.playerMatchStats.createMany({
                  data: pStatsInputs,
                  skipDuplicates: true
                })
                result.playersUpdated++
              }
            }
          }

          // 5d. Shotmap
          if (matchRecord.shots.length === 0 || options.mode === 'full') {
            const shotmapData = await fetchMatchShotmap(apiMatch.id)
            result.requestsUsed++
            
            if (shotmapData && shotmapData.data) {
              // Os players já devem ter sido criados no passo 5e, mas se algum faltou,
              // precisaria criar, mas na prática player_stats contém todos os que chutaram.
              const playersInMatch = shotmapData.data.map((s: any) => s.player_id.toString())
              const dbPlayers = await prisma.player.findMany({
                where: { externalId: { in: playersInMatch } }
              })
              const playerMap = new Map(dbPlayers.map(p => [p.externalId, p.id]))

              const shotsInputs = mapApiShotmapToShots(shotmapData, matchId, teamMap, playerMap)
              
              if (matchRecord.shots.length > 0 && options.mode === 'full') {
                await prisma.shot.deleteMany({ where: { matchId } })
              }

              if (shotsInputs.length > 0) {
                await prisma.shot.createMany({
                  data: shotsInputs,
                  skipDuplicates: true
                })
                result.shotsUpdated++
              }
            }
          }
        }
      } catch (err: any) {
        result.errors.push(`Erro na partida ${apiMatch.id}: ${err.message}`)
      }
    }
  } catch (err: any) {
    result.errors.push(`Erro fatal no sync: ${err.message}`)
  }

  return result
}
