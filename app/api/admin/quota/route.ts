import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { fetchQuotaStatus } from '@/lib/api-football'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let quota = await prisma.apiQuota.findFirst({
      where: { date: today },
      orderBy: { updatedAt: 'desc' }
    })

    if (!quota) {
      // Buscar status atual da API
      const apiStatus = await fetchQuotaStatus()
      if (apiStatus && apiStatus.response) {
        const { current, limit_day } = (apiStatus.response as any).requests
        const remaining = limit_day - current
        
        quota = await prisma.apiQuota.create({
          data: {
            date: today,
            used: current,
            limit: limit_day,
            remaining: remaining
          }
        })
      }
    }

    if (!quota) {
      return NextResponse.json({ error: 'QUOTA_NOT_FOUND' }, { status: 404 })
    }

    const percentage = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0

    return NextResponse.json({
      data: {
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
        percentage,
        lastUpdated: quota.updatedAt.toISOString()
      }
    })
  } catch (error: any) {
    console.error('[QUOTA_GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
