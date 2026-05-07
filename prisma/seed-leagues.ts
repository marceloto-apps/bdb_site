import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedLeagues() {
  console.log('🏟️ Iniciando seed de ligas...')

  const brasileiraoA = await prisma.league.upsert({
    where: { slug: 'brasileirao-serie-a' },
    update: {},
    create: {
      name: 'Brasileirão Série A',
      country: 'Brasil',
      slug: 'brasileirao-serie-a',
      season: '2026',
      tier: 'FREE',
      active: true,
      externalId: 'comp_4795',
    },
  })

  console.log(`✅ Liga criada/atualizada: ${brasileiraoA.name} (${brasileiraoA.slug})`)
}

seedLeagues()
  .catch((e) => {
    console.error('❌ Erro no seed de ligas:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
