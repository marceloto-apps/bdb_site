// prisma/seed-reference.ts
// Seed de dados de referência: Bookmakers e Markets
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Bookmakers disponíveis na TheStatsAPI
  const bookmakers = [
    { name: 'Pinnacle', slug: 'pinnacle', isSharp: true },
    { name: 'Bet365', slug: 'bet365', isSharp: false },
    { name: 'Betfair Exchange', slug: 'betfair-exchange', isSharp: false },
    { name: 'Kambi', slug: 'kambi', isSharp: false },
  ]

  for (const bk of bookmakers) {
    await prisma.bookmaker.upsert({
      where: { slug: bk.slug },
      update: {},
      create: bk,
    })
  }
  console.log(`✅ ${bookmakers.length} bookmakers inseridos`)

  // Mercados de odds suportados
  const markets = [
    { key: 'match_odds', name: '1X2', category: '1x2' },
    { key: 'btts', name: 'BTTS', category: 'btts' },
    { key: 'total_goals_0_5', name: 'Over/Under 0.5', category: 'totals' },
    { key: 'total_goals_1_5', name: 'Over/Under 1.5', category: 'totals' },
    { key: 'total_goals_2_5', name: 'Over/Under 2.5', category: 'totals' },
    { key: 'total_goals_3_5', name: 'Over/Under 3.5', category: 'totals' },
    { key: 'total_goals_4_5', name: 'Over/Under 4.5', category: 'totals' },
    { key: 'match_corners_9_5', name: 'Corners Over/Under 9.5', category: 'corners' },
    { key: 'asian_handicap', name: 'Handicap Asiático', category: 'handicap' },
  ]

  for (const mk of markets) {
    await prisma.market.upsert({
      where: { key: mk.key },
      update: {},
      create: mk,
    })
  }
  console.log(`✅ ${markets.length} markets inseridos`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
