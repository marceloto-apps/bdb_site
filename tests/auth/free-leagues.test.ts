import { describe, it, expect } from 'vitest'
import {
  FREE_LEAGUE_SLUGS,
  isLeagueFree,
  isLeagueAccessible,
  TEMPORARY_ALL_LEAGUES_FREE,
  LEAGUE_ORDER_RANK,
} from '@/lib/auth/free-leagues'

describe('free-leagues configuration', () => {
  it('deve manter apenas as ligas originais em FREE_LEAGUE_SLUGS', () => {
    expect(isLeagueFree('brasileirao-serie-a')).toBe(true)
    expect(isLeagueFree('brasileirao-serie-b')).toBe(true)
    expect(isLeagueFree('division-profesional')).toBe(true)
    expect(isLeagueFree('premier-league')).toBe(false)
    expect(isLeagueFree('la-liga')).toBe(false)
  })

  it('deve permitir acesso a qualquer liga quando TEMPORARY_ALL_LEAGUES_FREE for true', () => {
    expect(TEMPORARY_ALL_LEAGUES_FREE).toBe(true)
    expect(isLeagueAccessible('premier-league', false)).toBe(true)
    expect(isLeagueAccessible('la-liga', false)).toBe(true)
    expect(isLeagueAccessible('brasileirao-serie-a', false)).toBe(true)
    expect(isLeagueAccessible('qualquer-outra-liga', false)).toBe(true)
  })

  it('deve ter Brasileirão Série A e Série B no topo do LEAGUE_ORDER_RANK', () => {
    expect(LEAGUE_ORDER_RANK['brasileirao-serie-a']).toBe(1)
    expect(LEAGUE_ORDER_RANK['brasileirao-serie-b']).toBe(2)
  })

  it('deve ter as Big 5 da Europa logo após as ligas brasileiras', () => {
    expect(LEAGUE_ORDER_RANK['premier-league']).toBe(3)
    expect(LEAGUE_ORDER_RANK['la-liga']).toBe(4)
    expect(LEAGUE_ORDER_RANK['serie-a']).toBe(5)
    expect(LEAGUE_ORDER_RANK['bundesliga']).toBe(6)
    expect(LEAGUE_ORDER_RANK['ligue-1']).toBe(7)
  })
})
