import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { gerarSlug } from '@/lib/utils/slug'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categorias = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    })
    return NextResponse.json({ data: categorias })
  } catch (error) {
    console.error('[GET /api/categorias]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 })
    }

    const trimmedName = name.trim()
    const slug = gerarSlug(trimmedName)
    
    const exists = await prisma.category.findFirst({
      where: {
        OR: [
          { name: trimmedName },
          { slug }
        ]
      }
    })

    if (exists) {
      return NextResponse.json({ error: 'Categoria com este nome ou slug já existe' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        slug
      }
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/categorias]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
