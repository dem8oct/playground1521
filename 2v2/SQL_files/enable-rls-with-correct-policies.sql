-- Re-enable RLS with CORRECT policies that work with app authentication
-- We confirmed app auth works, so policies just need to be permissive enough

-- ============================================================================
-- STEP 1: Re-enable RLS on groups table
-- ============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop all existing policies and create simple, working ones
-- ============================================================================

-- Drop all old policies
DROP POLICY IF EXISTS "select_groups_for_members" ON groups;
DROP POLICY IF EXISTS "insert_groups_authenticated" ON groups;
DROP POLICY IF EXISTS "update_groups_admins" ON groups;
DROP POLICY IF EXISTS "delete_groups_admins" ON groups;
DROP POLICY IF EXISTS "users_can_create_groups" ON groups;
DROP POLICY IF EXISTS "authenticated_users_can_create_groups" ON groups;

-- ============================================================================
-- CREATE SIMPLE, PERMISSIVE POLICIES
-- ============================================================================

-- SELECT: Allow authenticated users to see groups they're members of
CREATE POLICY "authenticated_select_groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id
      FROM group_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Allow any authenticated user to create groups
-- The app will set created_by_user_id correctly
CREATE POLICY "authenticated_insert_groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- App handles setting created_by_user_id

-- UPDATE: Allow group admins to update
CREATE POLICY "authenticated_update_groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT group_id
      FROM group_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- DELETE: Allow group admins to delete
CREATE POLICY "authenticated_delete_groups"
  ON groups FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT group_id
      FROM group_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 3: Verify policies
-- ============================================================================

SELECT
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY cmd, policyname;

-- Should show 4 policies, all with roles = {authenticated}

-- ============================================================================
-- STEP 4: Verify RLS is enabled
-- ============================================================================

SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'groups';

-- Should show rowsecurity = true
