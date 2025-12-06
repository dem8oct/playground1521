-- Comprehensive fix for groups INSERT RLS policy issue
-- Error: 42501 - new row violates row-level security policy

-- ============================================
-- STEP 1: Diagnose current state
-- ============================================

-- Check if RLS is enabled on groups table
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'groups';

-- Check ALL current policies on groups table
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
ORDER BY cmd, policyname;

-- ============================================
-- STEP 2: Drop all existing INSERT policies
-- ============================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'groups' AND cmd = 'INSERT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON groups', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================
-- STEP 3: Create proper INSERT policy
-- ============================================

-- Create policy for authenticated users
-- This allows any authenticated user to insert groups
CREATE POLICY "authenticated_users_can_create_groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated (auth.uid() returns their user ID)
    auth.uid() IS NOT NULL
    -- The created_by_user_id must match the authenticated user
    AND created_by_user_id = auth.uid()
  );

-- ============================================
-- STEP 4: Verify the fix
-- ============================================

-- Check that the new policy exists
SELECT
  policyname,
  roles,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
AND cmd = 'INSERT';

-- Check if RLS is enabled (it should be)
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'groups';

-- ============================================
-- Expected Results:
-- ============================================
-- You should see ONE INSERT policy:
--   - authenticated_users_can_create_groups for role 'authenticated'
-- RLS should be enabled (rls_enabled = true)
-- ============================================
