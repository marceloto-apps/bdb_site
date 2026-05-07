import { env } from 'process'

const BASE_URL = process.env.THESTATSAPI_BASE_URL || 'https://api.thestatsapi.com/api'
const API_KEY = process.env.THESTATSAPI_KEY

if (!API_KEY) {
  throw new Error('THESTATSAPI_KEY não configurada no .env')
}

const HEADERS = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
} as const

// Rate limiter: máx 30 requests/minuto (1 a cada 2 segundos com margem)
const THROTTLE_MS = 2100

let lastRequestTime = 0

async function throttledFetch(url: string): Promise<Response> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < THROTTLE_MS) {
    await new Promise((resolve) => setTimeout(resolve, THROTTLE_MS - elapsed))
  }
  lastRequestTime = Date.now()

  const response = await fetch(url, { headers: HEADERS })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`API ${response.status}: ${errorBody}`)
  }

  return response
}

// ── Endpoints de ingestão ──────────────────────────────────

/** Busca stats agregadas de uma partida */
export async function fetchMatchStats(matchExternalId: string) {
  const res = await throttledFetch(
    `${BASE_URL}/matches/${matchExternalId}/stats`
  )
  const json = await res.json()
  return json.data
}

/** Busca stats individuais de todos os jogadores de uma partida */
export async function fetchPlayerStats(matchExternalId: string) {
  const res = await throttledFetch(
    `${BASE_URL}/matches/${matchExternalId}/player-stats`
  )
  const json = await res.json()
  return json.data // Array de jogadores
}

/** Busca shotmap (todos os chutes) de uma partida */
export async function fetchShotmap(matchExternalId: string) {
  const res = await throttledFetch(
    `${BASE_URL}/matches/${matchExternalId}/shotmap`
  )
  const json = await res.json()
  return json // Retorna objeto completo (tem data[] e np_xg_summary)
}

/** Busca perfil de jogadores em batch (até 100 IDs por chamada) */
export async function fetchPlayersBatch(playerExternalIds: string[]) {
  const ids = playerExternalIds.join(',')
  const res = await throttledFetch(
    `${BASE_URL}/players?player_ids=${ids}&per_page=100`
  )
  const json = await res.json()
  return json.data // Array de Player objects
}
