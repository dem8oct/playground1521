-- COMPLETE RLS DEBUGGING SCRIPT
-- Run this to understand why INSERTs are failing

-- ============================================
-- STEP 1: Check what user you're logged in as
-- ============================================
-- Run this in Supabase SQL Editor while logged into your app
SELECT
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- If auth.uid() is NULL, you're not authenticated properly

-- ============================================
-- STEP 2: Check current policies on groups
-- ============================================
SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
ORDER BY cmd, policyname;

-- ============================================
-- STEP 3: Check if your user has a profile
-- ============================================
-- Replace with your actual user ID from STEP 1
-- For now, let's check all recent users
SELECT
  id,
  display_name,
  username,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- STEP 4: Check groups table structure
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'groups'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- STEP 5: Check foreign key constraints
-- ============================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'groups'
AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================
-- STEP 6: Try the simplest possible policy
-- ============================================

-- First, drop ALL policies on groups
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
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- Create the SIMPLEST possible INSERT policy (allows everything)
CREATE POLICY "allow_all_inserts_temp"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verify it was created
SELECT
  policyname,
  roles,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
AND cmd = 'INSERT';

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- 1. auth.uid() should show your user ID (not NULL)
-- 2. auth.role() should be 'authenticated'
-- 3. You should have a profile with the same ID
-- 4. You should see ONE INSERT policy: allow_all_inserts_temp
-- ============================================

-- ============================================
-- NEXT STEPS:
-- ============================================
-- After running this, try to create a group in your app again
-- If it STILL fails with RLS error, there's something else wrong
-- (possibly Supabase client configuration or auth issue)
-- ============================================
