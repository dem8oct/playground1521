import { useState } from 'react'
import { Button } from '../ui'
import { useSession } from '../../contexts/SessionContext'
import toast from 'react-hot-toast'

interface CreateGroupSessionModalProps {
  groupId: string
  onClose: () => void
  onSuccess: (sessionId: string) => void
}

export function CreateGroupSessionModal({
  groupId,
  onClose,
  onSuccess,
}: CreateGroupSessionModalProps) {
  const { createGroupSession } = useSession()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    try {
      setLoading(true)
      const session = await createGroupSession(groupId)
      toast.success('Group session created!')
      onSuccess(session.id)
    } catch (error: any) {
      console.error('Error creating session:', error)
      toast.error(error?.message || 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-primary border-2 border-neon-green rounded-lg p-6 max-w-md w-full">
        <h2 className="font-display text-2xl text-neon-green mb-4">
          Create Group Session
        </h2>

        <p className="font-mono text-sm text-gray-400 mb-6">
          Create a new session for group members to join. The session will expire
          after 10 hours.
        </p>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create Session'}
          </Button>
        </div>
      </div>
    </div>
  )
}
