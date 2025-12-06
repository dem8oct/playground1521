import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getUserInvites, respondToInvite } from '../../lib/api/groups'
import { Card, Button } from '../ui'

interface Invite {
  id: string
  group_id: string
  groups: {
    id: string
    name: string
    avatar_url: string | null
    description: string | null
  }
  inviter: {
    display_name: string
    username: string
    avatar_url: string | null
  }
  created_at: string
}

export function UserInvites() {
  const { user } = useAuth()
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function loadInvites() {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const data = await getUserInvites(user.id)
      setInvites(data)
    } catch (err: any) {
      console.error('Error loading invites:', err)
      setError(err.message || 'Failed to load invites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvites()
  }, [user])

  async function handleRespond(inviteId: string, accept: boolean) {
    setActionLoading(inviteId)

    try {
      await respondToInvite(inviteId, accept)
      await loadInvites()

      if (accept) {
        // Optionally show success message or redirect to group
        alert('Invite accepted! You are now a member of the group.')
      }
    } catch (err: any) {
      console.error('Error responding to invite:', err)
      alert(err.message || 'Failed to respond to invite')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading invites...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Group Invites</h2>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {invites.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-400">You have no pending group invites.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => (
            <Card key={invite.id} variant="neon-pink">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{invite.groups.name}</h3>
                  {invite.groups.description && (
                    <p className="text-gray-400 text-sm mt-1">{invite.groups.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Invited by</span>
                  <span className="font-medium text-white">{invite.inviter.display_name}</span>
                  <span className="text-gray-500">(@{invite.inviter.username})</span>
                </div>

                <div className="text-xs text-gray-500">
                  Invited {new Date(invite.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleRespond(invite.id, true)}
                    disabled={actionLoading === invite.id}
                  >
                    {actionLoading === invite.id ? 'Accepting...' : 'Accept'}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleRespond(invite.id, false)}
                    disabled={actionLoading === invite.id}
                  >
                    {actionLoading === invite.id ? 'Declining...' : 'Decline'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
