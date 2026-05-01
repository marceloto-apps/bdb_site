import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { registrarLeituraSchema, historicoPaginationSchema } from '@/lib/validations/historico'
import { z } from 'zod'

export async function GET(req: Request) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    
    const { page, limit } = historicoPaginationSchema.parse({
      page: pageParam ? parseInt(pageParam, 10) : undefined,
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
    })

    const skip = (page - 1) * limit

    const where = {
      userId: user.id,
      article: { status: 'PUBLICADO' as const },
    }

    const [history, total] = await Promise.all([
      prisma.readHistory.findMany({
        where,
        include: {
          article: {
            include: {
              author: { select: { name: true, image: true } },
              category: true,
            },
          },
        },
        orderBy: { readAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.readHistory.count({ where }),
    ])

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/historico]', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', issues: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const body = await req.json()
    const parsed = registrarLeituraSchema.parse(body)

    const { articleId } = parsed

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { status: true },
    })

    if (!article || article.status !== 'PUBLICADO') {
      return NextResponse.json(
        { error: 'Artigo não encontrado ou não publicado' },
        { status: 404 }
      )
    }

    await prisma.readHistory.upsert({
      where: {
        userId_articleId: {
          userId: user.id,
          articleId,
        },
      },
      create: {
        userId: user.id,
        articleId,
      },
      update: {
        readAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/historico]', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', issues: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
