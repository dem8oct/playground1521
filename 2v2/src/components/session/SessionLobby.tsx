import { useState, FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSession } from '../../contexts/SessionContext'
import { PageLayout, Card, Button, Input, Badge, Select } from '../ui'
import toast from 'react-hot-toast'

interface SessionLobbyProps {
  onContinue?: () => void
}

export default function SessionLobby({ onContinue }: SessionLobbyProps) {
  const { user, signOut } = useAuth()
  const {
    activeSession,
    sessionPlayers,
    addPlayer,
    removePlayer,
    setCoLogger,
    endSession,
    leaveSession,
  } = useSession()

  const [newPlayerName, setNewPlayerName] = useState('')
  const [loading, setLoading] = useState(false)

  if (!activeSession) return null

  const isInitiator = user?.id === activeSession.initiator_user_id
  const playerCount = sessionPlayers.length
  const canAddPlayers = playerCount < 10

  async function handleAddPlayer(e: FormEvent) {
    e.preventDefault()
    if (!newPlayerName.trim()) return

    setLoading(true)
    try {
      await addPlayer(newPlayerName.trim())
      setNewPlayerName('')
      toast.success('Player added')
    } catch (error: any) {
      if (error?.message?.includes('duplicate')) {
        toast.error('Player name already exists')
      } else {
        toast.error('Failed to add player')
      }
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
    try {
      await setCoLogger(playerId === activeSession.co_logger_player_id ? null : playerId)
      toast.success('Co-logger updated')
    } catch (error) {
      toast.error('Failed to update co-logger')
    }
  }

  async function handleEndSession() {
    if (!confirm('End this session? This cannot be undone.')) return

    try {
      console.log('Attempting to end session...')
      await endSession()
      toast.success('Session ended')
    } catch (error: any) {
      console.error('End session error:', error)
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
  }

  return (
    <PageLayout
      header={
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <h1 className="font-display text-2xl text-gradient-neon">
            SESSION LOBBY
          </h1>
          <div className="flex gap-3 items-center flex-wrap">
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
                Join Code
              </h2>
              <p className="font-mono text-4xl text-white tracking-wider">
                {activeSession.join_code}
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
            <Button onClick={onContinue} variant={playerCount >= 4 ? 'primary' : 'ghost'}>
              {playerCount >= 4 ? 'Continue to Dashboard' : 'View Dashboard'}
            </Button>
          </div>

          {playerCount < 4 && isInitiator && (
            <p className="font-mono text-sm text-neon-yellow mb-4">
              ⚠️ Need at least 4 players to start logging matches
            </p>
          )}

          {!isInitiator && (
            <p className="font-mono text-sm text-gray-400 mb-4">
              ℹ️ You're viewing as a guest. The initiator will add players.
            </p>
          )}

          {/* Add Player Form */}
          {canAddPlayers && isInitiator && (
            <form onSubmit={handleAddPlayer} className="mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !newPlayerName}>
                  Add
                </Button>
              </div>
            </form>
          )}

          {/* Player List */}
          <div className="space-y-2">
            {sessionPlayers.length === 0 && (
              <p className="font-mono text-sm text-gray-400 text-center py-8">
                No players added yet
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
                      Linked
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSetCoLogger(player.id)}
                    >
                      {player.id === activeSession.co_logger_player_id
                        ? 'Remove Co-Logger'
                        : 'Make Co-Logger'}
                    </Button>
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
