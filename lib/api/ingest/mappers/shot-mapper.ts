const resultMap: Record<string, string> = {
  goal: 'GOAL',
  saved: 'SAVED',
  miss: 'MISS',
  block: 'BLOCK',
  post: 'POST',
}

const situationMap: Record<string, string> = {
  regular: 'REGULAR',
  set_piece: 'SET_PIECE',
  fast_break: 'FAST_BREAK',
}

const bodyPartMap: Record<string, string> = {
  'right-foot': 'RIGHT_FOOT',
  'left-foot': 'LEFT_FOOT',
  head: 'HEAD',
}

export function mapShot(
  matchId: string, // ID interno BigDataBet
  teamMap: Map<string, string>, // externalId → id interno
  playerMap: Map<string, string>, // externalId → id interno
  shotData: any
) {
  const internalTeamId = teamMap.get(shotData.team_id) || null
  const internalPlayerId = playerMap.get(shotData.player_id) || null

  return {
    externalId: shotData.id, // sh_XXXX
    matchId,
    teamId: internalTeamId,
    playerId: internalPlayerId,
    x: shotData.x ?? null,
    y: shotData.y ?? null,
    minute: shotData.minute ?? null,
    result: resultMap[shotData.result] || 'MISS',
    expectedGoals: shotData.expected_goals ?? null,
    situation: situationMap[shotData.situation] || null,
    bodyPart: bodyPartMap[shotData.body_part] || null,
    isGoal: shotData.is_goal === true,
    isOnTarget: shotData.is_on_target === true,
    isHeaded: shotData.is_headed === true,
    isOutsideBox: shotData.is_outside_box === true,
    isPenalty: shotData.is_penalty === true,
    goalMouthLocation: shotData.goal_mouth_location ?? null,
    createdAt: new Date(),
  }
}
