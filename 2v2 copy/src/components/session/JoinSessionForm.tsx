import { useState, FormEvent } from 'react'
import { useSession } from '../../contexts/SessionContext'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input, Card } from '../ui'
import toast from 'react-hot-toast'

interface JoinSessionFormProps {
  onSuccess?: () => void
}

export default function JoinSessionForm({ onSuccess }: JoinSessionFormProps) {
  const { joinSession } = useSession()
  const { user } = useAuth()
  const [joinCode, setJoinCode] = useState('')
  const [guestName, setGuestName] = useState('')
  const [loading, setLoading] = useState(false)

  const isGuest = !user

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Store guest name in localStorage if guest
      if (isGuest && guestName.trim()) {
        localStorage.setItem('2v2-guest-name', guestName.trim())
      }

      await joinSession(joinCode)
      toast.success('Joined session successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Join session error:', error)
      toast.error('Invalid or expired join code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="neon-pink" className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">👥</div>
        <h2 className="font-display text-2xl text-neon-pink mb-2">
          {isGuest ? 'Join as Guest' : 'Join Session'}
        </h2>
        <p className="font-mono text-sm text-gray-400">
          {isGuest
            ? 'Enter your name and join code to view the session'
            : 'Enter the join code to view matches and leaderboards'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isGuest && (
          <Input
            label="Your Display Name"
            placeholder="Enter your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
            disabled={loading}
            className="text-center"
          />
        )}
        <Input
          label="Join Code"
          placeholder="ABC123"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          required
          disabled={loading}
          className="text-center text-2xl tracking-wider"
        />
        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={loading || !joinCode || (isGuest && !guestName.trim())}
        >
          {loading ? 'Joining...' : 'Join Session'}
        </Button>
      </form>

      {isGuest && (
        <div className="mt-4 pt-4 border-t-2 border-border">
          <p className="font-mono text-xs text-gray-400 text-center">
            💡 Guests can view the session but cannot create or modify data.
            <br />
            Sign in to create sessions and log matches.
          </p>
        </div>
      )}
    </Card>
  )
}
