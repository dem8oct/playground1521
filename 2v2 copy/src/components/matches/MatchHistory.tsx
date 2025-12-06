import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { useSession } from '../../contexts/SessionContext'
import { Card, Button } from '../ui'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import type { Match, SessionPlayer } from '../../lib/types'

interface MatchWithDetails extends Match {
  teamAPlayers?: SessionPlayer[]
  teamBPlayers?: SessionPlayer[]
  loggedByName?: string
}

export default function MatchHistory() {
  const { user } = useAuth()
  const { activeSession, sessionPlayers } = useSession()

  if (!activeSession) return null

  const isInitiator = user?.id === activeSession.initiator_user_id
  const isCoLogger = sessionPlayers.some(
    p => p.id === activeSession.co_logger_player_id && p.profile_id === user?.id
  )
  const canEditDelete = isInitiator || isCoLogger

  // Fetch matches
  const { data: matches, isLoading, refetch } = useQuery({
    queryKey: ['matches', activeSession.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('session_id', activeSession.id)
        .order('played_at', { ascending: false })

      if (error) throw error

      // Enhance with player details
      const enhanced: MatchWithDetails[] = (data || []).map((match: Match) => {
        const teamAPlayers = match.team_a_player_ids
          .map((id: string) => sessionPlayers.find(p => p.id === id))
          .filter(Boolean) as SessionPlayer[]

        const teamBPlayers = match.team_b_player_ids
          .map((id: string) => sessionPlayers.find(p => p.id === id))
          .filter(Boolean) as SessionPlayer[]

        return {
          ...match,
          teamAPlayers,
          teamBPlayers,
          loggedByName: user?.id === match.logged_by_user_id ? 'You' : 'Co-logger'
        }
      })

      return enhanced
    },
    enabled: !!activeSession && sessionPlayers.length > 0
  })

  async function handleDelete(matchId: string) {
    if (!confirm('Delete this match? This cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)

      if (error) throw error

      toast.success('Match deleted')
      refetch()
    } catch (error: any) {
      console.error('Failed to delete match:', error)
      toast.error(error?.message || 'Failed to delete match')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="font-mono text-gray-400">Loading matches...</p>
        </div>
      </Card>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="font-mono text-gray-400 mb-2">No matches logged yet</p>
          <p className="font-mono text-sm text-gray-500">
            Log your first match above to get started!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl text-gradient-neon">
        MATCH HISTORY ({matches.length})
      </h2>

      {matches.map(match => {
        const teamAWon = match.team_a_goals > match.team_b_goals
        const teamBWon = match.team_b_goals > match.team_a_goals
        const isDraw = match.team_a_goals === match.team_b_goals

        return (
          <Card
            key={match.id}
            variant={teamAWon ? 'neon-green' : teamBWon ? 'neon-pink' : 'default'}
          >
            <div className="p-6">
              {/* Match time and logger */}
              <div className="flex justify-between items-start mb-4 text-sm font-mono text-gray-400">
                <span>
                  {new Date(match.played_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span>Logged by {match.loggedByName}</span>
              </div>

              {/* Teams and score */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                {/* Team A */}
                <div className="text-right">
                  {match.team_a_club && (
                    <div className="font-mono text-xs text-gray-400 mb-1">
                      {match.team_a_club}
                    </div>
                  )}
                  <div className="font-mono text-sm text-neon-green">
                    {match.teamAPlayers?.map(p => p.display_name).join(' & ') || 'Unknown'}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-3 px-4">
                  <span className={`font-display text-3xl ${teamAWon ? 'text-neon-green' : 'text-gray-400'}`}>
                    {match.team_a_goals}
                  </span>
                  <span className="font-mono text-gray-500">-</span>
                  <span className={`font-display text-3xl ${teamBWon ? 'text-neon-pink' : 'text-gray-400'}`}>
                    {match.team_b_goals}
                  </span>
                </div>

                {/* Team B */}
                <div className="text-left">
                  {match.team_b_club && (
                    <div className="font-mono text-xs text-gray-400 mb-1">
                      {match.team_b_club}
                    </div>
                  )}
                  <div className="font-mono text-sm text-neon-pink">
                    {match.teamBPlayers?.map(p => p.display_name).join(' & ') || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* Draw indicator */}
              {isDraw && (
                <div className="text-center mt-2">
                  <span className="font-mono text-xs text-gray-400">DRAW</span>
                </div>
              )}

              {/* Actions */}
              {canEditDelete && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(match.id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
