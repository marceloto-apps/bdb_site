import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const season = await prisma.season.findFirst({
    where: { isCurrent: true, competition: { slug: 'brasileirao-serie-a' } }
  })

  if (!season) { console.log('No season found'); return }

  const year = parseInt(season.year, 10)
  const startDate = new Date(Date.UTC(year, 0, 1))

  const total = await prisma.match.count({
    where: { seasonId: season.id, status: 'FINISHED', fthg: { not: null } }
  })

  const filtered = await prisma.match.count({
    where: {
      seasonId: season.id,
      status: 'FINISHED',
      fthg: { not: null },
      utcDate: { gte: startDate }
    }
  })

  // Get unique teams from filtered matches
  const matches = await prisma.match.findMany({
    where: {
      seasonId: season.id,
      status: 'FINISHED',
      utcDate: { gte: startDate }
    },
    select: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } }
    }
  })

  const teams = new Set<string>()
  matches.forEach(m => {
    teams.add(m.homeTeam.name)
    teams.add(m.awayTeam.name)
  })

  console.log(`Season: ${season.year}`)
  console.log(`Total matches (all): ${total}`)
  console.log(`Filtered matches (${season.year} only): ${filtered}`)
  console.log(`Teams in ${season.year}: ${teams.size}`)
  console.log(Array.from(teams).sort().join(', '))

  await prisma.$disconnect()
}

main()
