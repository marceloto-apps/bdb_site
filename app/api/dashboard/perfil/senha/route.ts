import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { alterarSenhaSchema } from '@/lib/schemas/perfil'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    
    const data = alterarSenhaSchema.parse(body)

    // Buscar o usuário atual com sua senha
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Se a senha for null, significa que foi conta criada via OAuth (ex: Google)
    if (dbUser.password === null) {
      return NextResponse.json(
        { error: 'Sua conta foi criada via Google. Não é possível alterar a senha.' }, 
        { status: 403 }
      )
    }

    // Verifica se a senha atual confere
    const senhaValida = await bcrypt.compare(data.senhaAtual, dbUser.password)
    if (!senhaValida) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    // Criptografa a nova senha com custo 12
    const hashedPassword = await bcrypt.hash(data.novaSenha, 12)

    // Atualiza a senha no banco
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('[SENHA_PATCH]', error)
    return NextResponse.json({ error: 'Erro interno ao alterar senha' }, { status: 500 })
  }
}
