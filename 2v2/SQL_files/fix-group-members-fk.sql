-- Fix: Add foreign key relationship from group_members to profiles
-- This allows PostgREST to join group_members with profiles

-- ============================================
-- STEP 1: Check current foreign keys on group_members
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
WHERE tc.table_name = 'group_members'
AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================
-- STEP 2: Add foreign key to profiles
-- ============================================

-- Drop existing foreign key to auth.users if it exists
-- (group_members.user_id might reference auth.users instead of profiles)
ALTER TABLE group_members
  DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- Add foreign key to profiles instead
-- This allows PostgREST to do the join: group_members -> profiles
ALTER TABLE group_members
  ADD CONSTRAINT group_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- ============================================
-- STEP 3: Verify the foreign key was created
-- ============================================
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'group_members'
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'user_id';

-- ============================================
-- EXPECTED RESULT:
-- ============================================
-- You should see:
-- constraint_name: group_members_user_id_fkey
-- column_name: user_id
-- foreign_table_name: profiles
-- foreign_column_name: id
-- ============================================
