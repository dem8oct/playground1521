import { supabase } from '../supabase'

// ============================================================================
// ADMIN AUTHENTICATION CHECK
// ============================================================================

async function checkAdminAccess() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!(profile as any)?.is_admin) throw new Error('Unauthorized: Admin access required')

  return user
}

// ============================================================================
// DASHBOARD METRICS
// ============================================================================

export interface DashboardMetrics {
  totalUsers: number
  totalGroups: number
  activeSessions: number
  totalMatches: number
}

export interface ActivityItem {
  id: string
  type: 'session_created' | 'group_created' | 'match_logged'
  description: string
  timestamp: string
  userId?: string
  userName?: string
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await checkAdminAccess()

  // Get total users count
  const { count: totalUsers, error: usersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  if (usersError) throw usersError

  // Get total groups count
  const { count: totalGroups, error: groupsError } = await supabase
    .from('groups')
    .select('*', { count: 'exact', head: true })

  if (groupsError) throw groupsError

  // Get active sessions count
  const { count: activeSessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if (sessionsError) throw sessionsError

  // Get total matches count
  const { count: totalMatches, error: matchesError } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })

  if (matchesError) throw matchesError

  return {
    totalUsers: totalUsers || 0,
    totalGroups: totalGroups || 0,
    activeSessions: activeSessions || 0,
    totalMatches: totalMatches || 0,
  }
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  await checkAdminAccess()

  const activities: ActivityItem[] = []

  // Get recent sessions (without join - simpler query)
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, created_at, session_type, initiator_user_id')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!sessionsError && sessions) {
    // Get user profiles for sessions
    const userIds = sessions.map((s: any) => s.initiator_user_id).filter(Boolean)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds)

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    sessions.forEach((session: any) => {
      const profile = profileMap.get(session.initiator_user_id)
      activities.push({
        id: session.id,
        type: 'session_created',
        description: `${profile?.display_name || 'User'} created a ${session.session_type} session`,
        timestamp: session.created_at,
        userId: session.initiator_user_id,
        userName: profile?.display_name,
      })
    })
  }

  // Get recent groups (without join)
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id, name, created_at, created_by_user_id')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!groupsError && groups) {
    // Get creator profiles for groups
    const creatorIds = groups.map((g: any) => g.created_by_user_id).filter(Boolean)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', creatorIds)

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    groups.forEach((group: any) => {
      const profile = profileMap.get(group.created_by_user_id)
      activities.push({
        id: group.id,
        type: 'group_created',
        description: `${profile?.display_name || 'User'} created group "${group.name}"`,
        timestamp: group.created_at,
        userId: group.created_by_user_id,
        userName: profile?.display_name,
      })
    })
  }

  // Sort all activities by timestamp and take top 10
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return activities.slice(0, 10)
}
