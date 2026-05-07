// prisma/migrate-to-normalized.ts
// Migra dados do schema legado (Match monolítico + League) para o novo schema normalizado
// Volume: 896 matches, 27 teams, 1 league — cabe em transação única

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Iniciando migração para schema normalizado...')

  // ========================================
  // PASSO 1: League → Competition + Season
  // ========================================
  const leagues = await prisma.league.findMany()
  console.log(`📋 ${leagues.length} liga(s) para migrar`)

  const leagueToCompetitionMap: Record<string, string> = {}
  const leagueToSeasonMap: Record<string, string> = {}

  for (const league of leagues) {
    // Criar Competition
    const competition = await prisma.competition.upsert({
      where: { slug: league.slug },
      update: {},
      create: {
        externalId: league.externalId ?? `comp_auto_${league.id}`,
        name: league.name,
        country: league.country,
        countryCode: 'BR', // Brasileirão — ajustar se houver outras ligas
        type: 'LEAGUE',
        tier: league.tier,
        active: league.active,
        slug: league.slug,
        hasTeamStats: true,
        hasPlayerStats: true,
        xgAvailable: true,
      },
    })
    leagueToCompetitionMap[league.id] = competition.id

    // Criar Season
    const season = await prisma.season.upsert({
      where: {
        competitionId_year: {
          competitionId: competition.id,
          year: league.season,
        },
      },
      update: {},
      create: {
        externalId: `sn_auto_${league.id}_${league.season}`,
        competitionId: competition.id,
        year: league.season,
        isCurrent: true,
      },
    })
    leagueToSeasonMap[league.id] = season.id

    console.log(`  ✅ Liga "${league.name}" → Competition "${competition.id}" + Season "${season.id}"`)
  }

  // ========================================
  // PASSO 2: Team → TeamAlias + TeamSeason
  // ========================================
  const teams = await prisma.team.findMany()
  console.log(`\n📋 ${teams.length} time(s) para migrar`)

  for (const team of teams) {
    // Criar TeamAlias com o nome atual como alias da fonte THESTATSAPI
    await prisma.teamAlias.upsert({
      where: {
        alias_source: {
          alias: team.name,
          source: 'THESTATSAPI',
        },
      },
      update: {},
      create: {
        teamId: team.id,
        alias: team.name,
        source: 'THESTATSAPI',
      },
    })

    // Criar TeamSeason para cada Season existente
    // (no MVP temos apenas 1 season por league)
    for (const [leagueId, seasonId] of Object.entries(leagueToSeasonMap)) {
      // Verificar se o time jogou nesta liga (tem matches)
      const matchCount = await prisma.match.count({
        where: {
          leagueId,
          OR: [
            { homeTeamId: team.id },
            { awayTeamId: team.id },
          ],
        },
      })

      if (matchCount > 0) {
        await prisma.teamSeason.upsert({
          where: {
            teamId_seasonId: {
              teamId: team.id,
              seasonId,
            },
          },
          update: {},
          create: {
            teamId: team.id,
            seasonId,
          },
        })
      }
    }
  }
  console.log(`  ✅ ${teams.length} aliases e teamSeasons criados`)

  // ========================================
  // PASSO 3: Match → MatchV2 + MatchStats + MatchOdds
  // ========================================
  const matches = await prisma.match.findMany()
  console.log(`\n📋 ${matches.length} partida(s) para migrar`)

  // Pré-carregar IDs de Bookmakers e Markets para lookup rápido
  const bookmakers = await prisma.bookmaker.findMany()
  const markets = await prisma.market.findMany()

  const bkMap: Record<string, string> = {}
  for (const bk of bookmakers) bkMap[bk.slug] = bk.id

  const mkMap: Record<string, string> = {}
  for (const mk of markets) mkMap[mk.key] = mk.id

  let matchesCreated = 0
  let statsCreated = 0
  let oddsCreated = 0

  for (const match of matches) {
    const seasonId = leagueToSeasonMap[match.leagueId]
    if (!seasonId) {
      console.warn(`  ⚠️ Match ${match.id} tem leagueId ${match.leagueId} sem season mapeada — pulando`)
      continue
    }

    // Criar MatchV2
    const hasStats = match.homeXg !== null || match.homePossession !== null
    const hasOdds = match.pinHome !== null || match.b365Home !== null

    const matchV2 = await prisma.matchV2.upsert({
      where: { externalId: match.externalId ?? `mt_auto_${match.id}` },
      update: {},
      create: {
        externalId: match.externalId ?? `mt_auto_${match.id}`,
        seasonId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        round: match.round,
        status: 'FINISHED',
        utcDate: match.date,
        fthg: match.fthg,
        ftag: match.ftag,
        ftr: match.ftr,
        xgAvailable: hasStats,
        oddsAvailable: hasOdds,
        dataSource: match.dataSource,
        sourceFile: match.sourceFile,
        syncedAt: match.syncedAt,
      },
    })
    matchesCreated++

    // Criar MatchStats (se houver dados)
    if (hasStats) {
      await prisma.matchStats.upsert({
        where: { matchId: matchV2.id },
        update: {},
        create: {
          matchId: matchV2.id,
          homeXg: match.homeXg,
          awayXg: match.awayXg,
          homePossession: match.homePossession,
          awayPossession: match.awayPossession,
          homeShots: match.homeShots,
          awayShots: match.awayShots,
          homeShotsOnTarget: match.homeShotsOT,
          awayShotsOnTarget: match.awayShotsOT,
          homeCorners: match.homeCorners,
          awayCorners: match.awayCorners,
        },
      })
      statsCreated++
    }

    // Criar MatchOdds
    // Helper para inserir uma odd se o valor não for null
    const insertOdd = async (
      bookmkerSlug: string,
      marketKey: string,
      selection: string,
      line: number | null,
      oddsType: 'PREMATCH_OPENING' | 'PREMATCH_CLOSING',
      value: number | null
    ) => {
      if (value === null || value === undefined) return
      const bookmakerId = bkMap[bookmkerSlug]
      const marketId = mkMap[marketKey]
      if (!bookmakerId || !marketId) return

      try {
        await prisma.matchOdds.create({
          data: {
            matchId: matchV2.id,
            bookmakerId,
            marketId,
            selection,
            line,
            oddsType,
            odds: value,
          },
        })
        oddsCreated++
      } catch {
        // Unique constraint — já existe, ignorar
      }
    }

    // Pinnacle — closing (campos pinHome, pinDraw, pinAway, etc.)
    await insertOdd('pinnacle', 'match_odds', 'home', null, 'PREMATCH_CLOSING', match.pinHome)
    await insertOdd('pinnacle', 'match_odds', 'draw', null, 'PREMATCH_CLOSING', match.pinDraw)
    await insertOdd('pinnacle', 'match_odds', 'away', null, 'PREMATCH_CLOSING', match.pinAway)
    await insertOdd('pinnacle', 'total_goals_2_5', 'over', 2.5, 'PREMATCH_CLOSING', match.pinOver25)
    await insertOdd('pinnacle', 'total_goals_2_5', 'under', 2.5, 'PREMATCH_CLOSING', match.pinUnder25)
    await insertOdd('pinnacle', 'btts', 'yes', null, 'PREMATCH_CLOSING', match.pinBttsYes)
    await insertOdd('pinnacle', 'btts', 'no', null, 'PREMATCH_CLOSING', match.pinBttsNo)
    await insertOdd('pinnacle', 'asian_handicap', 'home', match.pinAhLine, 'PREMATCH_CLOSING', match.pinAhHome)
    await insertOdd('pinnacle', 'asian_handicap', 'away', match.pinAhLine, 'PREMATCH_CLOSING', match.pinAhAway)

    // Pinnacle — opening
    await insertOdd('pinnacle', 'match_odds', 'home', null, 'PREMATCH_OPENING', match.pinOpenHome)
    await insertOdd('pinnacle', 'match_odds', 'draw', null, 'PREMATCH_OPENING', match.pinOpenDraw)
    await insertOdd('pinnacle', 'match_odds', 'away', null, 'PREMATCH_OPENING', match.pinOpenAway)

    // Bet365
    await insertOdd('bet365', 'match_odds', 'home', null, 'PREMATCH_CLOSING', match.b365Home)
    await insertOdd('bet365', 'match_odds', 'draw', null, 'PREMATCH_CLOSING', match.b365Draw)
    await insertOdd('bet365', 'match_odds', 'away', null, 'PREMATCH_CLOSING', match.b365Away)
    await insertOdd('bet365', 'total_goals_2_5', 'over', 2.5, 'PREMATCH_CLOSING', match.b365Over25)
    await insertOdd('bet365', 'total_goals_2_5', 'under', 2.5, 'PREMATCH_CLOSING', match.b365Under25)

    // Betfair Exchange
    await insertOdd('betfair-exchange', 'match_odds', 'home', null, 'PREMATCH_CLOSING', match.bfexHome)
    await insertOdd('betfair-exchange', 'match_odds', 'draw', null, 'PREMATCH_CLOSING', match.bfexDraw)
    await insertOdd('betfair-exchange', 'match_odds', 'away', null, 'PREMATCH_CLOSING', match.bfexAway)
  }

  console.log(`\n📊 Resumo da migração:`)
  console.log(`  Matches migrados:  ${matchesCreated}`)
  console.log(`  MatchStats criados: ${statsCreated}`)
  console.log(`  MatchOdds criados:  ${oddsCreated}`)

  // ========================================
  // PASSO 4: Validação
  // ========================================
  const totalMatchAntigo = await prisma.match.count()
  const totalMatchV2 = await prisma.matchV2.count()
  const totalStats = await prisma.matchStats.count()
  const totalOdds = await prisma.matchOdds.count()

  console.log(`\n✅ Validação:`)
  console.log(`  Match antigo: ${totalMatchAntigo}`)
  console.log(`  MatchV2:      ${totalMatchV2}`)
  console.log(`  MatchStats:   ${totalStats}`)
  console.log(`  MatchOdds:    ${totalOdds}`)

  if (totalMatchAntigo !== totalMatchV2) {
    console.error(`❌ DIVERGÊNCIA! Match antigo (${totalMatchAntigo}) ≠ MatchV2 (${totalMatchV2})`)
    console.error('   NÃO prosseguir com a remoção das tabelas legadas!')
  } else {
    console.log(`  ✅ Contagens batem — migração bem-sucedida`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
