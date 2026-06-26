// app/api/backtest/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { z } from 'zod'

const saveBacktestSchema = z.object({
  name: z.string().min(1),
  filters: z.any(),
  resultMeta: z.any(),
})

// GET /api/backtest - List saved backtests of current user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const saved = await prisma.savedBacktest.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ data: saved })
  } catch (error: any) {
    console.error('[SAVED_BACKTEST_GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/backtest - Save a backtest
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = saveBacktestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_PARAMETERS', details: parsed.error.format() }, { status: 400 })
    }

    const saved = await prisma.savedBacktest.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        filters: parsed.data.filters,
        resultMeta: parsed.data.resultMeta,
      }
    })

    return NextResponse.json({ data: saved })
  } catch (error: any) {
    console.error('[SAVED_BACKTEST_POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
