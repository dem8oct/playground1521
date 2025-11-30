-- Ultra-permissive INSERT policy for debugging
-- This will help us understand what's blocking the insert

-- First, check what policies currently exist
SELECT
  policyname,
  cmd,
  roles,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
AND cmd = 'INSERT';

-- Drop ALL INSERT policies
DROP POLICY IF EXISTS "authenticated_insert_groups" ON groups;
DROP POLICY IF EXISTS "insert_groups_authenticated" ON groups;
DROP POLICY IF EXISTS "users_can_create_groups" ON groups;
DROP POLICY IF EXISTS "authenticated_users_can_create_groups" ON groups;

-- Create the most permissive INSERT policy possible
-- This allows ANY authenticated user to insert ANY data
CREATE POLICY "allow_all_inserts"
  ON groups FOR INSERT
  WITH CHECK (true);

-- Verify it was created
SELECT
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
AND cmd = 'INSERT';

-- Also check if there are any RESTRICTIVE policies (not PERMISSIVE)
-- Restrictive policies use AND logic, which could be blocking
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'groups';

-- Check table constraints that might be interfering
SELECT
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'groups'::regclass;
