import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { redeemSchema } from '@/lib/validations/points'
import { redeemReward, InsufficientPointsError } from '@/lib/points/redeem'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    
    const body = await req.json()
    const parsed = redeemSchema.parse(body)
    
    const coupon = await redeemReward(user.id, parsed.rewardOptionId)
    
    return NextResponse.json({ success: true, coupon })
  } catch (error: any) {
    console.error('[POST /api/points/redeem]', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', issues: error.issues }, { status: 400 })
    }
    if (error instanceof InsufficientPointsError) {
      return NextResponse.json({ error: 'Saldo insuficiente de pontos' }, { status: 422 })
    }
    if (error instanceof Error && error.message === 'RECOMPENSA_INDISPONIVEL') {
      return NextResponse.json({ error: 'Esta recompensa não está ativa ou disponível' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
