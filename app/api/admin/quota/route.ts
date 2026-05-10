import { NextResponse } from 'next/server'

import { auth } from '@/auth'
import { fetchQuotaStatus } from '@/lib/api-football'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 })
    }

    const apiStatus = await fetchQuotaStatus()
    if (!apiStatus || !apiStatus.response) {
      return NextResponse.json({ error: 'QUOTA_NOT_FOUND' }, { status: 404 })
    }

    const { current, limit_day } = (apiStatus.response as any).requests
    const remaining = limit_day - current
    const percentage = limit_day > 0 ? (current / limit_day) * 100 : 0

    return NextResponse.json({
      data: {
        used: current,
        limit: limit_day,
        remaining: remaining,
        percentage,
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('[QUOTA_GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
