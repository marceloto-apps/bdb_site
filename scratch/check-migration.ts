import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const matchV2Count = await prisma.matchV2.count()
  const oddsCount = await prisma.matchOdds.count()
  console.log(`MatchV2 count: ${matchV2Count}`)
  console.log(`MatchOdds count: ${oddsCount}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
