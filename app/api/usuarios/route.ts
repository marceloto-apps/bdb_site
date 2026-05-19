import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cadastroSchema } from '@/lib/validations/auth'
import { sendEmail } from '@/lib/email/brevo'
import { welcomeEmailTemplate } from '@/lib/email/templates/welcome'

/**
 * POST /api/usuarios
 * Cria um novo usuário com email e senha (cadastro por credenciais).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Validar dados de entrada
    const parsed = cadastroSchema.safeParse(body)
    if (!parsed.success) {
      const fields: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.')
        if (!fields[key]) fields[key] = []
        fields[key].push(issue.message)
      }
      return NextResponse.json(
        { message: 'Dados inválidos', fields },
        { status: 400 }
      )
    }

    const { name, email, password, newsletterOptIn } = parsed.data

    // 2. Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email já está cadastrado.' },
        { status: 409 }
      )
    }

    // 3. Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // 4. Criar usuário no banco
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        newsletterOptIn: newsletterOptIn ?? false,
        role: 'MEMBRO',
        plan: 'FREE',
      },
    })

    // 5. Enviar email de boas-vindas (assíncrono, não bloqueia)
    if (user.email) {
      const { subject, htmlContent } = welcomeEmailTemplate({
        name: user.name ?? 'usuário',
      })
      sendEmail({
        to: { email: user.email, name: user.name ?? undefined },
        subject,
        htmlContent,
      }).catch((err) =>
        console.error('[Cadastro] Erro ao enviar email de boas-vindas:', err)
      )
    }

    // 6. Retornar sucesso (sem expor a senha)
    return NextResponse.json(
      {
        message: 'Conta criada com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API /api/usuarios] Erro ao criar usuário:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor. Tente novamente.' },
      { status: 500 }
    )
  }
}
