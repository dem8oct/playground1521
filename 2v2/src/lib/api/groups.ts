import { supabase } from '../supabase'
import type { Database } from '../database.types'

type GroupInsert = Database['public']['Tables']['groups']['Insert']
type GroupUpdate = Database['public']['Tables']['groups']['Update']
type GroupMemberUpdate = Database['public']['Tables']['group_members']['Update']
type GroupInviteInsert = Database['public']['Tables']['group_invites']['Insert']
type GroupInviteUpdate = Database['public']['Tables']['group_invites']['Update']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']

// ============================================================================
// GROUPS CRUD
// ============================================================================

export async function createGroup(data: {
  name: string
  description?: string
}) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const insertData: GroupInsert = {
    name: data.name,
    description: data.description,
    created_by_user_id: user.id,
  }

  const { data: group, error } = await supabase
    .from('groups')
    .insert(insertData as any)
    .select()
    .single()

  if (error) throw error
  return group
}

export async function getUserGroups(userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      role,
      joined_at,
      groups (
        id,
        name,
        description,
        avatar_url,
        created_at,
        created_by_user_id
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  if (error) throw error
  return data.map((item: any) => ({
    ...item.groups,
    userRole: item.role,
    joinedAt: item.joined_at,
  }))
}

export async function getGroupDetails(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        id,
        user_id,
        role,
        joined_at,
        profiles (
          id,
          display_name,
          username,
          avatar_url
        )
      )
    `)
    .eq('id', groupId)
    .single()

  if (error) throw error
  return data
}

export async function updateGroup(
  groupId: string,
  data: {
    name?: string
    description?: string
  }
) {
  const updateData: GroupUpdate = data

  const { data: group, error } = await supabase
    .from('groups')
    .update(updateData as any)
    .eq('id', groupId)
    .select()
    .single()

  if (error) throw error
  return group
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)

  if (error) throw error
}

// ============================================================================
// GROUP MEMBERS
// ============================================================================

export async function getGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      id,
      user_id,
      role,
      joined_at,
      profiles (
        id,
        display_name,
        username,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data
}

export async function removeMemberFromGroup(groupId: string, userId: string) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function promoteMemberToAdmin(groupId: string, userId: string) {
  const updateData: GroupMemberUpdate = { role: 'admin' }

  const { error } = await supabase
    .from('group_members')
    .update(updateData as any)
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function leaveGroup(groupId: string) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  await removeMemberFromGroup(groupId, user.id)
}

// ============================================================================
// GROUP INVITES
// ============================================================================

export async function searchUsersByUsername(query: string) {
  if (query.length < 2) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data
}

export async function inviteUserToGroup(data: {
  groupId: string
  inviteeUserId: string
}) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const insertData: GroupInviteInsert = {
    group_id: data.groupId,
    inviter_user_id: user.id,
    invitee_user_id: data.inviteeUserId,
  }

  const { data: invite, error } = await supabase
    .from('group_invites')
    .insert(insertData as any)
    .select()
    .single()

  if (error) throw error
  return invite
}

export async function getUserInvites(userId: string) {
  const { data, error } = await supabase
    .from('group_invites')
    .select(`
      *,
      groups (
        id,
        name,
        avatar_url,
        description
      ),
      inviter:profiles!inviter_user_id (
        display_name,
        username,
        avatar_url
      )
    `)
    .eq('invitee_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getPendingInvitesForGroup(groupId: string) {
  const { data, error } = await supabase
    .from('group_invites')
    .select(`
      *,
      invitee:profiles!invitee_user_id (
        display_name,
        username,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  const updateData: GroupInviteUpdate = {
    status: accept ? 'accepted' : 'declined',
  }

  const { data, error } = await supabase
    .from('group_invites')
    .update(updateData as any)
    .eq('id', inviteId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cancelInvite(inviteId: string) {
  const { error } = await supabase
    .from('group_invites')
    .delete()
    .eq('id', inviteId)

  if (error) throw error
}

// ============================================================================
// GROUP SESSIONS
// ============================================================================

export async function createGroupSession(data: {
  groupId: string
  joinCode: string
  expiresAt: string
}) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  // Validate user is group member
  const { data: membership, error: memberError } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', data.groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberError) throw memberError
  if (!membership) {
    throw new Error('You must be a group member to create a group session')
  }

  const insertData: SessionInsert = {
    initiator_user_id: user.id,
    join_code: data.joinCode,
    expires_at: data.expiresAt,
    group_id: data.groupId,
    session_type: 'group',
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .insert(insertData as any)
    .select()
    .single()

  if (error) throw error
  return session
}

export async function getGroupSessions(groupId: string, status?: string) {
  let query = supabase
    .from('sessions')
    .select('*')
    .eq('group_id', groupId)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getActiveGroupSessions(groupId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      session_players!session_id (
        id
      )
    `)
    .eq('group_id', groupId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Add player count to each session
  return (data || []).map((session: any) => ({
    ...session,
    player_count: session.session_players?.length || 0,
  }))
}

export async function joinGroupSession(sessionId: string, groupId: string) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  // Validate user is group member
  const { data: membership, error: memberError } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (memberError) throw memberError
  if (!membership) {
    throw new Error('You must be a group member to join this session')
  }

  // Just validate membership - don't auto-add as player
  // Only initiator/co-logger can add players via the lobby
  console.log('User validated as group member, navigating to lobby')
}

// ============================================================================
// GROUP LEADERBOARDS
// ============================================================================

export async function getGroupAggregatePlayerStats(groupId: string) {
  // Get all sessions for this group
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id')
    .eq('group_id', groupId)

  if (sessionsError) throw sessionsError

  const sessionIds = sessions.map((s: any) => s.id)

  if (sessionIds.length === 0) return []

  // Get all player stats for these sessions
  const { data: allStats, error: statsError } = await supabase
    .from('player_stats')
    .select(`
      *,
      session_players!inner (
        profile_id,
        display_name
      )
    `)
    .in('session_id', sessionIds)

  if (statsError) throw statsError

  // Group by profile_id and aggregate (only registered users)
  const aggregateMap = new Map<string, any>()

  for (const stat of allStats || []) {
    const profileId = stat.session_players.profile_id

    // Skip guest users (null profile_id)
    if (!profileId) continue

    if (!aggregateMap.has(profileId)) {
      aggregateMap.set(profileId, {
        profile_id: profileId,
        display_name: stat.session_players.display_name,
        mp: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      })
    }

    const agg = aggregateMap.get(profileId)
    agg.mp += stat.mp
    agg.w += stat.w
    agg.d += stat.d
    agg.l += stat.l
    agg.gf += stat.gf
    agg.ga += stat.ga
    agg.gd += stat.gd
    agg.pts += stat.pts
  }

  // Convert to array and sort by leaderboard rules
  const leaderboard = Array.from(aggregateMap.values()).sort((a, b) => {
    // 1. Points (descending)
    if (a.pts !== b.pts) return b.pts - a.pts
    // 2. Goal Difference (descending)
    if (a.gd !== b.gd) return b.gd - a.gd
    // 3. Goals For (descending)
    if (a.gf !== b.gf) return b.gf - a.gf
    // 4. Alphabetical by name
    return a.display_name.localeCompare(b.display_name)
  })

  return leaderboard
}

export async function getGroupAggregatePairStats(groupId: string) {
  // Get all sessions for this group
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id')
    .eq('group_id', groupId)

  if (sessionsError) throw sessionsError

  const sessionIds = sessions.map((s: any) => s.id)

  if (sessionIds.length === 0) return []

  // Get all pair stats for these sessions
  const { data: allPairStats, error: statsError } = await supabase
    .from('pair_stats')
    .select('*')
    .in('session_id', sessionIds)

  if (statsError) throw statsError

  // Group by normalized pair (sorted player IDs)
  const aggregateMap = new Map<string, any>()

  for (const stat of allPairStats || []) {
    // Create normalized pair key
    const pairKey = [stat.session_player_id_1, stat.session_player_id_2]
      .sort()
      .join('_')

    if (!aggregateMap.has(pairKey)) {
      aggregateMap.set(pairKey, {
        session_player_id_1: stat.session_player_id_1,
        session_player_id_2: stat.session_player_id_2,
        label: stat.label,
        mp: 0,
        w: 0,
        d: 0,
        l: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0,
      })
    }

    const agg = aggregateMap.get(pairKey)
    agg.mp += stat.mp
    agg.w += stat.w
    agg.d += stat.d
    agg.l += stat.l
    agg.gf += stat.gf
    agg.ga += stat.ga
    agg.gd += stat.gd
    agg.pts += stat.pts
  }

  // Convert to array and sort
  const leaderboard = Array.from(aggregateMap.values()).sort((a, b) => {
    // 1. Points (descending)
    if (a.pts !== b.pts) return b.pts - a.pts
    // 2. Goal Difference (descending)
    if (a.gd !== b.gd) return b.gd - a.gd
    // 3. Goals For (descending)
    if (a.gf !== b.gf) return b.gf - a.gf
    // 4. Alphabetical by label
    return a.label.localeCompare(b.label)
  })

  return leaderboard
}

export async function getGroupSessionBreakdown(groupId: string) {
  // Get all sessions with their stats
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select(`
      *,
      player_stats (
        *,
        session_players!inner (
          display_name,
          profile_id
        )
      )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (sessionsError) throw sessionsError

  // Format each session with its leaderboard
  return (sessions || []).map((session: any) => {
    // Sort player stats for this session
    const leaderboard = (session.player_stats || [])
      .map((stat: any) => ({
        ...stat,
        display_name: stat.session_players.display_name,
        profile_id: stat.session_players.profile_id,
      }))
      .sort((a: any, b: any) => {
        if (a.pts !== b.pts) return b.pts - a.pts
        if (a.gd !== b.gd) return b.gd - a.gd
        if (a.gf !== b.gf) return b.gf - a.gf
        return a.display_name.localeCompare(b.display_name)
      })

    return {
      session: {
        id: session.id,
        created_at: session.created_at,
        status: session.status,
        ended_at: session.ended_at,
      },
      leaderboard,
      match_count: 0, // Will need to fetch separately if needed
    }
  })
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export async function validateGroupMembership(
  userId: string,
  groupId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return !!data
}

export async function getUserGroupRole(
  userId: string,
  groupId: string
): Promise<'admin' | 'member' | null> {
  const { data, error } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data?.role || null
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

export async function cleanupExpiredSessions() {
  const { data, error } = await supabase.rpc('cleanup_expired_adhoc_sessions')

  if (error) throw error
  return data
}
