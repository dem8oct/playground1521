import { useState } from 'react'
import { useSession } from '../../contexts/SessionContext'
import { Button, Card } from '../ui'
import toast from 'react-hot-toast'

interface CreateSessionFormProps {
  onSuccess?: () => void
}

export default function CreateSessionForm({ onSuccess }: CreateSessionFormProps) {
  const { createSession } = useSession()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      const session = await createSession()
      toast.success(`Session created! Join code: ${session.join_code}`)
      onSuccess?.()
    } catch (error) {
      console.error('Create session error:', error)
      toast.error('Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="neon-green" className="max-w-md mx-auto text-center">
      <div className="text-6xl mb-4">⚽</div>
      <h2 className="font-display text-2xl text-neon-green mb-3">
        Create New Session
      </h2>
      <p className="font-mono text-sm text-gray-300 mb-6">
        Start a new game night session. You'll get a join code to share with your friends.
      </p>
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Session'}
      </Button>
    </Card>
  )
}
