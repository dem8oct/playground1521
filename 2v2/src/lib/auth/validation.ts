// Username validation utilities

export function validateUsername(username: string): {
  valid: boolean
  error?: string
} {
  if (!username) {
    return { valid: false, error: 'Username is required' }
  }

  if (username.length < 5 || username.length > 10) {
    return { valid: false, error: 'Username must be 5-10 characters' }
  }

  if (!/^[a-z0-9]+$/.test(username)) {
    return {
      valid: false,
      error: 'Username must be lowercase letters and numbers only',
    }
  }

  return { valid: true }
}

export function validatePassword(password: string): {
  valid: boolean
  error?: string
} {
  if (!password) {
    return { valid: false, error: 'Password is required' }
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' }
  }

  return { valid: true }
}

export function validateEmail(email: string): {
  valid: boolean
  error?: string
} {
  if (!email) {
    return { valid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true }
}
