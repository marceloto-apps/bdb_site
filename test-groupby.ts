import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const proximasRodadas = await prisma.match.groupBy({
    by: ['round'],
    where: {
      season: {
        competition: { slug: 'premier-league' },
        isCurrent: true
      },
      status: 'SCHEDULED',
      round: { not: null }
    },
    orderBy: { round: 'asc' },
    take: 2
  })
  console.log(proximasRodadas)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
