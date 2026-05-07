/**
 * Transforma o response de GET /matches/{id}/stats
 * no formato da tabela MatchStats do Prisma.
 *
 * A API retorna dados aninhados por categoria:
 * - overview: possession, fouls, yellow/red cards, offsides
 * - shots: total, on_target, off_target, blocked
 * - attack: corners, crosses, dribbles
 * - passes: total, accurate
 * - duels: total, won
 * - defending: clearances, interceptions, tackles
 * - goalkeeping: saves
 * - np_expected_goals: xG por tempo (all, first_half, second_half)
 */
export function mapMatchStats(matchId: string, data: any) {
  // Helper para extrair valor aninhado com segurança
  const get = (
    category: string,
    stat: string,
    period: string,
    side: string,
    defaultValue: number | null = null
  ): number | null => {
    return data?.[category]?.[stat]?.[period]?.[side] ?? defaultValue
  }

  // Helper específico para xG
  const getXg = (period: string, side: string): number | null => {
    return data?.overview?.expected_goals?.[period]?.[side] ?? null
  }

  const now = new Date()

  // Omitimos o `id` para que o Prisma gere automaticamente via @default(cuid())
  return {
    matchId,

    // ── xG (npxG) ──
    homeXg: getXg('all', 'home'),
    awayXg: getXg('all', 'away'),
    homeXgFirstHalf: getXg('first_half', 'home'),
    awayXgFirstHalf: getXg('first_half', 'away'),
    homeXgSecondHalf: getXg('second_half', 'home'),
    awayXgSecondHalf: getXg('second_half', 'away'),

    // ── Overview ──
    homePossession: get('overview', 'ball_possession', 'all', 'home'),
    awayPossession: get('overview', 'ball_possession', 'all', 'away'),

    // ── Shots ──
    homeShots: get('shots', 'total_shots', 'all', 'home'),
    awayShots: get('shots', 'total_shots', 'all', 'away'),
    homeShotsOnTarget: get('shots', 'shots_on_target', 'all', 'home'),
    awayShotsOnTarget: get('shots', 'shots_on_target', 'all', 'away'),
    homeShotsOffTarget: get('shots', 'shots_off_target', 'all', 'home'),
    awayShotsOffTarget: get('shots', 'shots_off_target', 'all', 'away'),
    homeShotsBlocked: get('shots', 'blocked_shots', 'all', 'home'),
    awayShotsBlocked: get('shots', 'blocked_shots', 'all', 'away'),

    // ── Attack / Corners / Crosses / Dribbles ──
    homeCorners: get('overview', 'corner_kicks', 'all', 'home'),
    awayCorners: get('overview', 'corner_kicks', 'all', 'away'),
    homeCrosses: get('passes', 'accurate_crosses', 'all', 'home'),
    awayCrosses: get('passes', 'accurate_crosses', 'all', 'away'),
    homeDribbles: get('duels', 'dribbles_percentage', 'all', 'home'),
    awayDribbles: get('duels', 'dribbles_percentage', 'all', 'away'),

    // ── Passes ──
    homePassesTotal: get('overview', 'passes', 'all', 'home'),
    awayPassesTotal: get('overview', 'passes', 'all', 'away'),
    homePassesAccurate: get('overview', 'accurate_passes', 'all', 'home'),
    awayPassesAccurate: get('overview', 'accurate_passes', 'all', 'away'),

    // ── Duels ──
    homeDuelsTotal: get('duels', 'duels_won_percentage', 'all', 'home'),
    awayDuelsTotal: get('duels', 'duels_won_percentage', 'all', 'away'),
    homeDuelsWon: get('duels', 'duels_won_percentage', 'all', 'home'),
    awayDuelsWon: get('duels', 'duels_won_percentage', 'all', 'away'),

    // ── Defending ──
    homeClearances: get('defending', 'clearances', 'all', 'home'),
    awayClearances: get('defending', 'clearances', 'all', 'away'),
    homeInterceptions: get('defending', 'interceptions', 'all', 'home'),
    awayInterceptions: get('defending', 'interceptions', 'all', 'away'),
    homeTackles: get('overview', 'tackles', 'all', 'home'),
    awayTackles: get('overview', 'tackles', 'all', 'away'),

    // ── Goalkeeping ──
    homeSaves: get('overview', 'goalkeeper_saves', 'all', 'home'),
    awaySaves: get('overview', 'goalkeeper_saves', 'all', 'away'),

    // ── Overview (disciplina) ──
    homeFouls: get('overview', 'fouls', 'all', 'home'),
    awayFouls: get('overview', 'fouls', 'all', 'away'),
    homeYellowCards: get('overview', 'yellow_cards', 'all', 'home'),
    awayYellowCards: get('overview', 'yellow_cards', 'all', 'away'),
    homeRedCards: get('overview', 'red_cards', 'all', 'home'),
    awayRedCards: get('overview', 'red_cards', 'all', 'away'),
    homeOffsides: get('attack', 'offsides', 'all', 'home'),
    awayOffsides: get('attack', 'offsides', 'all', 'away'),

    // ── Timestamps ──
    syncedAt: now,
    createdAt: now,
  }
}
