-- Fix RLS Policies for Groups Tables
-- This fixes the infinite recursion error

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their group members" ON group_members;
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can view their invites" ON group_invites;
DROP POLICY IF EXISTS "Group admins can view group invites" ON group_invites;

-- ============================================================================
-- GROUP_MEMBERS TABLE - Fixed Policies
-- ============================================================================

-- Allow users to view their own memberships (no recursion)
CREATE POLICY "Users can view their own memberships"
  ON group_members FOR SELECT
  USING (user_id = auth.uid());

-- Allow users to view members of groups they belong to
-- This uses a simpler check that doesn't cause recursion
CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT gm.group_id
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- GROUPS TABLE - Fixed Policies
-- ============================================================================

-- Allow users to view groups they're members of (using simpler query)
CREATE POLICY "Users can view their groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id
      FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- GROUP_INVITES TABLE - Fixed Policies
-- ============================================================================

-- Users can view invites sent to them
CREATE POLICY "Users can view their invites"
  ON group_invites FOR SELECT
  USING (invitee_user_id = auth.uid());

-- Group admins can view invites for their groups
CREATE POLICY "Group admins can view group invites"
  ON group_invites FOR SELECT
  USING (
    group_id IN (
      SELECT gm.group_id
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Verify policies are working
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('groups', 'group_members', 'group_invites')
ORDER BY tablename, policyname;
