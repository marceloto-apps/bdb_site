import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

function runCommand(command: string) {
  console.log(`\n=================================================`)
  console.log(`▶ Executando: ${command}`)
  console.log(`=================================================\n`)
  
  try {
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    console.error(`\n❌ Falha ao executar. Abortando teste.`)
    process.exit(1)
  }
}

async function main() {
  console.log('🚀 Iniciando TESTE de 3 partidas: Fase 2 e Fase 3')
  
  // Roda Ingestão com limite de 3
  runCommand('npx tsx --env-file=.env scripts/backfill-player-stats.ts --limit=3')
  runCommand('npx tsx --env-file=.env scripts/backfill-shots.ts --limit=3')

  console.log(`\n✅ TESTE CONCLUÍDO. Lendo o banco para ver os resultados...\n`)

  const prisma = new PrismaClient()

  // Busca uma amostra de PlayerMatchStats inseridos hoje
  const playerStats = await prisma.$queryRaw`
    SELECT 
      pms.id, 
      p.name as "Jogador",
      t.name as "Time",
      pms.minutesPlayed,
      pms.rating,
      pms.goals,
      pms.expectedGoals,
      pms.passesTotal,
      pms.yellowCards
    FROM PlayerMatchStats pms
    JOIN Player p ON p.id = pms.playerId
    JOIN teams t ON t.id = pms.teamId
    ORDER BY pms.createdAt DESC
    LIMIT 5
  `
  console.log('--- AMOSTRA: PlayerMatchStats (Fase 2) ---')
  console.table(playerStats)

  // Busca uma amostra de Shots inseridos hoje
  const shots = await prisma.$queryRaw`
    SELECT 
      s.id, 
      p.name as "Jogador",
      t.name as "Time",
      s.minute,
      s.result,
      s.expectedGoals,
      s.isGoal,
      s.situation,
      s.bodyPart
    FROM Shot s
    JOIN Player p ON p.id = s.playerId
    JOIN teams t ON t.id = s.teamId
    ORDER BY s.createdAt DESC
    LIMIT 5
  `
  console.log('\n--- AMOSTRA: Chutes (Fase 3) ---')
  console.table(shots)

  await prisma.$disconnect()
}

main()
