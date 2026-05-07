import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  
  const resShots = await prisma.shot.deleteMany({})
  console.log(`Deletados ${resShots.count} registros de Chutes.`)
  
  const resPms = await prisma.playerMatchStats.deleteMany({})
  console.log(`Deletados ${resPms.count} registros de PlayerMatchStats.`)
  
  await prisma.$disconnect()
}

main()
