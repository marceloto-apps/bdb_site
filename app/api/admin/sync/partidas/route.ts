import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { sincronizarPartidas } from '@/lib/sync/sync-partidas'
import { syncPartidasSchema } from '@/lib/validations/admin'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 })
    }

    const body = await req.json()
    const { seasonId } = syncPartidasSchema.parse(body)

    const result = await sincronizarPartidas(seasonId)

    const finalStatus = result.errors.length > 0 && result.total === 0 ? 'FAILED' : 'COMPLETED'

    const fakeLog = {
      id: 'temp-' + Date.now(),
      seasonId,
      type: 'PARTIDAS',
      status: finalStatus,
      result: result as any,
      duration: result.duration,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({ data: fakeLog })
  } catch (error: any) {
    console.error('[SYNC_PARTIDAS]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
