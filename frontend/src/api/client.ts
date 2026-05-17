const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// --- Types ---

export interface Player {
  id: number
  name: string
  league_id: number
  division_id: number | null
  has_matches: boolean
}

export interface League {
  id: number
  name: string
  created_at: string
  ends_at: string | null
  is_active: boolean
  status: 'pending' | 'active'
  base_win_points: number
  base_loss_points: number
  multiplier: number
}

export interface Division {
  id: number
  league_id: number
  name: string
  rank: number
}

export interface MatchPlayerDetail {
  player_id: number
  player_name: string
  division_id: number
  division_name: string
  division_rank: number
  points_earned: number
}

export interface Match {
  id: number
  league_id: number
  team_a_player_1: MatchPlayerDetail
  team_a_player_2: MatchPlayerDetail
  team_b_player_1: MatchPlayerDetail
  team_b_player_2: MatchPlayerDetail
  team_a_score: number
  team_b_score: number
  played_at: string
}

export interface PlayerStanding {
  player_id: number
  player_name: string
  matches_played: number
  wins: number
  losses: number
  points: number
  points_for: number
  points_against: number
}

export interface DivisionStandings {
  division_id: number
  division_name: string
  division_rank: number
  standings: PlayerStanding[]
}

export interface LeagueDefaults {
  base_win_points: number
  base_loss_points: number
  multiplier: number
  num_divisions: number
}

// --- Helpers ---

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail ?? 'An error occurred')
  }
  return response.json()
}

async function adminRequest<T>(path: string, password: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    },
    ...options,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail ?? 'An error occurred')
  }
  return response.json()
}

async function leagueAdminRequest<T>(path: string, password: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-league-password': password,
    },
    ...options,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail ?? 'An error occurred')
  }
  return response.json()
}

// --- Auth ---

export const verifyAdmin = (password: string) =>
  adminRequest<{ ok: boolean }>('/admin/verify', password)

export const verifyLeagueAdmin = (leagueId: number, password: string) =>
  leagueAdminRequest<{ ok: boolean }>(`/leagues/verify-admin/${leagueId}`, password, {
    method: 'POST',
  })

// --- Leagues ---

export const getLeagues = () =>
  request<League[]>('/leagues/')

export const getLeague = (id: number) =>
  request<League>(`/leagues/${id}`)

export const createLeague = (
  data: { name: string; admin_password: string },
  password: string
) => adminRequest<League>('/leagues/', password, {
  method: 'POST',
  body: JSON.stringify(data),
})

export const setupLeague = (
  id: number,
  data: {
    ends_at: string | null
    base_win_points: number
    base_loss_points: number
    multiplier: number
    num_divisions: number
  },
  password: string
) => leagueAdminRequest<League>(`/leagues/${id}/setup`, password, {
  method: 'POST',
  body: JSON.stringify(data),
})

export const updateLeague = (
  id: number,
  data: { name: string; ends_at: string | null; base_win_points: number; base_loss_points: number; multiplier: number },
  password: string
) => leagueAdminRequest<League>(`/leagues/${id}`, password, {
  method: 'PATCH',
  body: JSON.stringify(data),
})

export const deleteLeague = (id: number, password: string) =>
  adminRequest<void>(`/leagues/${id}`, password, { method: 'DELETE' })

// --- Divisions ---

export const getDivisions = (leagueId: number) =>
  request<Division[]>(`/leagues/${leagueId}/divisions`)

export const createDivision = (leagueId: number, data: { name: string; rank: number }, password: string) =>
  leagueAdminRequest<Division>(`/leagues/${leagueId}/divisions`, password, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateDivision = (leagueId: number, divisionId: number, data: { name: string; rank: number }, password: string) =>
  leagueAdminRequest<Division>(`/leagues/${leagueId}/divisions/${divisionId}`, password, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const deleteDivision = (leagueId: number, divisionId: number, password: string) =>
  leagueAdminRequest<void>(`/leagues/${leagueId}/divisions/${divisionId}`, password, {
    method: 'DELETE',
  })

// --- Players ---

export const getPlayers = (leagueId: number) =>
  request<Player[]>(`/leagues/${leagueId}/players`)

export const createPlayer = (leagueId: number, name: string, password: string) =>
  leagueAdminRequest<Player>(`/leagues/${leagueId}/players`, password, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })

export const updatePlayer = (leagueId: number, id: number, name: string, password: string) =>
  leagueAdminRequest<Player>(`/leagues/${leagueId}/players/${id}`, password, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })

export const deletePlayer = (leagueId: number, id: number, password: string) =>
  leagueAdminRequest<void>(`/leagues/${leagueId}/players/${id}`, password, {
    method: 'DELETE',
  })

export const assignPlayerDivision = (leagueId: number, playerId: number, divisionId: number | null, password: string) =>
  leagueAdminRequest<Player>(`/leagues/${leagueId}/players/${playerId}/division`, password, {
    method: 'PATCH',
    body: JSON.stringify({ division_id: divisionId }),
  })

// --- Matches ---

export const getMatches = (leagueId: number) =>
  request<Match[]>(`/matches/?league_id=${leagueId}`)

export const createMatch = (data: {
  league_id: number
  team_a_player_1_id: number
  team_a_player_2_id: number
  team_b_player_1_id: number
  team_b_player_2_id: number
  team_a_score: number
  team_b_score: number
  played_at?: string
}) => request<Match>('/matches/', {
  method: 'POST',
  body: JSON.stringify(data),
})

export const updateMatch = (id: number, data: { team_a_score: number; team_b_score: number; played_at: string }) =>
  request<Match>(`/matches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

export const deleteMatch = (id: number) =>
  request<void>(`/matches/${id}`, { method: 'DELETE' })

// --- Standings ---

export const getStandings = (leagueId: number) =>
  request<DivisionStandings[]>(`/leagues/${leagueId}/standings`)

// --- League Defaults ---

export const getLeagueDefaults = () =>
  request<LeagueDefaults>('/league-defaults')
