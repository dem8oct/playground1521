import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { Session, SessionPlayer } from '../lib/types'

interface SessionContextType {
  activeSession: Session | null
  sessionPlayers: SessionPlayer[]
  loading: boolean
  createSession: () => Promise<Session>
  joinSession: (joinCode: string) => Promise<Session>
  endSession: () => Promise<void>
  addPlayer: (displayName: string, profileId?: string) => Promise<void>
  removePlayer: (playerId: string) => Promise<void>
  setCoLogger: (playerId: string | null) => Promise<void>
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [sessionPlayers, setSessionPlayers] = useState<SessionPlayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadActiveSession() {
      try {
        // Try to find an active session
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('status', 'active')
          .maybeSingle()

        if (error) throw error

        if (mounted && data) {
          setActiveSession(data)
          await loadSessionPlayers(data.id)
        }
      } catch (error) {
        console.error('Error loading session:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadActiveSession()

    return () => {
      mounted = false
    }
  }, [])

  async function loadSessionPlayers(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('session_players')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at')

      if (error) throw error
      setSessionPlayers(data || [])
    } catch (error) {
      console.error('Error loading session players:', error)
    }
  }

  async function createSession(): Promise<Session> {
    if (!user) throw new Error('Must be logged in to create session')

    const { generateJoinCode, getSessionExpiration } = await import(
      '../lib/sessionUtils'
    )

    try {
      const joinCode = generateJoinCode()
      const expiresAt = getSessionExpiration()

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          initiator_user_id: user.id,
          join_code: joinCode,
          expires_at: expiresAt,
        })
        .select()
        .single()

      if (error) throw error

      setActiveSession(data)
      return data
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  }

  async function joinSession(joinCode: string): Promise<Session> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .eq('status', 'active')
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Session not found or expired')

      setActiveSession(data)
      await loadSessionPlayers(data.id)
      return data
    } catch (error) {
      console.error('Error joining session:', error)
      throw error
    }
  }

  async function endSession(): Promise<void> {
    if (!activeSession || !user) return
    if (activeSession.initiator_user_id !== user.id) {
      throw new Error('Only initiator can end session')
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', activeSession.id)

      if (error) throw error

      setActiveSession(null)
      setSessionPlayers([])
    } catch (error) {
      console.error('Error ending session:', error)
      throw error
    }
  }

  async function addPlayer(
    displayName: string,
    profileId?: string
  ): Promise<void> {
    if (!activeSession) throw new Error('No active session')

    try {
      const { error } = await supabase.from('session_players').insert({
        session_id: activeSession.id,
        display_name: displayName,
        profile_id: profileId || null,
      })

      if (error) throw error

      await loadSessionPlayers(activeSession.id)
    } catch (error) {
      console.error('Error adding player:', error)
      throw error
    }
  }

  async function removePlayer(playerId: string): Promise<void> {
    if (!activeSession) throw new Error('No active session')

    try {
      const { error } = await supabase
        .from('session_players')
        .delete()
        .eq('id', playerId)

      if (error) throw error

      await loadSessionPlayers(activeSession.id)
    } catch (error) {
      console.error('Error removing player:', error)
      throw error
    }
  }

  async function setCoLogger(playerId: string | null): Promise<void> {
    if (!activeSession) throw new Error('No active session')

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ co_logger_player_id: playerId })
        .eq('id', activeSession.id)

      if (error) throw error

      setActiveSession({ ...activeSession, co_logger_player_id: playerId })
    } catch (error) {
      console.error('Error setting co-logger:', error)
      throw error
    }
  }

  async function refreshSession(): Promise<void> {
    if (!activeSession) return

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', activeSession.id)
        .single()

      if (error) throw error

      setActiveSession(data)
      await loadSessionPlayers(data.id)
    } catch (error) {
      console.error('Error refreshing session:', error)
    }
  }

  const value = {
    activeSession,
    sessionPlayers,
    loading,
    createSession,
    joinSession,
    endSession,
    addPlayer,
    removePlayer,
    setCoLogger,
    refreshSession,
  }

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
