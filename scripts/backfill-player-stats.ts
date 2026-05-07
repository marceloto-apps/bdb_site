// scripts/backfill-player-stats.ts
// Rodar com: npx tsx scripts/backfill-player-stats.ts --dryRun --limit=3

import { PrismaClient } from '@prisma/client'
import { mapPlayerMatchStats } from '../lib/api/ingest/mappers/player-match-stats-mapper'

const prisma = new PrismaClient()

const BASE_URL = process.env.THESTATSAPI_BASE_URL || 'https://api.thestatsapi.com/api/football'
const API_KEY = process.env.THESTATSAPI_KEY
const THROTTLE_MS = 2100

async function main() {
  console.log('🚀 Iniciando backfill de PlayerMatchStats...')

  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dryRun')
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

  if (!API_KEY) {
    console.error('❌ ERRO: THESTATSAPI_KEY não configurada no .env')
    process.exit(1)
  }

  // Cache de mapeamento externalId → id interno
  const teamsFromDb = await prisma.team.findMany({
    select: { id: true, externalId: true },
  })
  const teamMap = new Map<string, string>()
  for (const t of teamsFromDb) {
    if (t.externalId) teamMap.set(t.externalId, t.id)
  }

  const playersFromDb = await prisma.player.findMany({
    select: { id: true, externalId: true },
  })
  const playerMap = new Map<string, string>()
  for (const p of playersFromDb) {
    if (p.externalId) playerMap.set(p.externalId, p.id)
  }

  // Busca jogos pendentes
  const existingPmsMatchIds = await prisma.playerMatchStats.findMany({
    select: { matchId: true },
    distinct: ['matchId'],
  })
  const existingSet = new Set(existingPmsMatchIds.map((r) => r.matchId))

  const matches = await prisma.match.findMany({
    where: { status: 'FINISHED' },
    select: { id: true, externalId: true },
    orderBy: { utcDate: 'asc' },
  })

  let pending = matches.filter((m) => !existingSet.has(m.id))

  if (limit) {
    pending = pending.slice(0, limit)
  }

  console.log(`📊 ${pending.length} jogos pendentes de ${matches.length} total`)
  if (isDryRun) {
    console.log(`⚠️ MODO DRY-RUN: Nenhum dado será salvo no banco.`)
  }

  let success = 0
  let playersCreated = 0
  let playerStatsCreated = 0
  let errors = 0

  const positionMap: Record<string, string> = {
    F: 'FORWARD',
    M: 'MIDFIELDER',
    D: 'DEFENDER',
    G: 'GOALKEEPER',
  }

  for (const match of pending) {
    try {
      await new Promise((r) => setTimeout(r, THROTTLE_MS))

      const url = `${BASE_URL}/matches/${match.externalId}/player-stats`
      console.log(`Buscando player-stats para match ${match.externalId}...`)

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      }

      const json = await res.json()
      const playersData = json.data

      if (!playersData || !Array.isArray(playersData) || playersData.length === 0) {
        console.warn(`⚠️  ${match.externalId}: array vazio de jogadores`)
        continue
      }

      const playerStatsToCreate: any[] = []

      for (const pd of playersData) {
        let internalPlayerId = playerMap.get(pd.player_id)
        const internalTeamId = teamMap.get(pd.team_id)

        if (!internalPlayerId) {
          // Jogador novo
          const position = positionMap[pd.position] || 'FORWARD'

          if (!isDryRun) {
            const newPlayer = await prisma.player.create({
              data: {
                externalId: pd.player_id,
                name: pd.player_name,
                position: position as any,
                currentTeamId: internalTeamId || null,
              },
            })
            internalPlayerId = newPlayer.id
            playerMap.set(pd.player_id, newPlayer.id)
          } else {
            // Em dry-run, simulamos o ID interno para não quebrar a lógica abaixo
            internalPlayerId = `mock_player_id_${pd.player_id}`
            playerMap.set(pd.player_id, internalPlayerId)
          }
          playersCreated++
        }

        if (!internalTeamId) {
          console.warn(`[PlayerStats] Time ${pd.team_id} não encontrado para ${pd.player_name}`)
          continue
        }

        playerStatsToCreate.push(mapPlayerMatchStats(match.id, internalTeamId, internalPlayerId, pd))
      }

      if (!isDryRun && playerStatsToCreate.length > 0) {
        await prisma.playerMatchStats.createMany({
          data: playerStatsToCreate,
        })
      }

      playerStatsCreated += playerStatsToCreate.length
      success++

      if (success % 25 === 0 && !isDryRun) {
        console.log(`✅ Progresso: ${success}/${pending.length} (${playersCreated} jogadores novos, ${playerStatsCreated} stats)`)
      }
    } catch (e) {
      errors++
      console.error(`❌ Erro em ${match.externalId}: ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log(`\n🏁 Finalizado: ${success} jogos, ${playersCreated} jogadores criados, ${playerStatsCreated} stats, ${errors} erros`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Fatal Error:', e)
  process.exit(1)
})
