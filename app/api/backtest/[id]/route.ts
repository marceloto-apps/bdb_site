// app/api/backtest/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { id } = params

    // Verificar se o backtest pertence ao usuário logado
    const saved = await prisma.savedBacktest.findFirst({
      where: {
        id,
        userId: session.user.id,
      }
    })

    if (!saved) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    await prisma.savedBacktest.delete({
      where: {
        id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[SAVED_BACKTEST_DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
