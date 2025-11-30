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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let mounted = true

    // Safety timeout for auth loading (20 seconds to handle slow connections)
    timeoutRef.current = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timed out after 20 seconds')
        setLoading(false)
      }
    }, 20000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return

      console.log('Initial session check:', session ? 'logged in' : 'not logged in')
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        console.log('No session, setting loading to false')
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setLoading(false)
      }
    }).catch(err => {
      console.error('Error getting initial session:', err)
      if (mounted) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setLoading(false)
      }
    })

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
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId: string) {
    try {
      console.log('[AUTH] Loading profile for user:', userId)
      const startTime = Date.now()

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

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
      // Clear timeout when profile loading completes
      if (timeoutRef.current) {
        console.log('[AUTH] Clearing timeout and setting loading to false')
        clearTimeout(timeoutRef.current)
      }
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
        .update({ display_name: displayName } as any)
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
