import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Planilha free — Brasileirão
  await prisma.spreadsheet.upsert({
    where: { id: 'brasileirao-serie-a-free' },
    update: {
      fileUrl: 'https://bigdatabet.com.br/downloads/BRA1DASHv261.xlsm',
      fileName: 'Planilha Brasileirao 2026.xlsm',
      fileSize: '1 MB',
    },
    create: {
      id: 'brasileirao-serie-a-free',
      name: 'Brasileirão Série A',
      description:
        'Planilha de análise avançada do Brasileirão Série A com estatísticas profundas: odds, medidas de dispersão, comparação com o mercado, tendências de lucratividade e variáveis estatísticas detalhadas.',
      league: 'Série A',
      country: 'Brasil',
      fileUrl: 'https://bigdatabet.com.br/downloads/BRA1DASHv261.xlsm',
      fileName: 'Planilha Brasileirao 2026.xlsm',
      fileSize: '1 MB',
      isPremium: false,
      downloads: 0,
      order: 1,
    },
  })

  console.log('✅ Seed de planilhas concluído')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
