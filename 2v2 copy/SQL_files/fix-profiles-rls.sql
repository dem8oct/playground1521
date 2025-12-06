-- Fix profiles table RLS policies
-- The SELECT query is hanging because RLS policies are blocking it

-- ============================================
-- STEP 1: Check current policies on profiles
-- ============================================
SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- STEP 2: Drop all existing policies on profiles
-- ============================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
        RAISE NOTICE 'Dropped profiles policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================
-- STEP 3: Create proper RLS policies for profiles
-- ============================================

-- Everyone can view all profiles (needed for user search, group members, etc.)
CREATE POLICY "anyone_can_view_profiles"
  ON profiles
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Users can insert their own profile (for signup)
CREATE POLICY "users_can_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- STEP 4: Verify the policies
-- ============================================
SELECT
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- You should see 3 policies:
-- 1. anyone_can_view_profiles (SELECT) for authenticated, anon
-- 2. users_can_insert_own_profile (INSERT) for authenticated
-- 3. users_can_update_own_profile (UPDATE) for authenticated
-- ============================================
