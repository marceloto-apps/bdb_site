import { RateLimiter } from './rate-limiter'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from './types'

export interface TheStatsApiConfig {
  apiKey: string
  baseUrl: string
  rateLimit: number
  monthlyQuota: number
}

export class TheStatsApiClient {
  private config: TheStatsApiConfig
  private limiter: RateLimiter

  constructor(config?: Partial<TheStatsApiConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.THESTATSAPI_KEY || '',
      baseUrl: config?.baseUrl || process.env.THESTATSAPI_BASE_URL || 'https://api.thestatsapi.com/api/football',
      rateLimit: config?.rateLimit || Number(process.env.THESTATSAPI_RATE_LIMIT) || 30,
      monthlyQuota: config?.monthlyQuota || Number(process.env.THESTATSAPI_MONTHLY_QUOTA) || 100000,
    }
    // Rate limit of 30 req / min means ~1 req / 2s.
    this.limiter = new RateLimiter(this.config.rateLimit, Math.floor(60000 / this.config.rateLimit))
  }

  private async checkQuota(): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const logs = await prisma.apiQuotaLog.aggregate({
      where: { month: currentMonth },
      _sum: { requestCount: true }
    })
    
    const used = logs._sum.requestCount || 0

    if (used >= this.config.monthlyQuota) {
      throw new Error(`Quota mensal da API excedida (${used}/${this.config.monthlyQuota})`)
    }
  }

  private async logRequest(endpoint: string, status: number): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7)
    await prisma.apiQuotaLog.create({
      data: { 
        month: currentMonth, 
        endpoint,
        responseStatus: status,
        requestCount: 1 
      }
    })
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    await this.checkQuota()
    await this.limiter.acquire()

    const url = new URL(`${this.config.baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v))
    }

    const maxRetries = 3
    for (let i = 0; i < maxRetries; i++) {
      try {
        const res = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Accept': 'application/json'
          }
        })
        
        await this.logRequest(path, res.status)

        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After')
          const wait = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * Math.pow(2, i)
          await new Promise(r => setTimeout(r, wait))
          continue
        }

        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`)
        }

        return await res.json()
      } catch (err: any) {
        if (i === maxRetries - 1) throw err
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    throw new Error('Falha após max retries')
  }

  async getAllPages<T>(path: string, params?: Record<string, string>): Promise<T[]> {
    let page = 1
    const results: T[] = []
    
    while (true) {
      const res = await this.get<T[]>(path, { ...params, page: page.toString() })
      results.push(...res.data)
      
      if (!res.meta || res.meta.page * res.meta.per_page >= res.meta.total) {
        break
      }
      page++
    }
    
    return results
  }

  async getQuotaUsage(month?: string) {
    const targetMonth = month || new Date().toISOString().slice(0, 7)
    const logs = await prisma.apiQuotaLog.aggregate({
      where: { month: targetMonth },
      _sum: { requestCount: true }
    })
    const used = logs._sum.requestCount || 0
    const limit = this.config.monthlyQuota
    return {
      used,
      limit,
      percent: (used / limit) * 100
    }
  }
}

export const theStatsApi = new TheStatsApiClient()
