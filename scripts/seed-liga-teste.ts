import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TIMES_BRASILEIRAO = [
  { name: 'Athletico Paranaense', shortName: 'CAP', externalId: '1' },
  { name: 'Atlético Mineiro', shortName: 'CAM', externalId: '2' },
  { name: 'Bahia', shortName: 'BAH', externalId: '3' },
  { name: 'Botafogo', shortName: 'BOT', externalId: '4' },
  { name: 'Corinthians', shortName: 'COR', externalId: '5' },
  { name: 'Cruzeiro', shortName: 'CRU', externalId: '6' },
  { name: 'Cuiabá', shortName: 'CUI', externalId: '7' },
  { name: 'Flamengo', shortName: 'FLA', externalId: '8' },
  { name: 'Fluminense', shortName: 'FLU', externalId: '9' },
  { name: 'Fortaleza', shortName: 'FOR', externalId: '10' },
  { name: 'Grêmio', shortName: 'GRE', externalId: '11' },
  { name: 'Internacional', shortName: 'INT', externalId: '12' },
  { name: 'Juventude', shortName: 'JUV', externalId: '13' },
  { name: 'Mirassol', shortName: 'MIR', externalId: '14' },
  { name: 'Palmeiras', shortName: 'PAL', externalId: '15' },
  { name: 'Red Bull Bragantino', shortName: 'RBB', externalId: '16' },
  { name: 'Santos', shortName: 'SAN', externalId: '17' },
  { name: 'São Paulo', shortName: 'SAO', externalId: '18' },
  { name: 'Sport', shortName: 'SPT', externalId: '19' },
  { name: 'Vasco da Gama', shortName: 'VAS', externalId: '20' },
]

async function seed() {
  console.log('🌱 Iniciando seed de dados de teste...')
  
  const competition = await prisma.competition.create({
    data: {
      name: 'Brasileirão Série A Teste',
      slug: 'brasileirao-serie-a-teste',
      country: 'Brasil',
      tier: 'FREE',
      active: true,
      externalId: '7199',
    }
  })
  
  const season = await prisma.season.create({
    data: {
      competitionId: competition.id,
      year: '2026',
      isCurrent: true,
      externalId: '202699',
    }
  })
  
  const times = []
  for (const t of TIMES_BRASILEIRAO) {
    const team = await prisma.team.create({
      data: {
        name: t.name,
        shortName: t.shortName,
        externalId: t.externalId + '99',
      }
    })
    await prisma.teamSeason.create({
      data: { teamId: team.id, seasonId: season.id }
    })
    times.push(team)
  }
  
  console.log(`✅ Seed concluído:`)
  console.log(`   - 1 competição`)
  console.log(`   - 1 temporada`)
  console.log(`   - ${times.length} times`)
}

seed()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
