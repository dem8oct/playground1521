import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client with EXPLICIT session persistence
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use localStorage for session storage
    storage: window.localStorage,
    // Set unique storageKey for the app
    storageKey: '2v2-kickoff-auth',
    // Auto-refresh the session
    autoRefreshToken: true,
    // Persist session
    persistSession: true,
    // Detect session from URL (for magic link)
    detectSessionInUrl: true,
  },
})
