-- Debug and fix groups INSERT policy

-- Step 1: Check current auth context
SELECT
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- Step 2: Check all policies on groups table
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY cmd;

-- Step 3: Try to see if RLS is even enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'groups';

-- Step 4: Drop and recreate INSERT policy with correct syntax
DROP POLICY IF EXISTS "insert_groups_authenticated" ON groups;
DROP POLICY IF EXISTS "authenticated_users_can_create_groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

-- Create simple INSERT policy
CREATE POLICY "users_can_create_groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by_user_id = auth.uid());

-- Step 5: Verify it was created
SELECT
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
AND cmd = 'INSERT';

-- Step 6: Test if auth.uid() returns a value
-- This should return your user ID when you run it
SELECT auth.uid();
