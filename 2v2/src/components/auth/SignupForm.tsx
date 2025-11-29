import { useState, FormEvent } from 'react'
import { Button, Input, Card } from '../ui'
import toast from 'react-hot-toast'
import { signUp } from '../../lib/auth/auth'
import { validateUsername } from '../../lib/auth/validation'

interface SignupFormProps {
  onSuccess?: () => void
  onShowLogin?: () => void
}

export default function SignupForm({ onSuccess, onShowLogin }: SignupFormProps) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Validate username format
    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      toast.error(usernameValidation.error!)
      return
    }

    setLoading(true)

    try {
      await signUp({
        username,
        email,
        password,
        displayName: displayName || username,
      })
      toast.success('Account created successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Signup error:', error)
      const message = error instanceof Error ? error.message : 'Failed to sign up'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="font-display text-2xl text-neon-green mb-6">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Username (5-10 chars, lowercase & numbers)"
          placeholder="username123"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          required
          disabled={loading}
        />
        <Input
          type="text"
          label="Display Name (optional)"
          placeholder="John Doe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={loading}
        />
        <Input
          type="email"
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <Input
          type="password"
          label="Password (min 6 characters)"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <Input
          type="password"
          label="Confirm Password"
          placeholder="Enter password again"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={
            loading ||
            !username ||
            !email ||
            !password ||
            !confirmPassword ||
            password !== confirmPassword
          }
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </Button>
        <div className="text-center">
          <p className="text-xs text-gray-500 font-mono">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onShowLogin}
              className="text-neon-green hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </Card>
  )
}
