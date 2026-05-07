export interface ApiCompetition {
  id: string
  name: string
  country?: string
  is_cup?: boolean
}

export interface ApiTeam {
  id: string
  name: string
  short_name?: string
}

export interface ApiMatch {
  id: string
  status: string
  utc_date: string
  home_team: {
    id: string
    name: string
  }
  away_team: {
    id: string
    name: string
  }
  score?: {
    home: number
    away: number
  }
  matchday?: number
  statistics?: {
    possession?: { home: number; away: number }
    xg?: { home: number; away: number }
    shots?: { home: number; away: number }
    shots_on_target?: { home: number; away: number }
    corners?: { home: number; away: number }
  }
  odds_available?: boolean
  xg_available?: boolean
}

export interface ApiOddsItem {
  id: number
  name: string // "Pinnacle", "Bet365", etc
  home: number
  draw: number
  away: number
}

export interface ApiOddsResponse {
  bookmakers: ApiOddsItem[]
}

export interface ApiResponse<T> {
  data: T
  meta?: {
    page: number
    per_page: number
    total: number
  }
}

// Interfaces para resposta do endpoint /matches/{id}/stats
export interface ApiMatchStatsResponse {
  data: {
    match_id: string
    overview?: {
      possession?: { all: { home: number; away: number } }
      fouls?: { all: { home: number; away: number } }
    }
    shots?: {
      total?: { all: { home: number; away: number } }
      on_target?: { all: { home: number; away: number } }
      off_target?: { all: { home: number; away: number } }
      blocked?: { all: { home: number; away: number } }
    }
    attack?: {
      corners?: { all: { home: number; away: number } }
      crosses?: { all: { home: number; away: number } }
      dribbles?: { all: { home: number; away: number } }
    }
    passes?: {
      total?: { all: { home: number; away: number } }
      accurate?: { all: { home: number; away: number } }
    }
    duels?: {
      total?: { all: { home: number; away: number } }
      won?: { all: { home: number; away: number } }
    }
    defending?: {
      clearances?: { all: { home: number; away: number } }
      interceptions?: { all: { home: number; away: number } }
      tackles?: { all: { home: number; away: number } }
    }
    goalkeeping?: {
      saves?: { all: { home: number; away: number } }
    }
    np_expected_goals?: {
      all: { home: number; away: number }
      first_half?: { home: number; away: number }
      second_half?: { home: number; away: number }
    }
  }
}

// Interface para resposta do endpoint /matches/{id}/player-stats
export interface ApiPlayerStatsResponse {
  data: Array<{
    player_id: string
    player_name: string
    team_id: string
    position: string             // "F" | "M" | "D" | "G"
    rating: number | null
    minutes_played: number
    started: boolean
    played: boolean
    passing: { total: number; accurate: number; key_passes: number } | null
    shooting: { total: number; on_target: number; goals: number; expected_goals?: number } | null
    duels: { total: number; won: number } | null
    defending: { tackles: number; interceptions: number; clearances?: number } | null
    goalkeeping: object | null
    general: {
      dribbles_attempted: number
      dribbles_succeeded: number
      fouls_drawn: number
      fouls_committed: number
      yellow_cards: number
      red_cards: number
    } | null
  }>
}

// Interface para resposta do endpoint /matches/{id}/shotmap
export interface ApiShotmapResponse {
  match_id: string
  data: Array<{
    id: string                   // "sh_4812"
    player_id: string
    player_name: string
    team_id: string
    x: number
    y: number
    minute: number
    result: string               // "goal" | "saved" | "miss" | "block" | "post"
    expected_goals: number | null
    situation: string | null     // "regular" | "set_piece" | "fast_break"
    body_part: string | null     // "right-foot" | "left-foot" | "head"
    is_goal: boolean
    is_on_target: boolean
    is_headed: boolean
    is_outside_box: boolean
    is_penalty: boolean
    goal_mouth_location: string | null
  }>
  np_xg_summary?: {
    live: { home_team: number; away_team: number }
    stored: { home_team: number; away_team: number }
  }
}
