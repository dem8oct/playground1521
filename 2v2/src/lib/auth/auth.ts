// @ts-nocheck
import { supabase } from '../supabase'
import { validateUsername, validateEmail, validatePassword } from './validation'

// Signup with username, email, and password
export async function signUp(data: {
  username: string
  email: string
  password: string
  displayName: string
}) {
  // Validate inputs
  const usernameValidation = validateUsername(data.username)
  if (!usernameValidation.valid) {
    throw new Error(usernameValidation.error)
  }

  const emailValidation = validateEmail(data.email)
  if (!emailValidation.valid) {
    throw new Error(emailValidation.error)
  }

  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.error)
  }

  // Check if username is already taken
  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', data.username)
    .maybeSingle<{ username: string }>()

  if (existing) {
    throw new Error('Username already taken')
  }

  // Sign up with Supabase Auth
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        username: data.username,
        display_name: data.displayName,
      },
    },
  })

  if (error) throw error

  return authData
}

// Login with username OR email + password
export async function login(identifier: string, password: string) {
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    throw new Error(passwordValidation.error)
  }

  // Check if identifier is email or username
  const isEmail = identifier.includes('@')

  if (isEmail) {
    // Standard email login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    })
    if (error) throw error
    return data
  } else {
    // Username login - need to lookup email first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', identifier)
      .maybeSingle<{ id: string }>()

    if (profileError || !profile) {
      throw new Error('Invalid username or password')
    }

    // Get user's email from auth.users via our function
    const { data: emailData, error: emailError } = await supabase.rpc(
      'get_user_email_by_profile_id',
      { profile_id: profile.id }
    )

    if (emailError || !emailData || emailData.length === 0) {
      throw new Error('Invalid username or password')
    }

    // Login with email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailData[0].email,
      password,
    })

    if (error) throw error
    return data
  }
}

// Logout
export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
