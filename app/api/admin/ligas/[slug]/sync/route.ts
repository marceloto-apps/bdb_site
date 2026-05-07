import { NextRequest, NextResponse } from 'next/server'
import { syncLeague, SyncOptions } from '@/lib/ingest/sync-engine'
import { verificarAdmin } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const isAdmin = await verificarAdmin(req)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const mode = body.mode === 'full' ? 'full' : 'incremental'
    const includeOdds = body.includeOdds ?? true
    const includeFuture = body.includeFuture ?? false
    const options: SyncOptions = {
      leagueSlug: params.slug,
      mode,
      includeOdds,
      includeFuture,
      limit: body.limit ? Number(body.limit) : undefined
    }

    const result = await syncLeague(options)
    
    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
