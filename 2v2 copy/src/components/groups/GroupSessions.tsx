import { useState, useEffect } from 'react'
import { Card, Button, Badge } from '../ui'
import { getActiveGroupSessions } from '../../lib/api/groups'
import toast from 'react-hot-toast'

interface GroupSessionsProps {
  groupId: string
  onCreateSession: () => void
  onJoinSession: (sessionId: string) => void
}

export function GroupSessions({
  groupId,
  onCreateSession,
  onJoinSession,
}: GroupSessionsProps) {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActiveSessions()
  }, [groupId])

  async function loadActiveSessions() {
    try {
      setLoading(true)
      const data = await getActiveGroupSessions(groupId)
      setSessions(data)
    } catch (error: any) {
      console.error('Error loading active sessions:', error)
      toast.error('Failed to load active sessions')
    } finally {
      setLoading(false)
    }
  }

  function handleRefresh() {
    loadActiveSessions()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-neon-green">Active Sessions</h2>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="ghost" size="sm">
            Refresh
          </Button>
          <Button onClick={onCreateSession} variant="primary">
            Create Session
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <p className="font-mono text-sm text-gray-400 text-center py-8">
            Loading sessions...
          </p>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="font-mono text-sm text-gray-400 mb-4">
              No active sessions
            </p>
            <p className="font-mono text-xs text-gray-500 mb-6">
              Create a new session to start playing matches
            </p>
            <Button onClick={onCreateSession} variant="primary">
              Create First Session
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session) => (
            <Card key={session.id} variant="neon-blue">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success">Active</Badge>
                      <span className="font-mono text-xs text-gray-400">
                        {session.player_count} player{session.player_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-gray-400">
                      Started: {new Date(session.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <p className="font-mono text-xs text-gray-500">
                    Expires: {new Date(session.expires_at).toLocaleTimeString()}
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onJoinSession(session.id)}
                  >
                    Join
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
