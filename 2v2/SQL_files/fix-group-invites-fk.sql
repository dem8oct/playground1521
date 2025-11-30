-- Fix: Add foreign key relationships from group_invites to profiles
-- This allows PostgREST to join group_invites with profiles for inviter and invitee

-- ============================================
-- STEP 1: Check current foreign keys on group_invites
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
WHERE tc.table_name = 'group_invites'
AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================
-- STEP 2: Drop existing foreign keys to auth.users (if they exist)
-- ============================================
ALTER TABLE group_invites
  DROP CONSTRAINT IF EXISTS group_invites_inviter_user_id_fkey;

ALTER TABLE group_invites
  DROP CONSTRAINT IF EXISTS group_invites_invitee_user_id_fkey;

-- ============================================
-- STEP 3: Add foreign keys to profiles
-- ============================================

-- Foreign key for inviter_user_id
ALTER TABLE group_invites
  ADD CONSTRAINT group_invites_inviter_user_id_fkey
  FOREIGN KEY (inviter_user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Foreign key for invitee_user_id
ALTER TABLE group_invites
  ADD CONSTRAINT group_invites_invitee_user_id_fkey
  FOREIGN KEY (invitee_user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- ============================================
-- STEP 4: Verify the foreign keys were created
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
WHERE tc.table_name = 'group_invites'
AND tc.constraint_type = 'FOREIGN KEY'
AND (kcu.column_name = 'inviter_user_id' OR kcu.column_name = 'invitee_user_id');

-- ============================================
-- EXPECTED RESULT:
-- ============================================
-- You should see 2 foreign keys (plus any others for group_id):
-- 1. group_invites_inviter_user_id_fkey: inviter_user_id → profiles.id
-- 2. group_invites_invitee_user_id_fkey: invitee_user_id → profiles.id
-- ============================================
