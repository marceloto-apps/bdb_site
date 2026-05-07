import { execSync } from 'child_process'

function runCommand(command: string) {
  console.log(`\n=================================================`)
  console.log(`▶ Executando: ${command}`)
  console.log(`=================================================\n`)
  
  try {
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    console.error(`\n❌ Falha ao executar a fase. Abortando processo.`)
    process.exit(1)
  }
}

function main() {
  console.log('🚀 Iniciando processamento em lote: Fase 2 e Fase 3')
  
  // Fase 2: Player Stats
  runCommand('npx tsx --env-file=.env scripts/backfill-player-stats.ts')
  
  // Fase 3: Shots
  runCommand('npx tsx --env-file=.env scripts/backfill-shots.ts')

  console.log(`\n✅ TODAS AS FASES CONCLUÍDAS COM SUCESSO!`)
}

main()
