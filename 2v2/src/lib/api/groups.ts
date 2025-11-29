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

export async function getGroupSessions(groupId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================================
// GROUP LEADERBOARDS
// ============================================================================

export async function getGroupPlayerLeaderboard(groupId: string) {
  // Get all session IDs for this group
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id')
    .eq('group_id', groupId)

  if (sessionsError) throw sessionsError

  const sessionIds = sessions.map((s: any) => s.id)

  if (sessionIds.length === 0) return []

  // Get player stats for these sessions
  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      *,
      session_players (
        display_name,
        profile_id
      )
    `)
    .in('session_id', sessionIds)
    .order('pts', { ascending: false })
    .order('gd', { ascending: false })
    .order('gf', { ascending: false })

  if (error) throw error

  // Aggregate stats by player (profile_id)
  // This is a simplified version - you may want to do this aggregation in SQL
  return data
}

export async function getGroupPairLeaderboard(groupId: string) {
  // Similar to player leaderboard but for pairs
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id')
    .eq('group_id', groupId)

  if (sessionsError) throw sessionsError

  const sessionIds = sessions.map((s: any) => s.id)

  if (sessionIds.length === 0) return []

  const { data, error } = await supabase
    .from('pair_stats')
    .select('*')
    .in('session_id', sessionIds)
    .order('pts', { ascending: false })
    .order('gd', { ascending: false })
    .order('gf', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

export async function cleanupExpiredSessions() {
  const { data, error } = await supabase.rpc('cleanup_expired_adhoc_sessions')

  if (error) throw error
  return data
}
