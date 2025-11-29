import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getGroupDetails, updateGroup, deleteGroup } from '../../lib/api/groups'
import { PageLayout, Card, Button, Input, Badge } from '../ui'
import { GroupMembers } from './GroupMembers'
import { InviteUser } from './InviteUser'
import { GroupLeaderboards } from './GroupLeaderboards'

interface GroupDetails {
  id: string
  name: string
  description: string | null
  created_by_user_id: string
  avatar_url: string | null
  created_at: string
  updated_at: string
  group_members: Array<{
    id: string
    user_id: string
    role: 'admin' | 'member'
    joined_at: string
    profiles: {
      id: string
      display_name: string
      username: string
      avatar_url: string | null
    }
  }>
}

interface GroupDashboardProps {
  groupId: string
  onBack?: () => void
}

type TabType = 'overview' | 'members' | 'leaderboards' | 'settings'

export function GroupDashboard({ groupId, onBack }: GroupDashboardProps) {
  const { user } = useAuth()
  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isAdmin, setIsAdmin] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)

  async function loadGroup() {
    setLoading(true)
    setError(null)

    try {
      const data = await getGroupDetails(groupId)
      setGroup(data)
      setEditName(data.name)
      setEditDescription(data.description || '')

      // Check if current user is admin
      const userMembership = data.group_members.find((m: any) => m.user_id === user?.id)
      setIsAdmin(userMembership?.role === 'admin')
    } catch (err: any) {
      console.error('Error loading group:', err)
      setError(err.message || 'Failed to load group')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroup()
  }, [groupId, user])

  async function handleUpdateGroup() {
    if (!editName.trim()) return

    setUpdateLoading(true)
    try {
      await updateGroup(groupId, {
        name: editName,
        description: editDescription || undefined,
      })
      await loadGroup()
      setEditMode(false)
    } catch (err: any) {
      console.error('Error updating group:', err)
      alert(err.message || 'Failed to update group')
    } finally {
      setUpdateLoading(false)
    }
  }

  async function handleDeleteGroup() {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return
    }

    if (!confirm('This will delete all group sessions and data. Are you ABSOLUTELY sure?')) {
      return
    }

    try {
      await deleteGroup(groupId)
      if (onBack) {
        onBack()
      }
    } catch (err: any) {
      console.error('Error deleting group:', err)
      alert(err.message || 'Failed to delete group')
    }
  }

  if (loading) {
    return (
      <PageLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">Loading group...</div>
        </div>
      </PageLayout>
    )
  }

  if (error || !group) {
    return (
      <PageLayout title="Error">
        <Card>
          <div className="text-center py-12">
            <p className="text-red-400">{error || 'Group not found'}</p>
            <Button onClick={onBack} className="mt-4">
              Back to Groups
            </Button>
          </div>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout title={group.name}>
      <div className="space-y-6">
        {/* Header */}
        <Card variant={isAdmin ? 'neon-green' : 'default'}>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{group.name}</h1>
                  {isAdmin && <Badge variant="success">Admin</Badge>}
                </div>
                {group.description && (
                  <p className="text-gray-400 mt-2">{group.description}</p>
                )}
              </div>
              <Button onClick={onBack} variant="ghost">
                Back to Groups
              </Button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{group.group_members.length} members</span>
              <span>•</span>
              <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'members'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('leaderboards')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'leaderboards'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Leaderboards
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Settings
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-white mb-4">Group Information</h2>
              <div className="space-y-2 text-gray-300">
                <p>
                  <span className="text-gray-400">Name:</span> {group.name}
                </p>
                {group.description && (
                  <p>
                    <span className="text-gray-400">Description:</span> {group.description}
                  </p>
                )}
                <p>
                  <span className="text-gray-400">Members:</span> {group.group_members.length}
                </p>
                <p>
                  <span className="text-gray-400">Created:</span>{' '}
                  {new Date(group.created_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            {isAdmin && (
              <Card variant="neon-pink">
                <InviteUser groupId={groupId} />
              </Card>
            )}
            <GroupMembers groupId={groupId} isAdmin={isAdmin} onMemberChanged={loadGroup} />
          </div>
        )}

        {activeTab === 'leaderboards' && <GroupLeaderboards groupId={groupId} />}

        {activeTab === 'settings' && isAdmin && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-white mb-4">Group Settings</h2>

              {editMode ? (
                <div className="space-y-4">
                  <Input
                    label="Group Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    minLength={3}
                    maxLength={50}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleUpdateGroup} disabled={updateLoading}>
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditMode(false)
                        setEditName(group.name)
                        setEditDescription(group.description || '')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setEditMode(true)}>Edit Group</Button>
              )}
            </Card>

            <Card variant="neon-pink">
              <h2 className="text-xl font-bold text-white mb-4">Danger Zone</h2>
              <p className="text-gray-400 mb-4">
                Deleting this group will permanently remove all group data, including sessions,
                matches, and statistics. This action cannot be undone.
              </p>
              <Button variant="danger" onClick={handleDeleteGroup}>
                Delete Group
              </Button>
            </Card>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
