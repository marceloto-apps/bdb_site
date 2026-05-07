import { prisma } from '@/lib/prisma'

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io'

interface ApiFootballResponse<T> {
  get: string
  parameters: Record<string, string>
  errors: Record<string, string> | string[]
  results: number
  paging: { current: number; total: number }
  response: T[]
}

async function fetchApiFootball<T>(
  endpoint: string,
  params: Record<string, string>
): Promise<ApiFootballResponse<T>> {
  const apiKey = process.env.API_FOOTBALL_KEY
  if (!apiKey) throw new Error('API_FOOTBALL_KEY não configurada no .env')

  const url = new URL(`${API_FOOTBALL_BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': apiKey },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`API-Football erro ${res.status}: ${res.statusText}`)
  }

  const quotaUsed = parseInt(res.headers.get('x-ratelimit-requests-current') ?? '0')
  const quotaLimit = parseInt(res.headers.get('x-ratelimit-requests-limit') ?? '100')
  const quotaRemaining = parseInt(res.headers.get('x-ratelimit-requests-remaining') ?? '100')

  registrarQuota(quotaUsed, quotaLimit, quotaRemaining).catch(console.error)

  return res.json()
}

async function registrarQuota(used: number, limit: number, remaining: number): Promise<void> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await prisma.apiQuota.upsert({
      where: { date: today },
      update: { used, limit, remaining },
      create: { date: today, used, limit, remaining }
    })
  } catch (error) {
    console.error('Falha ao registrar quota:', error)
  }
}

export async function fetchPartidas(leagueId: number, season: number) {
  return fetchApiFootball<FixtureResponse>('fixtures', {
    league: String(leagueId),
    season: String(season),
  })
}

export async function fetchOdds(fixtureId: number) {
  return fetchApiFootball<OddsResponse>('odds', {
    fixture: String(fixtureId),
  })
}

export async function fetchOddsPreMatch(fixtureId: number, bookmaker?: number) {
  const params: Record<string, string> = { fixture: String(fixtureId) }
  if (bookmaker) params.bookmaker = String(bookmaker)
  return fetchApiFootball<OddsResponse>('odds', params)
}

export async function fetchQuotaStatus() {
  return fetchApiFootball<StatusResponse>('status', {})
}

export interface FixtureResponse {
  fixture: {
    id: number
    referee: string | null
    timezone: string
    date: string
    timestamp: number
    status: { long: string; short: string; elapsed: number | null }
  }
  league: { id: number; name: string; round: string; season: number }
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null }
    away: { id: number; name: string; logo: string; winner: boolean | null }
  }
  goals: { home: number | null; away: number | null }
  score: {
    halftime: { home: number | null; away: number | null }
    fulltime: { home: number | null; away: number | null }
  }
}

export interface OddsResponse {
  league: { id: number; season: number }
  fixture: { id: number; date: string }
  bookmakers: Array<{
    id: number
    name: string
    bets: Array<{
      id: number
      name: string
      values: Array<{ value: string; odd: string }>
    }>
  }>
}

export interface StatusResponse {
  account: { firstname: string; lastname: string; email: string }
  subscription: { plan: string; end: string }
  requests: { current: number; limit_day: number }
}
