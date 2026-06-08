import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { atualizarPerfilSchema } from '@/lib/validations/usuario'
import { awardPoints } from '@/lib/points/award'
import { z } from 'zod'

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth()

    const body = await req.json()
    const parsed = atualizarPerfilSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: parsed,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    // Conceder pontos por completar/atualizar perfil (idempotente)
    try {
      await awardPoints(user.id, 'COMPLETAR_PERFIL')
    } catch (err) {
      console.error('[Perfil API] Erro ao conceder pontos de perfil:', err)
    }

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('[PATCH /api/perfil]', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', issues: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
