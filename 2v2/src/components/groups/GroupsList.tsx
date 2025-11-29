import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getUserGroups } from '../../lib/api/groups'
import { Card, Button, Badge } from '../ui'
import { CreateGroupForm } from './CreateGroupForm'

interface Group {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  created_at: string
  created_by_user_id: string
  userRole: 'admin' | 'member'
  joinedAt: string
}

export function GroupsList() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  async function loadGroups() {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const data = await getUserGroups(user.id)
      setGroups(data)
    } catch (err: any) {
      console.error('Error loading groups:', err)
      setError(err.message || 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [user])

  function handleGroupCreated() {
    setShowCreateForm(false)
    loadGroups()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading groups...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Groups</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create Group'}
        </Button>
      </div>

      {showCreateForm && (
        <Card variant="neon-green">
          <CreateGroupForm
            onSuccess={handleGroupCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {groups.length === 0 && !showCreateForm ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">You're not in any groups yet.</p>
            <Button onClick={() => setShowCreateForm(true)}>Create Your First Group</Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              variant={group.userRole === 'admin' ? 'neon-green' : 'default'}
              className="cursor-pointer hover:scale-105 transition-transform"
              onClick={() => {
                window.location.href = `/groups/${group.id}`
              }}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-white">{group.name}</h3>
                  <Badge variant={group.userRole === 'admin' ? 'success' : 'info'}>
                    {group.userRole}
                  </Badge>
                </div>

                {group.description && (
                  <p className="text-gray-400 text-sm line-clamp-2">{group.description}</p>
                )}

                <div className="text-xs text-gray-500">
                  Joined {new Date(group.joinedAt).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
