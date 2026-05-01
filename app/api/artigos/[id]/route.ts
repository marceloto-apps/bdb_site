import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { atualizarArtigoSchema } from '@/lib/validations/artigos'
import { gerarSlug, slugEstaDisponivel } from '@/lib/utils/slug'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params
    const artigo = await prisma.article.findUnique({
      where: { id },
      include: {
        author: { select: { name: true, email: true } },
        category: true,
        tags: {
          include: { tag: true }
        },
        revisions: {
          include: { editor: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!artigo) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })
    }

    // Role check (Opcional: AUTOR só pode ver os seus se for RASCUNHO? O PRD fala listagem, na visualização individual também)
    const role = session.user.role as string
    if (role === 'AUTOR' && artigo.authorId !== session.user.id) {
       return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    if (role === 'REVISOR' && artigo.status !== 'REVISAO') {
       return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    return NextResponse.json({ data: artigo })
  } catch (error) {
    console.error('[GET /api/artigos/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params
    const artigo = await prisma.article.findUnique({ where: { id }, include: { tags: true } })

    if (!artigo) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })
    }

    const role = session.user.role as string
    if (role === 'AUTOR' && artigo.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    if (!['AUTOR', 'EDITOR', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = atualizarArtigoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', fields: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data
    let slug = artigo.slug

    if (data.title && data.title !== artigo.title && !data.slug) {
      slug = gerarSlug(data.title)
    } else if (data.slug) {
      slug = data.slug
    }

    if (slug !== artigo.slug) {
      const isAvailable = await slugEstaDisponivel(slug, id)
      if (!isAvailable) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', fields: { slug: { _errors: ['Slug indisponível'] } } }, { status: 400 })
      }
    }

    // Se as tags foram atualizadas
    let tagsUpdate = undefined
    if (data.tags) {
      // Remover todas as conexões atuais
      await prisma.articleTag.deleteMany({ where: { articleId: id } })

      // Criar as novas on-the-fly
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

      tagsUpdate = {
        create: tagsIds.map((tagId) => ({
          tag: { connect: { id: tagId } }
        }))
      }
    }

    const atualizado = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt !== undefined ? data.excerpt : undefined,
        content: data.content,
        thumbnail: data.thumbnail !== undefined ? data.thumbnail : undefined,
        type: data.type,
        categoryId: data.categoryId,
        ...(tagsUpdate && { tags: tagsUpdate }),
      },
    })

    return NextResponse.json({ data: atualizado })
  } catch (error) {
    console.error('[PATCH /api/artigos/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { id } = params
    await prisma.article.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/artigos/[id]]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
