import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSession } from '../../contexts/SessionContext'
import { PageLayout, Card, Button, Badge } from '../ui'
import { getGroupDetails } from '../../lib/api/groups'
import toast from 'react-hot-toast'

interface GroupMember {
  id: string
  user_id: string
  role: 'admin' | 'member'
  profiles: {
    id: string
    display_name: string
    username: string
    avatar_url: string | null
  }
}

interface GroupSessionLobbyProps {
  groupId: string
  onContinue?: () => void
  onBack?: () => void
}

export function GroupSessionLobby({
  groupId,
  onContinue,
  onBack,
}: GroupSessionLobbyProps) {
  const { user, signOut } = useAuth()
  const {
    activeSession,
    sessionPlayers,
    removePlayer,
    setCoLogger,
    endSession,
    leaveSession,
    refreshSession,
  } = useSession()

  const [groupName, setGroupName] = useState('')
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(false)

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSession()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Load group details and members
  useEffect(() => {
    async function loadGroupDetails() {
      try {
        const group = await getGroupDetails(groupId)
        setGroupName(group.name)
        setGroupMembers(group.group_members)
      } catch (error) {
        console.error('Error loading group details:', error)
      }
    }
    loadGroupDetails()
  }, [groupId])

  if (!activeSession) return null

  const isInitiator = user?.id === activeSession.initiator_user_id
  const playerCount = sessionPlayers.length
  const isGroupSession = activeSession.session_type === 'group'

  // Get members not yet in the session
  const availableMembers = groupMembers.filter(
    (member) =>
      !sessionPlayers.some((player) => player.profile_id === member.user_id)
  )

  async function handleAddMember(member: GroupMember) {
    if (!activeSession) return

    try {
      setLoading(true)
      await addPlayer(member.profiles.display_name, member.user_id)
      toast.success(`${member.profiles.display_name} added to session`)
    } catch (error: any) {
      console.error('Error adding member:', error)
      toast.error(error?.message || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemovePlayer(playerId: string) {
    if (!confirm('Remove this player?')) return

    try {
      await removePlayer(playerId)
      toast.success('Player removed')
    } catch (error) {
      toast.error('Failed to remove player')
    }
  }

  async function handleSetCoLogger(playerId: string) {
    if (!activeSession) return

    try {
      await setCoLogger(
        playerId === activeSession.co_logger_player_id ? null : playerId
      )
      toast.success('Co-logger updated')
    } catch (error) {
      toast.error('Failed to update co-logger')
    }
  }

  async function handleEndSession() {
    if (!confirm('End this session? This cannot be undone.')) return

    try {
      await endSession()
      toast.success('Session ended')
      if (onBack) onBack()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to end session')
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  function handleLeaveSession() {
    if (!confirm('Leave this session?')) return
    leaveSession()
    toast.success('Left session')
    if (onBack) onBack()
  }

  return (
    <PageLayout
      header={
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl text-gradient-neon">
              GROUP SESSION LOBBY
            </h1>
            {groupName && (
              <p className="font-mono text-sm text-neon-green mt-1">
                {groupName}
              </p>
            )}
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                Back to Group
              </Button>
            )}
            {user && (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            )}
            {isInitiator ? (
              <Button variant="danger" size="sm" onClick={handleEndSession}>
                End Session
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={handleLeaveSession}>
                Leave Session
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Session Info */}
        <Card variant="neon-green">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-display text-xl text-neon-green mb-2">
                Group Session
              </h2>
              <p className="font-mono text-sm text-gray-400">
                {isGroupSession
                  ? 'Members-only session'
                  : 'Internal session ID: ' + activeSession.id.substring(0, 8)}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="success">Active</Badge>
              <p className="font-mono text-xs text-gray-400 mt-2">
                Expires: {new Date(activeSession.expires_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Players List */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-xl text-neon-green">
              Players ({playerCount}/10)
            </h2>
            <Button
              onClick={onContinue}
              variant={playerCount >= 4 ? 'primary' : 'ghost'}
            >
              {playerCount >= 4 ? 'Start Session' : 'View Dashboard'}
            </Button>
          </div>

          {playerCount < 4 && isInitiator && (
            <p className="font-mono text-sm text-neon-yellow mb-4">
              ⚠️ Need at least 4 players to start logging matches
            </p>
          )}

          {!isInitiator && (
            <p className="font-mono text-sm text-gray-400 mb-4">
              ℹ️ Group members will automatically join as they connect
            </p>
          )}

          <p className="font-mono text-sm text-neon-blue mb-4">
            💡 Group members can join this session from the group dashboard
          </p>

          {/* Available Members to Add */}
          {isInitiator && availableMembers.length > 0 && (
            <div className="mb-6">
              <h3 className="font-mono text-sm text-gray-400 mb-3">
                Available Group Members:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 bg-bg-secondary border border-border rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white">
                        {member.profiles.display_name}
                      </span>
                      {member.role === 'admin' && (
                        <Badge variant="success" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAddMember(member)}
                      disabled={loading}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player List */}
          <div className="space-y-2">
            {sessionPlayers.length === 0 && (
              <p className="font-mono text-sm text-gray-400 text-center py-8">
                No players yet. Group members can join from the dashboard.
              </p>
            )}
            {sessionPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-bg-secondary border-2 border-border rounded"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-white">
                    {player.display_name}
                  </span>
                  {player.profile_id && (
                    <Badge variant="info" className="text-xs">
                      Member
                    </Badge>
                  )}
                  {player.id === activeSession.co_logger_player_id && (
                    <Badge variant="warning" className="text-xs">
                      Co-Logger
                    </Badge>
                  )}
                </div>
                {isInitiator && (
                  <div className="flex gap-2">
                    {player.profile_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetCoLogger(player.id)}
                      >
                        {player.id === activeSession.co_logger_player_id
                          ? 'Remove Co-Logger'
                          : 'Make Co-Logger'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemovePlayer(player.id)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  )
}
