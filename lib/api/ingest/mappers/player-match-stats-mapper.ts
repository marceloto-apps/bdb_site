export function mapPlayerMatchStats(
  matchId: string,
  teamId: string,
  playerId: string,
  data: any
) {
  const now = new Date()

  return {
    matchId,
    teamId,
    playerId,

    // ── Geral ──
    rating: data.rating ?? null,
    minutesPlayed: data.minutes_played ?? 0,
    started: data.started === true,
    played: data.played === true,

    // ── Passes ──
    passesTotal: data.passing?.total_passes ?? null,
    passesAccurate: data.passing?.accurate_passes ?? null,
    keyPasses: data.passing?.key_passes ?? null,

    // ── Chutes ──
    shotsTotal: data.shooting?.total_shots ?? null,
    shotsOnTarget: data.shooting?.shots_on_target ?? null,
    goals: data.shooting?.goals ?? 0,
    expectedGoals: data.shooting?.expected_goals ?? null,

    // ── Duelos ──
    duelsTotal: (data.duels?.duel_won != null && data.duels?.duel_lost != null) 
      ? data.duels.duel_won + data.duels.duel_lost 
      : null,
    duelsWon: data.duels?.duel_won ?? null,

    // ── Defesa ──
    tackles: data.defending?.tackles ?? null,
    interceptions: data.defending?.interceptions ?? null,
    clearances: data.defending?.clearances ?? null,

    // ── General ──
    dribblesAttempted: (data.duels?.won_contest != null)
      ? data.duels.won_contest + (data.duels.challenge_lost ?? 0)
      : null,
    dribblesSucceeded: data.duels?.won_contest ?? null,
    foulsDrawn: data.general?.was_fouled ?? null,
    foulsCommitted: data.general?.fouls ?? null,
    yellowCards: data.general?.yellow_cards ?? 0,
    redCards: data.general?.red_cards ?? 0,

    createdAt: now,
  }
}
