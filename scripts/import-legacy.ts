import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('⚠️ Uso do importador de legados:')
    console.log('  1. Por lista de e-mails:')
    console.log('     npx tsx scripts/import-legacy.ts email1@teste.com email2@teste.com')
    console.log('  2. Por arquivo de texto (um e-mail por linha):')
    console.log('     npx tsx scripts/import-legacy.ts --file=caminho/para/arquivo.txt')
    process.exit(0)
  }

  let emails: string[] = []

  const fileArg = args.find(arg => arg.startsWith('--file='))
  const firstArg = args[0]
  
  let filePath: string | null = null
  if (fileArg) {
    filePath = fileArg.split('=')[1]
  } else if (firstArg && (firstArg.endsWith('.txt') || firstArg.endsWith('.csv') || fs.existsSync(path.resolve(firstArg)))) {
    filePath = firstArg
  }

  if (filePath) {
    const absolutePath = path.resolve(filePath)
    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ Arquivo não encontrado: ${absolutePath}`)
      process.exit(1)
    }

    const content = fs.readFileSync(absolutePath, 'utf8')
    emails = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .map(line => {
        // Se a linha contiver vírgula ou ponto e vírgula, extrai a primeira coluna (geralmente o e-mail)
        if (line.includes(',')) return line.split(',')[0].trim()
        if (line.includes(';')) return line.split(';')[0].trim()
        return line
      })
      .filter(line => line.length > 0 && !line.startsWith('#') && line.includes('@'))
  } else {
    emails = args.map(email => email.trim())
  }

  console.log(`ℹ️ Preparando importação de ${emails.length} e-mail(s) legado(s)...`)

  let importados = 0
  let vinculados = 0
  let pulados = 0
  let erros = 0

  for (const rawEmail of emails) {
    const email = rawEmail.toLowerCase()
    
    // Validação básica de email
    if (!email.includes('@') || email.length < 5) {
      console.warn(`⚠️ E-mail inválido ignorado: "${rawEmail}"`)
      erros++
      continue
    }

    try {
      // 1. Checa se o e-mail já possui acesso legado registrado
      const legacyExistente = await prisma.legacyAccess.findUnique({
        where: { email },
      })

      if (legacyExistente) {
        console.log(`⏭️ [Ignorado] ${email} já está na lista de legados.`)
        pulados++
        continue
      }

      // 2. Busca se existe usuário cadastrado com esse e-mail no sistema
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })

      if (user) {
        // Se já existe usuário cadastrado, cria o LegacyAccess já vinculado ao userId
        await prisma.legacyAccess.create({
          data: {
            email,
            userId: user.id,
          },
        })
        console.log(`✅ [Importado e Vinculado] ${email} associado ao usuário ID ${user.id}`)
        vinculados++
      } else {
        // Se não existe usuário, cria sem userId (será vinculado dinamicamente no login/acesso)
        await prisma.legacyAccess.create({
          data: {
            email,
          },
        })
        console.log(`✅ [Importado] ${email} inserido com sucesso (aguardando registro do usuário)`)
      }
      
      importados++
    } catch (error: any) {
      console.error(`❌ Erro ao importar ${email}:`, error.message)
      erros++
    }
  }

  console.log('\n======================================')
  console.log('📊 Resumo da Importação Legada:')
  console.log(`  - Total Processados: ${emails.length}`)
  console.log(`  - Novos Importados:  ${importados} (sendo vinculados: ${vinculados})`)
  console.log(`  - Pulados (já legados): ${pulados}`)
  console.log(`  - Erros / Inválidos:  ${erros}`)
  console.log('======================================')
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal no script:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
