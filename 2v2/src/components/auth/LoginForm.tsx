import { useState, FormEvent } from 'react'
import { Button, Input, Card } from '../ui'
import toast from 'react-hot-toast'

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { supabase } = await import('../../lib/supabase')
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSubmitted(true)
      toast.success('Magic link sent! Check your email.')
      onSuccess?.()
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="max-w-md mx-auto">
        <div className="text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="font-display text-2xl text-neon-green mb-2">
            Check Your Email
          </h2>
          <p className="font-mono text-sm text-gray-400 mb-6">
            We sent a magic link to <span className="text-white">{email}</span>
          </p>
          <p className="font-mono text-xs text-gray-500">
            Click the link in the email to sign in. It may take a minute to arrive.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="font-display text-2xl text-neon-green mb-6">Sign In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={loading || !email}
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </Button>
        <p className="text-xs text-gray-500 font-mono text-center">
          No password needed. We'll email you a link to sign in.
        </p>
      </form>
    </Card>
  )
}
