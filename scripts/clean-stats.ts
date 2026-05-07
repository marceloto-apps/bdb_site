import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  const res = await prisma.matchStats.deleteMany({})
  console.log(`Deleted ${res.count} MatchStats records.`)
  await prisma.$disconnect()
}

main()
