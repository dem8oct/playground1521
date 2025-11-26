/**
 * Generate a random 6-character join code
 */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Calculate expiration time (10 hours from now)
 */
export function getSessionExpiration(): string {
  const now = new Date()
  const expiration = new Date(now.getTime() + 10 * 60 * 60 * 1000) // 10 hours
  return expiration.toISOString()
}

/**
 * Check if a session is expired
 */
export function isSessionExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

/**
 * Check if a session is active
 */
export function isSessionActive(status: string, expiresAt: string): boolean {
  return status === 'active' && !isSessionExpired(expiresAt)
}
