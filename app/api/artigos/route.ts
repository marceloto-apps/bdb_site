import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma, ArticleStatus, ArticleType } from '@prisma/client'
import { criarArtigoSchema } from '@/lib/validations/artigos'
import { gerarSlug, slugEstaDisponivel } from '@/lib/utils/slug'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const authorIdParam = searchParams.get('authorId')
    
    // Paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const role = session.user.role as string
    const where: Prisma.ArticleWhereInput = {}

    if (role === 'AUTOR') {
      where.authorId = session.user.id
    } else if (role === 'REVISOR') {
      where.status = 'REVISAO'
    } else if (role === 'EDITOR' || role === 'ADMIN') {
      // Pode ver tudo, aplica os filtros da querystring
      if (authorIdParam) where.authorId = authorIdParam
    } else {
      // MEMBRO ou não reconhecido
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (status && (role !== 'REVISOR' || status === 'REVISAO')) {
      where.status = status as ArticleStatus
    }
    if (type) {
      where.type = type as ArticleType
    }

    const [artigos, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: { select: { name: true, email: true } },
          category: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    return NextResponse.json({ data: artigos, total })
  } catch (error) {
    console.error('[GET /api/artigos]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const role = session.user.role as string
    if (!['AUTOR', 'EDITOR', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = criarArtigoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', fields: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data
    const slug = data.slug || gerarSlug(data.title)

    const isAvailable = await slugEstaDisponivel(slug)
    if (!isAvailable) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', fields: { slug: { _errors: ['Slug indisponível'] } } }, { status: 400 })
    }

    // Criar tags on-the-fly
    const tagsIds = []
    for (const tagName of data.tags) {
      const tagSlug = gerarSlug(tagName)
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: { name: tagName, slug: tagSlug },
      })
      tagsIds.push(tag.id)
    }

    const artigo = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        thumbnail: data.thumbnail,
        type: data.type,
        status: 'RASCUNHO',
        authorId: session.user.id,
        categoryId: data.categoryId,
        tags: {
          create: tagsIds.map((tagId) => ({
            tag: { connect: { id: tagId } }
          }))
        }
      },
    })

    return NextResponse.json({ data: artigo }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/artigos]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
