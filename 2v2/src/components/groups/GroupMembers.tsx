import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getGroupMembers, removeMemberFromGroup, promoteMemberToAdmin, leaveGroup } from '../../lib/api/groups'
import { Button, Badge, Card } from '../ui'

interface Member {
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
}

interface GroupMembersProps {
  groupId: string
  isAdmin: boolean
  onMemberChanged?: () => void
}

export function GroupMembers({ groupId, isAdmin, onMemberChanged }: GroupMembersProps) {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function loadMembers() {
    setLoading(true)
    setError(null)

    try {
      const data = await getGroupMembers(groupId)
      setMembers(data)
    } catch (err: any) {
      console.error('Error loading members:', err)
      setError(err.message || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [groupId])

  async function handleRemoveMember(memberId: string, userId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return

    setActionLoading(memberId)
    try {
      await removeMemberFromGroup(groupId, userId)
      await loadMembers()
      onMemberChanged?.()
    } catch (err: any) {
      console.error('Error removing member:', err)
      alert(err.message || 'Failed to remove member')
    } finally {
      setActionLoading(null)
    }
  }

  async function handlePromoteMember(memberId: string, userId: string) {
    if (!confirm('Are you sure you want to promote this member to admin?')) return

    setActionLoading(memberId)
    try {
      await promoteMemberToAdmin(groupId, userId)
      await loadMembers()
      onMemberChanged?.()
    } catch (err: any) {
      console.error('Error promoting member:', err)
      alert(err.message || 'Failed to promote member')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleLeaveGroup() {
    if (!confirm('Are you sure you want to leave this group?')) return

    setActionLoading('leave')
    try {
      await leaveGroup(groupId)
      window.location.href = '/groups'
    } catch (err: any) {
      console.error('Error leaving group:', err)
      alert(err.message || 'Failed to leave group')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading members...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {members.map((member) => {
          const isCurrentUser = member.user_id === user?.id
          const canRemove = isAdmin && !isCurrentUser
          const canPromote = isAdmin && member.role === 'member' && !isCurrentUser

          return (
            <Card key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-pink-500 flex items-center justify-center text-white font-bold">
                  {member.profiles.display_name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{member.profiles.display_name}</p>
                    <Badge variant={member.role === 'admin' ? 'success' : 'info'}>
                      {member.role}
                    </Badge>
                    {isCurrentUser && (
                      <Badge variant="warning">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">@{member.profiles.username}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {canPromote && (
                  <Button
                    variant="secondary"
                    onClick={() => handlePromoteMember(member.id, member.user_id)}
                    disabled={actionLoading === member.id}
                  >
                    {actionLoading === member.id ? 'Promoting...' : 'Promote'}
                  </Button>
                )}
                {canRemove && (
                  <Button
                    variant="danger"
                    onClick={() => handleRemoveMember(member.id, member.user_id)}
                    disabled={actionLoading === member.id}
                  >
                    {actionLoading === member.id ? 'Removing...' : 'Remove'}
                  </Button>
                )}
                {isCurrentUser && !isAdmin && (
                  <Button
                    variant="danger"
                    onClick={handleLeaveGroup}
                    disabled={actionLoading === 'leave'}
                  >
                    {actionLoading === 'leave' ? 'Leaving...' : 'Leave Group'}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {members.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-400">No members found.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
