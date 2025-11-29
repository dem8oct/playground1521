-- ============================================================================
-- ULTIMATE FIX: Groups + Group Members RLS
-- ============================================================================
-- This fixes BOTH tables that are involved in group creation:
-- 1. groups table (where the group is inserted)
-- 2. group_members table (where the creator is auto-added by trigger)
-- ============================================================================

-- ============================================
-- STEP 1: Fix GROUPS table policies
-- ============================================

-- Drop ALL existing policies on groups
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'groups'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON groups', r.policyname);
        RAISE NOTICE 'Dropped groups policy: %', r.policyname;
    END LOOP;
END $$;

-- Create simple, working INSERT policy for groups
CREATE POLICY "authenticated_users_can_create_groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by_user_id = auth.uid()
  );

-- Allow users to see all groups (needed for group list)
CREATE POLICY "users_can_view_groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);

-- Group admins can update their groups
CREATE POLICY "group_admins_can_update_groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Group admins can delete their groups
CREATE POLICY "group_admins_can_delete_groups"
  ON groups
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- ============================================
-- STEP 2: Fix GROUP_MEMBERS table policies
-- ============================================

-- Drop ALL existing policies on group_members
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'group_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON group_members', r.policyname);
        RAISE NOTICE 'Dropped group_members policy: %', r.policyname;
    END LOOP;
END $$;

-- Allow users to view group members
CREATE POLICY "users_can_view_group_members"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow INSERT from trigger (this is KEY!)
-- The trigger uses SECURITY DEFINER, so it runs as the function owner
-- But we still need a policy that allows the INSERT
CREATE POLICY "allow_group_member_inserts"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Group admins can update member roles
CREATE POLICY "group_admins_can_update_members"
  ON group_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Group admins can remove members (or members can remove themselves)
CREATE POLICY "group_admins_and_self_can_remove_members"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (
    -- Either you're an admin
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
    -- Or you're removing yourself
    OR user_id = auth.uid()
  );

-- ============================================
-- STEP 3: Recreate the trigger function
-- ============================================

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_group_created ON groups;
DROP FUNCTION IF EXISTS auto_add_group_creator_as_admin();

-- Recreate function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION auto_add_group_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the group creator as admin in group_members
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by_user_id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_group_created
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_group_creator_as_admin();

-- ============================================
-- STEP 4: Verify everything
-- ============================================

-- Check groups policies
SELECT
  'groups' as table_name,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY cmd, policyname;

-- Check group_members policies
SELECT
  'group_members' as table_name,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'group_members'
ORDER BY cmd, policyname;

-- Check trigger exists
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'groups'
AND trigger_name = 'on_group_created';

-- Check function exists with SECURITY DEFINER
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'auto_add_group_creator_as_admin'
AND n.nspname = 'public';

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- groups table: 4 policies (INSERT, SELECT, UPDATE, DELETE)
-- group_members table: 4 policies (INSERT, SELECT, UPDATE, DELETE)
-- Trigger: on_group_created exists
-- Function: auto_add_group_creator_as_admin with SECURITY DEFINER
-- ============================================

-- ============================================
-- NEXT STEPS:
-- ============================================
-- After running this:
-- 1. Go to your app at http://localhost:5173/
-- 2. Try to create a group
-- 3. It should work now!
-- ============================================
