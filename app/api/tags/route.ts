import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ data: tags })
  } catch (error) {
    console.error('[GET /api/tags]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
