import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getBalance, getExpiringSoonPoints } from '@/lib/points/balance'
import { getStatus } from '@/lib/points/status'

export async function GET() {
  try {
    const user = await requireAuth()
    
    const balance = await getBalance(user.id)
    const statusInfo = await getStatus(user.id)
    const expiringSoon = await getExpiringSoonPoints(user.id)
    
    return NextResponse.json({
      balance,
      status: statusInfo.currentStatus,
      nextStatus: statusInfo.nextStatus,
      pointsToProgress: statusInfo.pointsToNextStatus,
      progressPercentage: statusInfo.progressPercentage,
      expiringSoon,
    })
  } catch (error) {
    console.error('[GET /api/points/balance]', error)
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
