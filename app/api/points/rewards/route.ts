import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const rewards = await prisma.rewardOption.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    })
    return NextResponse.json(rewards)
  } catch (error) {
    console.error('[GET /api/points/rewards]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
