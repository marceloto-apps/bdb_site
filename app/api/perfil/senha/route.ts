import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { trocarSenhaSchema } from '@/lib/validations/usuario'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function PATCH(req: Request) {
  try {
    const userSession = await requireAuth()

    const body = await req.json()
    const parsed = trocarSenhaSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: userSession.id },
      select: { id: true, password: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (user.password === null) {
      return NextResponse.json(
        { error: 'Conta criada via Google. Senha não pode ser alterada por aqui.' },
        { status: 400 }
      )
    }

    const { currentPassword, newPassword } = parsed

    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 401 }
      )
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PATCH /api/perfil/senha]', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', issues: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
