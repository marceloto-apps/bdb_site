import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { atualizarPerfilSchema, excluirContaSchema } from '@/lib/schemas/perfil'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    
    const data = atualizarPerfilSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        ...(data.image !== undefined && { image: data.image }),
      },
      select: { name: true, image: true },
    })

    return NextResponse.json({ ok: true, user: updatedUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('[PERFIL_PATCH]', error)
    return NextResponse.json({ error: 'Erro interno ao atualizar perfil' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    
    const data = excluirContaSchema.parse(body)

    // Busca usuário completo para checar senha
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Se a conta tem senha, exige validação da senha para excluir
    if (dbUser.password !== null) {
      if (!data.senha) {
        return NextResponse.json({ error: 'Senha é obrigatória para excluir a conta' }, { status: 400 })
      }
      
      const senhaValida = await bcrypt.compare(data.senha, dbUser.password)
      if (!senhaValida) {
        return NextResponse.json({ error: 'Senha incorreta' }, { status: 400 })
      }
    }

    // Exclui o usuário (O Prisma executará cascade em Account, Session, Subscription, Favorite, ReadHistory)
    await prisma.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir contas com artigos publicados ou revisões. Entre em contato com o suporte.' 
        },
        { status: 409 }
      )
    }

    console.error('[PERFIL_DELETE]', error)
    return NextResponse.json({ error: 'Erro interno ao excluir conta' }, { status: 500 })
  }
}
