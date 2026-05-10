import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { syncStatusQuerySchema } from '@/lib/validations/admin'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const seasonId = searchParams.get('seasonId')

    if (!seasonId) {
      return NextResponse.json({ error: 'Missing seasonId' }, { status: 400 })
    }

    syncStatusQuerySchema.parse({ seasonId })

    return NextResponse.json({ data: [] })
  } catch (error: any) {
    console.error('[SYNC_STATUS]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
