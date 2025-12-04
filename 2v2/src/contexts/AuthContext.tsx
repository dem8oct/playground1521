import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (displayName: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const loadingProfileRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    async function loadAuth() {
      try {
        // Add timeout protection - 10 seconds
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('[AUTH] Loading timed out after 10 seconds')
            setLoading(false)
          }
        }, 10000)

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        console.log('Initial session check:', session ? 'logged in' : 'not logged in')
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          console.log('No session, setting loading to false')
          setLoading(false)
        }
      } catch (err) {
        console.error('Error getting initial session:', err)
        if (mounted) {
          setLoading(false)
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }

    loadAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)

        if (!mounted) return

        // Don't process INITIAL_SESSION since we already handled it above
        if (event === 'INITIAL_SESSION') return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId: string) {
    // Prevent duplicate loads
    if (loadingProfileRef.current) {
      console.log('[AUTH] Profile load already in progress, skipping')
      return
    }

    // Skip if we already have the profile for this user
    if (currentUserIdRef.current === userId && profile) {
      console.log('[AUTH] Profile already loaded for this user, skipping')
      return
    }

    loadingProfileRef.current = true
    currentUserIdRef.current = userId

    let queryTimeoutId: NodeJS.Timeout | undefined
    try {
      console.log('[AUTH] Loading profile for user:', userId)
      const startTime = Date.now()

      // Add query-level timeout protection
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle<Profile>()

      const timeoutPromise = new Promise<never>((_, reject) => {
        queryTimeoutId = setTimeout(() => {
          console.error('[AUTH] Profile query timed out after 10 seconds')
          reject(new Error('Profile query timeout'))
        }, 10000)
      })

      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      // Clear timeout if query succeeded
      if (queryTimeoutId) clearTimeout(queryTimeoutId)

      const loadTime = Date.now() - startTime
      console.log(`[AUTH] Profile query took ${loadTime}ms`)

      if (error) {
        console.error('[AUTH] Error loading profile:', error)
        throw error
      }

      if (!data) {
        console.warn('[AUTH] No profile found for user:', userId)
      } else {
        console.log('[AUTH] Profile loaded successfully:', {
          username: data.username,
          display_name: data.display_name,
          is_admin: data.is_admin
        })
      }

      setProfile(data)
    } catch (error) {
      console.error('[AUTH] Failed to load profile:', error)
      // Set profile to null on error so app doesn't get stuck
      setProfile(null)
    } finally {
      // Ensure timeout is cleared in all cases
      if (queryTimeoutId) clearTimeout(queryTimeoutId)
      loadingProfileRef.current = false
      console.log('[AUTH] Setting loading to false')
      setLoading(false)
    }
  }

  async function signInWithEmail(email: string) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      return { error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: error as AuthError }
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setSession(null)
      loadingProfileRef.current = false
      currentUserIdRef.current = null
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  async function updateProfile(displayName: string) {
    if (!user) throw new Error('No user logged in')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName } as never)
        .eq('id', user.id)

      if (error) throw error

      // Reload profile
      await loadProfile(user.id)
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signInWithEmail,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
