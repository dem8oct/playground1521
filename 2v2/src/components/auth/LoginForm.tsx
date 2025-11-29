import { useState, FormEvent } from 'react'
import { Button, Input, Card } from '../ui'
import toast from 'react-hot-toast'
import { login } from '../../lib/auth/auth'

interface LoginFormProps {
  onSuccess?: () => void
  onShowSignup?: () => void
}

export default function LoginForm({ onSuccess, onShowSignup }: LoginFormProps) {
  const [identifier, setIdentifier] = useState('') // username or email
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await login(identifier, password)
      toast.success('Logged in successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Login error:', error)
      const message = error instanceof Error ? error.message : 'Failed to login'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="font-display text-2xl text-neon-green mb-6">Sign In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          label="Username or Email"
          placeholder="username or email@example.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          disabled={loading}
        />
        <Input
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading || !identifier || !password}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
        <div className="text-center">
          <p className="text-xs text-gray-500 font-mono">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onShowSignup}
              className="text-neon-green hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </form>
    </Card>
  )
}
