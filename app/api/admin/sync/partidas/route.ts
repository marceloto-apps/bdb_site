import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    // Verify if sync is running
    const runningSync = await prisma.syncLog.findFirst({
      where: { seasonId, type: 'PARTIDAS', status: 'RUNNING' }
    })

    if (runningSync) {
      return NextResponse.json({ error: 'SYNC_IN_PROGRESS' }, { status: 409 })
    }

    // Rate limit: 1 por minuto
    const lastSync = await prisma.syncLog.findFirst({
      where: { seasonId, type: 'PARTIDAS' },
      orderBy: { createdAt: 'desc' }
    })

    if (lastSync && Date.now() - new Date(lastSync.createdAt).getTime() < 60000) {
      return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED', message: 'Aguarde 1 minuto entre sincronizações.' }, { status: 429 })
    }

    const syncLog = await prisma.syncLog.create({
      data: {
        seasonId,
        type: 'PARTIDAS',
        status: 'RUNNING'
      }
    })

    const result = await sincronizarPartidas(seasonId)

    const finalStatus = result.errors.length > 0 && result.total === 0 ? 'FAILED' : 'COMPLETED'

    const updatedLog = await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: finalStatus,
        result: result as any,
        duration: result.duration
      }
    })

    return NextResponse.json({ data: updatedLog })
  } catch (error: any) {
    console.error('[SYNC_PARTIDAS]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
