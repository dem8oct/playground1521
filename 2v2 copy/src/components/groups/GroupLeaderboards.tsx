import { useEffect, useState } from 'react'
import {
  getGroupAggregatePlayerStats,
  getGroupAggregatePairStats,
  getGroupSessionBreakdown,
} from '../../lib/api/groups'
import { Card, Button } from '../ui'

interface AggregateStats {
  profile_id?: string
  display_name: string
  label?: string
  mp: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  gd: number
  pts: number
}

interface SessionBreakdown {
  session: {
    id: string
    created_at: string
    status: string
    ended_at: string | null
  }
  leaderboard: any[]
  match_count: number
}

interface GroupLeaderboardsProps {
  groupId: string
}

type MainTab = 'aggregate' | 'history'
type StatsTab = 'players' | 'pairs'

export function GroupLeaderboards({ groupId }: GroupLeaderboardsProps) {
  const [mainTab, setMainTab] = useState<MainTab>('aggregate')
  const [statsTab, setStatsTab] = useState<StatsTab>('players')

  const [aggregatePlayerStats, setAggregatePlayerStats] = useState<
    AggregateStats[]
  >([])
  const [aggregatePairStats, setAggregatePairStats] = useState<AggregateStats[]>(
    []
  )
  const [sessionBreakdown, setSessionBreakdown] = useState<SessionBreakdown[]>(
    []
  )
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set()
  )

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadLeaderboards() {
    setLoading(true)
    setError(null)

    try {
      const [players, pairs, breakdown] = await Promise.all([
        getGroupAggregatePlayerStats(groupId),
        getGroupAggregatePairStats(groupId),
        getGroupSessionBreakdown(groupId),
      ])
      setAggregatePlayerStats(players)
      setAggregatePairStats(pairs)
      setSessionBreakdown(breakdown)
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

  function toggleSession(sessionId: string) {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

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

      {/* Main Tabs: All-Time Stats vs Session History */}
      <div className="flex gap-4 border-b border-gray-700">
        <button
          onClick={() => setMainTab('aggregate')}
          className={`px-4 py-2 font-medium transition-colors ${
            mainTab === 'aggregate'
              ? 'text-neon-green border-b-2 border-neon-green'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All-Time Stats
        </button>
        <button
          onClick={() => setMainTab('history')}
          className={`px-4 py-2 font-medium transition-colors ${
            mainTab === 'history'
              ? 'text-neon-blue border-b-2 border-neon-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Session History
        </button>
      </div>

      {/* All-Time Stats Tab */}
      {mainTab === 'aggregate' && (
        <div className="space-y-4">
          {/* Sub-tabs: Players vs Pairs */}
          <div className="flex gap-4 border-b border-gray-800">
            <button
              onClick={() => setStatsTab('players')}
              className={`px-4 py-2 font-medium transition-colors ${
                statsTab === 'players'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Players
            </button>
            <button
              onClick={() => setStatsTab('pairs')}
              className={`px-4 py-2 font-medium transition-colors ${
                statsTab === 'pairs'
                  ? 'text-pink-400 border-b-2 border-pink-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Pairs
            </button>
          </div>

          {/* Player Leaderboard */}
          {statsTab === 'players' && (
            <div>
              {aggregatePlayerStats.length === 0 ? (
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
                      {aggregatePlayerStats.map((stat, index) => (
                        <tr
                          key={stat.profile_id || index}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-gray-400">
                            #{index + 1}
                          </td>
                          <td className="py-3 px-4 font-medium text-white">
                            {stat.display_name}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-300">
                            {stat.mp}
                          </td>
                          <td className="py-3 px-4 text-center text-green-400">
                            {stat.w}
                          </td>
                          <td className="py-3 px-4 text-center text-yellow-400">
                            {stat.d}
                          </td>
                          <td className="py-3 px-4 text-center text-red-400">
                            {stat.l}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-300">
                            {stat.gf}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-300">
                            {stat.ga}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-300">
                            {stat.gd}
                          </td>
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
          {statsTab === 'pairs' && (
            <div>
              {aggregatePairStats.length === 0 ? (
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
                      {aggregatePairStats.map((stat, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-gray-400">
                            #{index + 1}
                          </td>
                          <td className="py-3 px-4 font-medium text-white">
                            {stat.label}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-300">
                            {stat.mp}
                          </td>
                          <td className="py-3 px-4 text-center text-green-400">
                            {stat.w}
                          </td>
                          <td className="py-3 px-4 text-center text-yellow-400">
                            {stat.d}
                          </td>
                          <td className="py-3 px-4 text-center text-red-400">
                            {stat.l}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-300">
                            {stat.gf}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-300">
                            {stat.ga}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-300">
                            {stat.gd}
                          </td>
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
      )}

      {/* Session History Tab */}
      {mainTab === 'history' && (
        <div className="space-y-4">
          {sessionBreakdown.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-400">No sessions yet.</p>
              </div>
            </Card>
          ) : (
            sessionBreakdown.map((item) => {
              const isExpanded = expandedSessions.has(item.session.id)
              return (
                <Card key={item.session.id} variant="neon-blue">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSession(item.session.id)}
                  >
                    <div>
                      <p className="font-mono text-sm text-white">
                        {new Date(item.session.created_at).toLocaleString()}
                      </p>
                      <p className="font-mono text-xs text-gray-400 mt-1">
                        Status: {item.session.status} | {item.leaderboard.length}{' '}
                        players
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border">
                      {item.leaderboard.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">
                          No matches in this session
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-gray-400 border-b border-gray-700">
                                <th className="py-2 px-2">Rank</th>
                                <th className="py-2 px-2">Player</th>
                                <th className="py-2 px-2 text-center">MP</th>
                                <th className="py-2 px-2 text-center">W</th>
                                <th className="py-2 px-2 text-center">D</th>
                                <th className="py-2 px-2 text-center">L</th>
                                <th className="py-2 px-2 text-center">GF</th>
                                <th className="py-2 px-2 text-center">GA</th>
                                <th className="py-2 px-2 text-center">GD</th>
                                <th className="py-2 px-2 text-center">Pts</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.leaderboard.map((stat: any, index: number) => (
                                <tr
                                  key={stat.id}
                                  className="border-b border-gray-800"
                                >
                                  <td className="py-2 px-2 text-gray-400">
                                    #{index + 1}
                                  </td>
                                  <td className="py-2 px-2 text-white">
                                    {stat.display_name}
                                  </td>
                                  <td className="py-2 px-2 text-center text-gray-300">
                                    {stat.mp}
                                  </td>
                                  <td className="py-2 px-2 text-center text-green-400">
                                    {stat.w}
                                  </td>
                                  <td className="py-2 px-2 text-center text-yellow-400">
                                    {stat.d}
                                  </td>
                                  <td className="py-2 px-2 text-center text-red-400">
                                    {stat.l}
                                  </td>
                                  <td className="py-2 px-2 text-center text-gray-300">
                                    {stat.gf}
                                  </td>
                                  <td className="py-2 px-2 text-center text-gray-300">
                                    {stat.ga}
                                  </td>
                                  <td className="py-2 px-2 text-center text-gray-300">
                                    {stat.gd}
                                  </td>
                                  <td className="py-2 px-2 text-center font-bold text-blue-400">
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
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
