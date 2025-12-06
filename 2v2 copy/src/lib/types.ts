import { Database } from './database.types'

// Convenience type aliases from database schema
export type Session = Database['public']['Tables']['sessions']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type SessionPlayer = Database['public']['Tables']['session_players']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type PlayerStats = Database['public']['Tables']['player_stats']['Row']
export type PairStats = Database['public']['Tables']['pair_stats']['Row']

// Extended types with joined data
export type SessionPlayerWithProfile = SessionPlayer & {
  profile?: Profile | null
}

export type MatchWithPlayers = Match & {
  teamAPlayers: SessionPlayer[]
  teamBPlayers: SessionPlayer[]
  loggedBy: Profile
}

export type PlayerStatsWithPlayer = PlayerStats & {
  player: SessionPlayer
}

export type PairStatsWithPlayers = PairStats & {
  player1: SessionPlayer
  player2: SessionPlayer
}

// Form data types
export type CreateSessionData = {
  displayName: string
}

export type JoinSessionData = {
  joinCode: string
  displayName?: string
}

export type AddPlayerData = {
  displayName: string
  profileId?: string
}

export type CreateMatchData = {
  teamAPlayerIds: [string, string]
  teamBPlayerIds: [string] | [string, string]
  teamAClub?: string
  teamBClub?: string
  teamAGoals: number
  teamBGoals: number
  playedAt?: string
}

// Stats calculation types
export type MatchResult = 'win' | 'draw' | 'loss'

export type TeamStats = {
  mp: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  gd: number
  pts: number
}
