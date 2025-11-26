import { useState, FormEvent } from 'react'
import { useSession } from '../../contexts/SessionContext'
import { Button, Input, Card } from '../ui'
import toast from 'react-hot-toast'

interface JoinSessionFormProps {
  onSuccess?: () => void
}

export default function JoinSessionForm({ onSuccess }: JoinSessionFormProps) {
  const { joinSession } = useSession()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
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
          Join Session
        </h2>
        <p className="font-mono text-sm text-gray-400">
          Enter the join code to view matches and leaderboards
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          disabled={loading || !joinCode}
        >
          {loading ? 'Joining...' : 'Join Session'}
        </Button>
      </form>
    </Card>
  )
}
