/**
 * Gate das rotas do Laboratório: usuário autenticado com o plano do backtest (D4: igual ao backtest atual).
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasBacktestAccess } from '@/lib/auth/check-access'

export async function usuarioDoLaboratorio(): Promise<{ userId: string } | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  if (!(await hasBacktestAccess(session.user.id))) return NextResponse.json({ error: 'UNAUTHORIZED_PLAN' }, { status: 403 })
  return { userId: session.user.id }
}

export const ehResposta = (x: unknown): x is NextResponse => x instanceof NextResponse

export function erroInterno(rotulo: string, e: unknown): NextResponse {
  console.error(`[laboratorio/${rotulo}]`, e)
  return NextResponse.json({ error: 'ERRO_INTERNO' }, { status: 500 })
}
