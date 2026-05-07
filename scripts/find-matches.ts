import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  
  const matches = await prisma.match.findMany({
    where: { 
      status: 'FINISHED', 
      homeTeam: { name: { contains: 'Vitória' } },
      awayTeam: { name: { contains: 'Coritiba' } }
    },
    select: { externalId: true, utcDate: true, homeTeam: {select: {name: true}}, awayTeam: {select: {name: true}} }
  })
  console.log('Vitória x Coritiba:', matches);
  
  const matches2 = await prisma.match.findMany({
    where: { 
      status: 'FINISHED', 
      homeTeam: { name: { contains: 'Cruzeiro' } },
      awayTeam: { name: { contains: 'Atlético' } }
    },
    select: { externalId: true, utcDate: true, homeTeam: {select: {name: true}}, awayTeam: {select: {name: true}} }
  })
  console.log('Cruzeiro x Atlético:', matches2);
  
  await prisma.$disconnect()
}

main()
