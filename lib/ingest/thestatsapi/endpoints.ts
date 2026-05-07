import { theStatsApi } from './client'
import { ApiCompetition, ApiMatch, ApiOddsResponse, ApiMatchStatsResponse, ApiPlayerStatsResponse, ApiShotmapResponse } from './types'

export async function fetchCompetitions() {
  const res = await theStatsApi.get<ApiCompetition[]>('/competitions')
  return res.data
}

export async function fetchMatches(competitionId: string, status: 'finished' | 'scheduled', page = 1) {
  const res = await theStatsApi.get<ApiMatch[]>('/matches', {
    competition_id: competitionId,
    status,
    limit: '20',
    page: page.toString()
  })
  return res
}

export async function fetchMatchOdds(matchId: string) {
  const res = await theStatsApi.get<ApiOddsResponse>(`/matches/${matchId}/odds`)
  return res.data
}

export async function fetchMatchDetails(matchId: string) {
  const res = await theStatsApi.get<ApiMatch>(`/matches/${matchId}`)
  return res.data
}

export async function fetchAllFinishedMatches(competitionId: string) {
  return theStatsApi.getAllPages<ApiMatch>('/matches', {
    competition_id: competitionId,
    status: 'finished',
    limit: '20'
  })
}

export async function fetchAllScheduledMatches(competitionId: string) {
  return theStatsApi.getAllPages<ApiMatch>('/matches', {
    competition_id: competitionId,
    status: 'scheduled',
    limit: '20'
  })
}

export async function fetchMatchStats(matchId: string) {
  const res = await theStatsApi.get<any>(`/matches/${matchId}/stats`)
  return res as ApiMatchStatsResponse
}

export async function fetchMatchPlayerStats(matchId: string) {
  const res = await theStatsApi.get<any>(`/matches/${matchId}/player-stats`)
  return res as ApiPlayerStatsResponse
}

export async function fetchMatchShotmap(matchId: string) {
  const res = await theStatsApi.get<any>(`/matches/${matchId}/shotmap`)
  return res as ApiShotmapResponse
}
