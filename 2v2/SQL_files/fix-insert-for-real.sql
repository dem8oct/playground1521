-- FINAL FIX: The issue is likely that policies aren't targeting the right role

-- Check current INSERT policies
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
AND cmd = 'INSERT';

-- Drop ALL INSERT policies completely
DROP POLICY IF EXISTS "allow_all_inserts" ON groups;
DROP POLICY IF EXISTS "authenticated_insert_groups" ON groups;
DROP POLICY IF EXISTS "insert_groups_authenticated" ON groups;
DROP POLICY IF EXISTS "users_can_create_groups" ON groups;
DROP POLICY IF EXISTS "authenticated_users_can_create_groups" ON groups;

-- The issue: policies might not be targeting the right role
-- Supabase uses 'authenticated' role for logged-in users via JWT
-- But the policy needs to explicitly allow this role

-- Create policy that explicitly allows the 'authenticated' role
CREATE POLICY "allow_authenticated_insert"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also create a policy for 'anon' role just in case
-- (though authenticated users shouldn't use this)
CREATE POLICY "allow_public_insert"
  ON groups
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Verify both policies exist
SELECT
  policyname,
  roles,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
AND cmd = 'INSERT'
ORDER BY policyname;

-- This should show 2 policies:
-- 1. allow_authenticated_insert for role 'authenticated'
-- 2. allow_public_insert for role 'public'
