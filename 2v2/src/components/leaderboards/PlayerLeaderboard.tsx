import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../contexts/SessionContext'
import { Card } from '../ui'

interface PlayerStatsRow {
  id: string
  session_player_id: string
  mp: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  gd: number
  pts: number
  session_players: {
    display_name: string
  }
}

export default function PlayerLeaderboard() {
  const { activeSession } = useSession()

  const { data: playerStats, isLoading } = useQuery({
    queryKey: ['player-stats', activeSession?.id],
    queryFn: async () => {
      if (!activeSession) return []

      const { data, error } = await supabase
        .from('player_stats')
        .select(`
          *,
          session_players(display_name)
        `)
        .eq('session_id', activeSession.id)
        .order('pts', { ascending: false })
        .order('gd', { ascending: false })
        .order('gf', { ascending: false })

      if (error) throw error
      return data as PlayerStatsRow[]
    },
    enabled: !!activeSession,
  })

  if (isLoading) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="font-mono text-neon-green">Loading leaderboard...</p>
        </div>
      </Card>
    )
  }

  if (!playerStats || playerStats.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="font-mono text-gray-400">
            No stats yet. Log some matches to see the leaderboard!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="font-mono text-xs text-left py-3 px-2 text-neon-green">
                #
              </th>
              <th className="font-mono text-xs text-left py-3 px-2 text-neon-green">
                PLAYER
              </th>
              <th className="font-mono text-xs text-center py-3 px-2 text-neon-green">
                MP
              </th>
              <th className="font-mono text-xs text-center py-3 px-2 text-neon-green">
                W
              </th>
              <th className="font-mono text-xs text-center py-3 px-2 text-neon-green">
                D
              </th>
              <th className="font-mono text-xs text-center py-3 px-2 text-neon-green">
                L
              </th>
              <th className="font-mono text-xs text-center py-3 px-2 text-neon-green">
                GF
              </th>
              <th className="font-mono text-xs text-center py-3 px-2 text-neon-green">
                GA
              </th>
              <th className="font-mono text-xs text-center py-3 px-2 text-neon-green">
                GD
              </th>
              <th className="font-mono text-xs text-center py-3 px-2 text-neon-pink">
                PTS
              </th>
            </tr>
          </thead>
          <tbody>
            {playerStats.map((stat, index) => (
              <tr
                key={stat.id}
                className="border-b border-border hover:bg-bg-secondary transition-colors"
              >
                <td className="font-mono text-sm py-3 px-2 text-gray-400">
                  {index + 1}
                </td>
                <td className="font-mono text-sm py-3 px-2 text-white font-bold">
                  {stat.session_players.display_name}
                </td>
                <td className="font-mono text-sm text-center py-3 px-2 text-gray-300">
                  {stat.mp}
                </td>
                <td className="font-mono text-sm text-center py-3 px-2 text-neon-green">
                  {stat.w}
                </td>
                <td className="font-mono text-sm text-center py-3 px-2 text-neon-yellow">
                  {stat.d}
                </td>
                <td className="font-mono text-sm text-center py-3 px-2 text-neon-pink">
                  {stat.l}
                </td>
                <td className="font-mono text-sm text-center py-3 px-2 text-gray-300">
                  {stat.gf}
                </td>
                <td className="font-mono text-sm text-center py-3 px-2 text-gray-300">
                  {stat.ga}
                </td>
                <td className="font-mono text-sm text-center py-3 px-2 text-white">
                  {stat.gd > 0 ? '+' : ''}
                  {stat.gd}
                </td>
                <td className="font-mono text-sm text-center py-3 px-2 text-neon-pink font-bold">
                  {stat.pts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
