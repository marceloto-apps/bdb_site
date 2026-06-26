import { prisma } from '../lib/prisma'

async function main() {
  const bookmakers = await prisma.bookmaker.findMany()
  console.log("Bookmakers in DB:", bookmakers)
  await prisma.$disconnect()
}

main().catch(console.error)
