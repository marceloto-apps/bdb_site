import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { historyQuerySchema } from '@/lib/validations/points'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Extrai e valida os parâmetros de consulta
    const url = new URL(req.url)
    const searchParams = Object.fromEntries(url.searchParams.entries())
    const parsed = historyQuerySchema.parse(searchParams)
    
    const { page, pageSize } = parsed
    const skip = (page - 1) * pageSize
    
    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.pointTransaction.count({
        where: { userId: user.id },
      })
    ])
    
    return NextResponse.json({
      transactions,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }
    })
  } catch (error) {
    console.error('[GET /api/points/history]', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Parâmetros inválidos', issues: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
