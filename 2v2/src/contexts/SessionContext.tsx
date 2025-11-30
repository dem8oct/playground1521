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
  createGroupSession: (groupId: string) => Promise<Session>
  joinGroupSession: (sessionId: string, groupId: string) => Promise<Session>
  endSession: () => Promise<void>
  leaveSession: () => void
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
    let timeoutId: NodeJS.Timeout

    async function loadActiveSession() {
      try {
        // Safety timeout - if loading takes more than 5 seconds, give up
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Session loading timed out after 5 seconds')
            setLoading(false)
          }
        }, 5000)

        // Check if there's a session stored in localStorage
        const storedSessionId = localStorage.getItem('2v2-kickoff-session')

        if (storedSessionId) {
          console.log('Loading stored session:', storedSessionId)
          // Try to load the stored session
          const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', storedSessionId)
            .eq('status', 'active')
            .maybeSingle()

          if (error) {
            console.error('Error loading stored session:', error)
            throw error
          }

          if (mounted && data) {
            console.log('Stored session found and active:', data)
            setActiveSession(data)
            await loadSessionPlayers(data.id)
          } else {
            console.log('Stored session not found or not active, clearing localStorage')
            // Session not found or no longer active, clear localStorage
            localStorage.removeItem('2v2-kickoff-session')
          }
        } else {
          console.log('No stored session ID in localStorage')
        }
      } catch (error) {
        console.error('Error loading session:', error)
        localStorage.removeItem('2v2-kickoff-session')
      } finally {
        if (mounted) {
          console.log('Session loading complete, setting loading to false')
          clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    }

    loadActiveSession()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
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

      console.log('Creating session with user ID:', user.id)
      console.log('Join code:', joinCode)
      console.log('Expires at:', expiresAt)

      // Check current auth session
      const { data: { session: authSession } } = await supabase.auth.getSession()
      console.log('Current auth session:', authSession ? 'exists' : 'missing')
      console.log('Access token present:', !!authSession?.access_token)

      // Verify Supabase client is properly configured
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Using auth token:', authSession?.access_token ? 'yes' : 'no')

      const insertData = {
        initiator_user_id: user.id,
        join_code: joinCode,
        expires_at: expiresAt,
      }
      console.log('Insert data:', insertData)

      // Add timeout to prevent infinite hanging
      console.log('Starting database insert...')
      const insertPromise = supabase
        .from('sessions')
        .insert(insertData as any)
        .select()
        .single()
        .then(result => {
          console.log('Database insert completed:', result)
          return result
        })
        .catch(err => {
          console.log('Database insert error:', err)
          throw err
        })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          console.log('Database request timed out!')
          reject(new Error('Database request timed out after 10 seconds'))
        }, 10000)
      )

      const result = await Promise.race([insertPromise, timeoutPromise]) as any

      console.log('Race result:', result)
      console.log('Result type:', typeof result)
      console.log('Result keys:', Object.keys(result || {}))

      const { data, error } = result

      console.log('Insert response - data:', data)
      console.log('Insert response - error:', error)

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      if (!data) {
        console.error('No data in response, full result:', result)
        throw new Error('No session data returned')
      }

      console.log('Session created successfully:', data)
      setActiveSession(data)
      // Store session ID in localStorage
      localStorage.setItem('2v2-kickoff-session', data.id)
      return data
    } catch (error: any) {
      console.error('Error creating session:', error)
      throw error
    }
  }

  async function joinSession(joinCode: string): Promise<Session> {
    try {
      console.log('Attempting to join session with code:', joinCode)

      // Add timeout protection to prevent infinite hanging
      const queryPromise = supabase
        .from('sessions')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .eq('status', 'active')
        .maybeSingle()
        .then(result => {
          console.log('Join query completed:', result)
          return result
        })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          console.log('Join session query timed out!')
          reject(new Error('Request timed out after 10 seconds. Please check your connection.'))
        }, 10000)
      )

      const result = await Promise.race([queryPromise, timeoutPromise]) as any
      const { data, error } = result

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!data) throw new Error('Session not found or expired')

      console.log('Successfully joined session:', data)
      setActiveSession(data)
      // Store session ID in localStorage
      localStorage.setItem('2v2-kickoff-session', data.id)
      await loadSessionPlayers(data.id)
      return data
    } catch (error) {
      console.error('Error joining session:', error)
      throw error
    }
  }

  async function createGroupSession(groupId: string): Promise<Session> {
    if (!user) throw new Error('Must be logged in to create group session')

    const { generateJoinCode, getSessionExpiration } = await import(
      '../lib/sessionUtils'
    )
    const { createGroupSession: apiCreateGroupSession } = await import(
      '../lib/api/groups'
    )

    try {
      const joinCode = generateJoinCode()
      const expiresAt = getSessionExpiration()

      console.log('Creating group session for group:', groupId)

      const session = await apiCreateGroupSession({
        groupId,
        joinCode,
        expiresAt,
      })

      console.log('Group session created successfully:', session)
      setActiveSession(session)
      localStorage.setItem('2v2-kickoff-session', session.id)
      return session
    } catch (error: any) {
      console.error('Error creating group session:', error)
      throw error
    }
  }

  async function joinGroupSession(
    sessionId: string,
    groupId: string
  ): Promise<Session> {
    const { joinGroupSession: apiJoinGroupSession } = await import(
      '../lib/api/groups'
    )

    try {
      console.log('Joining group session:', sessionId)

      // Call API to join (validates membership)
      await apiJoinGroupSession(sessionId, groupId)

      // Load the session
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error

      console.log('Successfully joined group session:', data)
      setActiveSession(data)
      localStorage.setItem('2v2-kickoff-session', data.id)
      await loadSessionPlayers(data.id)
      return data
    } catch (error) {
      console.error('Error joining group session:', error)
      throw error
    }
  }

  async function endSession(): Promise<void> {
    console.log('endSession called', { activeSession, user })

    if (!activeSession) {
      throw new Error('No active session')
    }

    if (!user) {
      throw new Error('Must be logged in to end session')
    }

    if (activeSession.initiator_user_id !== user.id) {
      throw new Error('Only initiator can end session')
    }

    try {
      console.log('Updating session status to ended...')
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        } as any)
        .eq('id', activeSession.id)

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('Session ended successfully')
      setActiveSession(null)
      setSessionPlayers([])
      // Clear session from localStorage
      localStorage.removeItem('2v2-kickoff-session')
    } catch (error: any) {
      console.error('Error ending session:', error)
      throw error
    }
  }

  function leaveSession(): void {
    // Simply clear local state and localStorage without ending the session
    setActiveSession(null)
    setSessionPlayers([])
    localStorage.removeItem('2v2-kickoff-session')
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
      } as any)

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
        .update({ co_logger_player_id: playerId } as any)
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
    createGroupSession,
    joinGroupSession,
    endSession,
    leaveSession,
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
