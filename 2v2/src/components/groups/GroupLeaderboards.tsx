import { useEffect, useState } from 'react'
import { getGroupPlayerLeaderboard, getGroupPairLeaderboard } from '../../lib/api/groups'
import { Card } from '../ui'

interface PlayerStats {
  id: string
  session_id: string
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
    profile_id: string | null
  }
}

interface PairStats {
  id: string
  session_id: string
  session_player_id_1: string
  session_player_id_2: string
  label: string
  mp: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  gd: number
  pts: number
}

interface GroupLeaderboardsProps {
  groupId: string
}

export function GroupLeaderboards({ groupId }: GroupLeaderboardsProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [pairStats, setPairStats] = useState<PairStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'players' | 'pairs'>('players')

  async function loadLeaderboards() {
    setLoading(true)
    setError(null)

    try {
      const [players, pairs] = await Promise.all([
        getGroupPlayerLeaderboard(groupId),
        getGroupPairLeaderboard(groupId),
      ])
      setPlayerStats(players)
      setPairStats(pairs)
    } catch (err: any) {
      console.error('Error loading leaderboards:', err)
      setError(err.message || 'Failed to load leaderboards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaderboards()
  }, [groupId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading leaderboards...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('players')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'players'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Player Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('pairs')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pairs'
              ? 'text-pink-400 border-b-2 border-pink-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Pair Leaderboard
        </button>
      </div>

      {/* Player Leaderboard */}
      {activeTab === 'players' && (
        <div>
          {playerStats.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-400">No matches played yet.</p>
              </div>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4 text-center">MP</th>
                    <th className="py-3 px-4 text-center">W</th>
                    <th className="py-3 px-4 text-center">D</th>
                    <th className="py-3 px-4 text-center">L</th>
                    <th className="py-3 px-4 text-center">GF</th>
                    <th className="py-3 px-4 text-center">GA</th>
                    <th className="py-3 px-4 text-center">GD</th>
                    <th className="py-3 px-4 text-center font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.map((stat, index) => (
                    <tr
                      key={stat.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-400">#{index + 1}</td>
                      <td className="py-3 px-4 font-medium text-white">
                        {stat.session_players.display_name}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">{stat.mp}</td>
                      <td className="py-3 px-4 text-center text-green-400">{stat.w}</td>
                      <td className="py-3 px-4 text-center text-yellow-400">{stat.d}</td>
                      <td className="py-3 px-4 text-center text-red-400">{stat.l}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{stat.gf}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{stat.ga}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{stat.gd}</td>
                      <td className="py-3 px-4 text-center font-bold text-green-400">
                        {stat.pts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pair Leaderboard */}
      {activeTab === 'pairs' && (
        <div>
          {pairStats.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-400">No pair matches played yet.</p>
              </div>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Pair</th>
                    <th className="py-3 px-4 text-center">MP</th>
                    <th className="py-3 px-4 text-center">W</th>
                    <th className="py-3 px-4 text-center">D</th>
                    <th className="py-3 px-4 text-center">L</th>
                    <th className="py-3 px-4 text-center">GF</th>
                    <th className="py-3 px-4 text-center">GA</th>
                    <th className="py-3 px-4 text-center">GD</th>
                    <th className="py-3 px-4 text-center font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {pairStats.map((stat, index) => (
                    <tr
                      key={stat.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-400">#{index + 1}</td>
                      <td className="py-3 px-4 font-medium text-white">{stat.label}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{stat.mp}</td>
                      <td className="py-3 px-4 text-center text-green-400">{stat.w}</td>
                      <td className="py-3 px-4 text-center text-yellow-400">{stat.d}</td>
                      <td className="py-3 px-4 text-center text-red-400">{stat.l}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{stat.gf}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{stat.ga}</td>
                      <td className="py-3 px-4 text-center text-gray-300">{stat.gd}</td>
                      <td className="py-3 px-4 text-center font-bold text-pink-400">
                        {stat.pts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
