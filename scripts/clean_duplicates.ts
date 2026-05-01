import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.$executeRawUnsafe(`
      DELETE rh1 FROM read_history rh1
      INNER JOIN read_history rh2 
        ON rh1.userId = rh2.userId 
        AND rh1.articleId = rh2.articleId 
        AND rh1.readAt < rh2.readAt;
    `)
    console.log('Duplicatas removidas. Linhas afetadas:', result)
  } catch (error) {
    console.error('Erro ao limpar duplicatas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
