import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categorias = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ data: categorias })
  } catch (error) {
    console.error('[GET /api/categorias]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
