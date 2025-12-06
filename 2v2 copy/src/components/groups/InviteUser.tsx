import { useState, useEffect } from 'react'
import { searchUsersByUsername, inviteUserToGroup, getPendingInvitesForGroup, cancelInvite } from '../../lib/api/groups'
import { Input, Button, Card } from '../ui'

interface UserSearchResult {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
}

interface PendingInvite {
  id: string
  invitee: {
    display_name: string
    username: string
    avatar_url: string | null
  }
  created_at: string
}

interface InviteUserProps {
  groupId: string
}

export function InviteUser({ groupId }: InviteUserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState<string | null>(null)
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [error, setError] = useState<string | null>(null)

  async function handleSearch() {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    setError(null)

    try {
      const results = await searchUsersByUsername(searchQuery)
      setSearchResults(results)
    } catch (err: any) {
      console.error('Error searching users:', err)
      setError(err.message || 'Failed to search users')
    } finally {
      setSearchLoading(false)
    }
  }

  async function loadPendingInvites() {
    try {
      const invites = await getPendingInvitesForGroup(groupId)
      setPendingInvites(invites)
    } catch (err: any) {
      console.error('Error loading pending invites:', err)
    }
  }

  useEffect(() => {
    loadPendingInvites()
  }, [groupId])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  async function handleInvite(userId: string) {
    setInviteLoading(userId)
    setError(null)

    try {
      await inviteUserToGroup({ groupId, inviteeUserId: userId })
      setSearchQuery('')
      setSearchResults([])
      await loadPendingInvites()
    } catch (err: any) {
      console.error('Error inviting user:', err)
      setError(err.message || 'Failed to send invite')
    } finally {
      setInviteLoading(null)
    }
  }

  async function handleCancelInvite(inviteId: string) {
    if (!confirm('Are you sure you want to cancel this invite?')) return

    try {
      await cancelInvite(inviteId)
      await loadPendingInvites()
    } catch (err: any) {
      console.error('Error canceling invite:', err)
      alert(err.message || 'Failed to cancel invite')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Invite Members</h3>

        <Input
          label="Search by Username"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          placeholder="username"
        />

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {searchLoading && (
          <div className="text-gray-400 text-sm">Searching...</div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <Card key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-pink-500 flex items-center justify-center text-white font-bold">
                    {user.display_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">{user.display_name}</p>
                    <p className="text-sm text-gray-400">@{user.username}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleInvite(user.id)}
                  disabled={inviteLoading === user.id}
                >
                  {inviteLoading === user.id ? 'Inviting...' : 'Invite'}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
          <p className="text-gray-400 text-sm">No users found.</p>
        )}
      </div>

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Pending Invites</h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-pink-500 flex items-center justify-center text-white font-bold">
                    {invite.invitee.display_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white">{invite.invitee.display_name}</p>
                    <p className="text-sm text-gray-400">@{invite.invitee.username}</p>
                    <p className="text-xs text-gray-500">
                      Invited {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  onClick={() => handleCancelInvite(invite.id)}
                >
                  Cancel
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
