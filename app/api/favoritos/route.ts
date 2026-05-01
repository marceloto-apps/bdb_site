import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { favoritarSchema, favoritosPaginationSchema } from '@/lib/validations/favoritos'
import { z } from 'zod'

export async function GET(req: Request) {
  try {
    const user = await requireAuth()
    
    const { searchParams } = new URL(req.url)
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    
    const { page, limit } = favoritosPaginationSchema.parse({
      page: pageParam ? parseInt(pageParam, 10) : undefined,
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
    })

    const skip = (page - 1) * limit

    const where = {
      userId: user.id,
      article: { status: 'PUBLICADO' as const },
    }

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        include: {
          article: {
            include: {
              author: { select: { name: true, image: true } },
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.favorite.count({ where }),
    ])

    return NextResponse.json({
      favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[GET /api/favoritos]', error)
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
    const parsed = favoritarSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: parsed.error.issues },
        { status: 400 }
      )
    }

    const { articleId } = parsed.data

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

    await prisma.favorite.upsert({
      where: {
        userId_articleId: {
          userId: user.id,
          articleId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        articleId,
      },
    })

    return NextResponse.json({ success: true, favorited: true }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/favoritos]', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
