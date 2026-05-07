// scripts/backfill-match-stats.ts
// Rodar com: npx tsx scripts/backfill-match-stats.ts --dryRun --limit=3

import { PrismaClient } from '@prisma/client'
import { mapMatchStats } from '../lib/api/ingest/mappers/match-stats-mapper'

const prisma = new PrismaClient()

const BASE_URL = process.env.THESTATSAPI_BASE_URL || 'https://api.thestatsapi.com/api/football'
const API_KEY = process.env.THESTATSAPI_KEY
const THROTTLE_MS = 2100

async function main() {
  console.log('🚀 Iniciando backfill de MatchStats...')

  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dryRun')
  const limitArg = args.find(a => a.startsWith('--limit='))
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

  if (!API_KEY) {
    console.error('❌ ERRO: THESTATSAPI_KEY não configurada no .env')
    process.exit(1)
  }

  // Buscar todos os jogos pendentes
  const existing = await prisma.matchStats.findMany({ select: { matchId: true } })
  const existingSet = new Set(existing.map((r) => r.matchId))

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
  let errors = 0

  for (const match of pending) {
    try {
      // throttle
      await new Promise((r) => setTimeout(r, THROTTLE_MS))

      const url = `${BASE_URL}/matches/${match.externalId}/stats`
      console.log(`Buscando stats para match ${match.externalId}...`)
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`)
      }

      const json = await res.json()
      const data = json.data

      if (!data || Object.keys(data).length === 0) {
        console.warn(`⚠️  ${match.externalId}: sem dados na API`)
        continue
      }

      // Usar o mapper criado
      const mapped = mapMatchStats(match.id, data)

      if (isDryRun) {
        console.log(`[DRY-RUN] Mapper Output para ${match.externalId}:`, mapped)
      } else {
        await prisma.matchStats.create({ data: mapped })
      }

      success++
      if (success % 50 === 0 && !isDryRun) {
        console.log(`✅ Progresso: ${success}/${pending.length}`)
      }
    } catch (e) {
      errors++
      console.error(`❌ Erro em ${match.externalId}: ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log(`\n🏁 Finalizado: ${success} OK, ${errors} erros`)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error('Fatal Error:', e)
  process.exit(1)
})
