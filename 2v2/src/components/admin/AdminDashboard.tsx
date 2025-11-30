import { useEffect, useState } from 'react'
import { getDashboardMetrics, getRecentActivity } from '../../lib/api/admin'
import type { DashboardMetrics, ActivityItem } from '../../lib/api/admin'
import { Card, Button } from '../ui'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadDashboard() {
    try {
      const [metricsData, activityData] = await Promise.all([
        getDashboardMetrics(),
        getRecentActivity(),
      ])
      setMetrics(metricsData)
      setActivity(activityData)
    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      toast.error(error.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    await loadDashboard()
    toast.success('Dashboard refreshed')
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="font-mono text-neon-green">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl text-white">Dashboard Overview</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="neon-green">
          <div className="text-center">
            <div className="font-mono text-4xl text-neon-green mb-2">
              {metrics?.totalUsers || 0}
            </div>
            <div className="font-sans text-sm text-gray-400 uppercase tracking-wide">
              Total Users
            </div>
          </div>
        </Card>

        <Card variant="neon-pink">
          <div className="text-center">
            <div className="font-mono text-4xl text-neon-pink mb-2">
              {metrics?.totalGroups || 0}
            </div>
            <div className="font-sans text-sm text-gray-400 uppercase tracking-wide">
              Total Groups
            </div>
          </div>
        </Card>

        <Card variant="neon-yellow">
          <div className="text-center">
            <div className="font-mono text-4xl text-neon-yellow mb-2">
              {metrics?.activeSessions || 0}
            </div>
            <div className="font-sans text-sm text-gray-400 uppercase tracking-wide">
              Active Sessions
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div className="text-center">
            <div className="font-mono text-4xl text-white mb-2">
              {metrics?.totalMatches || 0}
            </div>
            <div className="font-sans text-sm text-gray-400 uppercase tracking-wide">
              Total Matches
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="font-display text-xl text-white mb-4">Recent Activity</h3>

        {activity.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No recent activity
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 bg-gray-800/50 rounded border border-gray-700 hover:border-neon-green/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-mono uppercase ${
                        item.type === 'session_created'
                          ? 'bg-neon-green/20 text-neon-green'
                          : item.type === 'group_created'
                          ? 'bg-neon-pink/20 text-neon-pink'
                          : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{item.description}</p>
                </div>
                <div className="text-xs text-gray-500 font-mono whitespace-nowrap ml-4">
                  {formatTimestamp(item.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
