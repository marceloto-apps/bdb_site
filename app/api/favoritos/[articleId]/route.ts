import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { articleId: string }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    
    const articleId = params.articleId

    await prisma.favorite.deleteMany({
      where: {
        userId: user.id,
        articleId,
      },
    })

    return NextResponse.json({ success: true, favorited: false })
  } catch (error) {
    console.error('[DELETE /api/favoritos/[articleId]]', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
