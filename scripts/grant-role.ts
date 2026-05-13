import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Pega os emails passados como argumento
  const emails = process.argv.slice(2)

  if (emails.length === 0) {
    console.error('⚠️ Por favor, informe os emails.')
    console.error('Uso: npx tsx scripts/grant-role.ts <email1> <email2> ...')
    process.exit(1)
  }

  for (const email of emails) {
    try {
      const user = await prisma.user.update({
        where: { email },
        // A role "EDITOR" é a mais próxima de um "REVISOR" na sua modelagem atual
        data: { role: 'EDITOR' },
      })
      console.log(`✅ Permissão de revisor (EDITOR) concedida com sucesso para: ${user.email}`)
    } catch (error: any) {
      if (error.code === 'P2025') {
        console.error(`❌ Usuário não encontrado no banco de dados: ${email}`)
      } else {
        console.error(`❌ Erro inesperado ao atualizar ${email}:`, error.message)
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
