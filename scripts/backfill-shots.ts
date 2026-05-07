// scripts/backfill-shots.ts
// Rodar com: npx tsx scripts/backfill-shots.ts --dryRun --limit=3

import { PrismaClient } from '@prisma/client'
import { mapShot } from '../lib/api/ingest/mappers/shot-mapper'

const prisma = new PrismaClient()

const BASE_URL = process.env.THESTATSAPI_BASE_URL || 'https://api.thestatsapi.com/api/football'
const API_KEY = process.env.THESTATSAPI_KEY
const THROTTLE_MS = 2100

async function main() {
  console.log('🚀 Iniciando backfill de Shots...')

  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dryRun')
  const limitArg = args.find((a) => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

  if (!API_KEY) {
    console.error('❌ ERRO: THESTATSAPI_KEY não configurada no .env')
    process.exit(1)
  }

  // Cache de mapeamento
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

  if (playerMap.size === 0) {
    console.error('❌ Tabela Player está vazia. Rode o backfill de player-stats antes do shots.')
    process.exit(1)
  }

  // Jogos pendentes
  const existingShotMatchIds = await prisma.shot.findMany({
    select: { matchId: true },
    distinct: ['matchId'],
  })
  const existingSet = new Set(existingShotMatchIds.map((r) => r.matchId))

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
  let shotsCreated = 0
  let matchesWithoutXg = 0
  let errors = 0

  for (const match of pending) {
    try {
      await new Promise((r) => setTimeout(r, THROTTLE_MS))

      const url = `${BASE_URL}/matches/${match.externalId}/shotmap`
      console.log(`Buscando shotmap para match ${match.externalId}...`)

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      }

      const json = await res.json()
      const shotsData = json.data

      if (!shotsData || !Array.isArray(shotsData) || shotsData.length === 0) {
        matchesWithoutXg++
        success++
        continue
      }

      const shotsToCreate: any[] = []

      for (const sd of shotsData) {
        const mapped = mapShot(match.id, teamMap, playerMap, sd)
        
        // Verifica se conseguiu mapear o Team e o Player
        if (!mapped.teamId) {
          console.warn(`[Shots] Time ${sd.team_id} não encontrado para o chute ${sd.id}`)
          continue
        }
        if (!mapped.playerId) {
          console.warn(`[Shots] Jogador ${sd.player_id} não encontrado para o chute ${sd.id}`)
          continue
        }

        shotsToCreate.push(mapped)
      }

      if (!isDryRun && shotsToCreate.length > 0) {
        await prisma.shot.createMany({ data: shotsToCreate })
      }

      shotsCreated += shotsToCreate.length
      success++

      if (success % 25 === 0 && !isDryRun) {
        console.log(`✅ Progresso: ${success}/${pending.length} (${shotsCreated} chutes inseridos)`)
      }
    } catch (e) {
      errors++
      console.error(`❌ Erro em ${match.externalId}: ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log(`\n🏁 Finalizado: ${success} jogos, ${shotsCreated} chutes, ${matchesWithoutXg} jogos sem xG, ${errors} erros`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Fatal Error:', e)
  process.exit(1)
})
