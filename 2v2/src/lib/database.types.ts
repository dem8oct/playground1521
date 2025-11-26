export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string
          initiator_user_id: string
          co_logger_player_id: string | null
          join_code: string
          status: 'active' | 'ended' | 'expired'
          created_at: string
          expires_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          initiator_user_id: string
          co_logger_player_id?: string | null
          join_code: string
          status?: 'active' | 'ended' | 'expired'
          created_at?: string
          expires_at: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          initiator_user_id?: string
          co_logger_player_id?: string | null
          join_code?: string
          status?: 'active' | 'ended' | 'expired'
          created_at?: string
          expires_at?: string
          ended_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          display_name: string
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          created_at?: string
        }
      }
      session_players: {
        Row: {
          id: string
          session_id: string
          profile_id: string | null
          display_name: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          profile_id?: string | null
          display_name: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          profile_id?: string | null
          display_name?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          session_id: string
          logged_by_user_id: string
          team_a_player_ids: string[]
          team_b_player_ids: string[]
          team_a_club: string | null
          team_b_club: string | null
          team_a_goals: number
          team_b_goals: number
          played_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          logged_by_user_id: string
          team_a_player_ids: string[]
          team_b_player_ids: string[]
          team_a_club?: string | null
          team_b_club?: string | null
          team_a_goals: number
          team_b_goals: number
          played_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          logged_by_user_id?: string
          team_a_player_ids?: string[]
          team_b_player_ids?: string[]
          team_a_club?: string | null
          team_b_club?: string | null
          team_a_goals?: number
          team_b_goals?: number
          played_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      player_stats: {
        Row: {
          id: string
          session_id: string
          session_player_id: string
          mp: number
          w: number
          d: number
          l: number
          gf: number
          ga: number
          gd: number
          pts: number
        }
        Insert: {
          id?: string
          session_id: string
          session_player_id: string
          mp?: number
          w?: number
          d?: number
          l?: number
          gf?: number
          ga?: number
          gd?: number
          pts?: number
        }
        Update: {
          id?: string
          session_id?: string
          session_player_id?: string
          mp?: number
          w?: number
          d?: number
          l?: number
          gf?: number
          ga?: number
          gd?: number
          pts?: number
        }
      }
      pair_stats: {
        Row: {
          id: string
          session_id: string
          session_player_id_1: string
          session_player_id_2: string
          label: string
          mp: number
          w: number
          d: number
          l: number
          gf: number
          ga: number
          gd: number
          pts: number
        }
        Insert: {
          id?: string
          session_id: string
          session_player_id_1: string
          session_player_id_2: string
          label: string
          mp?: number
          w?: number
          d?: number
          l?: number
          gf?: number
          ga?: number
          gd?: number
          pts?: number
        }
        Update: {
          id?: string
          session_id?: string
          session_player_id_1?: string
          session_player_id_2?: string
          label?: string
          mp?: number
          w?: number
          d?: number
          l?: number
          gf?: number
          ga?: number
          gd?: number
          pts?: number
        }
      }
    }
  }
}
