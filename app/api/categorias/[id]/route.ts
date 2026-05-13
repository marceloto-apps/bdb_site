import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { gerarSlug } from '@/lib/utils/slug'
import { auth } from '@/auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { name } = body
    const id = params.id

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 })
    }

    const trimmedName = name.trim()
    const slug = gerarSlug(trimmedName)
    
    // Verifica se já existe outra categoria com o mesmo nome ou slug
    const exists = await prisma.category.findFirst({
      where: {
        OR: [
          { name: trimmedName },
          { slug }
        ],
        NOT: {
          id
        }
      }
    })

    if (exists) {
      return NextResponse.json({ error: 'Outra categoria com este nome ou slug já existe' }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: trimmedName,
        slug
      }
    })

    return NextResponse.json({ data: category }, { status: 200 })
  } catch (error) {
    console.error(`[PATCH /api/categorias/${params?.id}]`, error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const id = params.id

    // Verifica se a categoria possui artigos vinculados
    const articlesCount = await prisma.article.count({
      where: { categoryId: id }
    })

    if (articlesCount > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir a categoria pois existem artigos vinculados a ela. Edite os artigos e mude a categoria primeiro.' 
      }, { status: 400 })
    }

    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Categoria excluída com sucesso' }, { status: 200 })
  } catch (error) {
    console.error(`[DELETE /api/categorias/${params?.id}]`, error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
