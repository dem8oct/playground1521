-- COMPLETE RLS POLICY RESET FOR GROUPS TABLES
-- Run this entire script in Supabase SQL Editor

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================================================

-- Drop all policies on groups table
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;
DROP POLICY IF EXISTS "Group admins can delete groups" ON groups;

-- Drop all policies on group_members table
DROP POLICY IF EXISTS "Users can view their group members" ON group_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_members;
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "System can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can promote members" ON group_members;

-- Drop all policies on group_invites table
DROP POLICY IF EXISTS "Users can view their invites" ON group_invites;
DROP POLICY IF EXISTS "Group admins can view group invites" ON group_invites;
DROP POLICY IF EXISTS "Group admins can create invites" ON group_invites;
DROP POLICY IF EXISTS "Invitees can respond to invites" ON group_invites;
DROP POLICY IF EXISTS "Group admins can cancel invites" ON group_invites;

-- ============================================================================
-- STEP 2: CREATE CORRECT NON-RECURSIVE POLICIES
-- ============================================================================

-- ============================================================================
-- GROUPS TABLE
-- ============================================================================

-- SELECT: Users can view groups they're members of
CREATE POLICY "select_groups_for_members"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id
      FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can create groups
CREATE POLICY "insert_groups_authenticated"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

-- UPDATE: Group admins can update their groups
CREATE POLICY "update_groups_admins"
  ON groups FOR UPDATE
  USING (
    id IN (
      SELECT group_id
      FROM group_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- DELETE: Group admins can delete their groups
CREATE POLICY "delete_groups_admins"
  ON groups FOR DELETE
  USING (
    id IN (
      SELECT group_id
      FROM group_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- GROUP_MEMBERS TABLE
-- ============================================================================

-- SELECT: Users can view members of groups they belong to
CREATE POLICY "select_members_of_my_groups"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id
      FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: System can add members (via triggers)
CREATE POLICY "insert_members_system"
  ON group_members FOR INSERT
  WITH CHECK (true);

-- DELETE: Group admins can remove members
CREATE POLICY "delete_members_by_admins"
  ON group_members FOR DELETE
  USING (
    group_id IN (
      SELECT gm.group_id
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- DELETE: Users can leave groups (delete their own membership)
CREATE POLICY "delete_own_membership"
  ON group_members FOR DELETE
  USING (user_id = auth.uid());

-- UPDATE: Group admins can promote members
CREATE POLICY "update_members_by_admins"
  ON group_members FOR UPDATE
  USING (
    group_id IN (
      SELECT gm.group_id
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- ============================================================================
-- GROUP_INVITES TABLE
-- ============================================================================

-- SELECT: Users can view invites sent to them
CREATE POLICY "select_invites_for_invitee"
  ON group_invites FOR SELECT
  USING (invitee_user_id = auth.uid());

-- SELECT: Group admins can view invites for their groups
CREATE POLICY "select_invites_for_group_admins"
  ON group_invites FOR SELECT
  USING (
    group_id IN (
      SELECT gm.group_id
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- INSERT: Group admins can create invites
CREATE POLICY "insert_invites_by_admins"
  ON group_invites FOR INSERT
  WITH CHECK (
    group_id IN (
      SELECT gm.group_id
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
    AND inviter_user_id = auth.uid()
  );

-- UPDATE: Invitees can respond to invites
CREATE POLICY "update_invites_by_invitee"
  ON group_invites FOR UPDATE
  USING (invitee_user_id = auth.uid());

-- DELETE: Group admins can cancel invites
CREATE POLICY "delete_invites_by_admins"
  ON group_invites FOR DELETE
  USING (
    group_id IN (
      SELECT gm.group_id
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- ============================================================================
-- STEP 3: VERIFY POLICIES
-- ============================================================================

-- Show all policies for these tables
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('groups', 'group_members', 'group_invites')
ORDER BY tablename, cmd, policyname;

-- Should show exactly:
-- groups: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- group_members: 5 policies (SELECT, INSERT, UPDATE, DELETE x2)
-- group_invites: 5 policies (SELECT x2, INSERT, UPDATE, DELETE)
-- Total: 14 policies
