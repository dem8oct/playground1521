-- ============================================================================
-- COMPREHENSIVE FIX: All Group-Related Foreign Keys
-- ============================================================================
-- This fixes ALL tables related to groups to reference profiles instead of auth.users
-- This allows PostgREST to do proper joins for the Groups & Social features
-- ============================================================================

-- ============================================
-- STEP 1: Check ALL current foreign keys
-- ============================================

-- Check groups table
SELECT 'groups' as table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'groups' AND tc.constraint_type = 'FOREIGN KEY';

-- Check group_members table
SELECT 'group_members' as table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'group_members' AND tc.constraint_type = 'FOREIGN KEY';

-- Check group_invites table
SELECT 'group_invites' as table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'group_invites' AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================
-- STEP 2: Fix GROUPS table
-- ============================================

-- Drop existing foreign key for created_by_user_id
ALTER TABLE groups
  DROP CONSTRAINT IF EXISTS groups_created_by_user_id_fkey;

-- Add foreign key to profiles
ALTER TABLE groups
  ADD CONSTRAINT groups_created_by_user_id_fkey
  FOREIGN KEY (created_by_user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- ============================================
-- STEP 3: Fix GROUP_MEMBERS table
-- ============================================

-- Drop existing foreign key for user_id
ALTER TABLE group_members
  DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- Add foreign key to profiles
ALTER TABLE group_members
  ADD CONSTRAINT group_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- ============================================
-- STEP 4: Fix GROUP_INVITES table
-- ============================================

-- Drop existing foreign keys
ALTER TABLE group_invites
  DROP CONSTRAINT IF EXISTS group_invites_inviter_user_id_fkey;

ALTER TABLE group_invites
  DROP CONSTRAINT IF EXISTS group_invites_invitee_user_id_fkey;

-- Add foreign keys to profiles
ALTER TABLE group_invites
  ADD CONSTRAINT group_invites_inviter_user_id_fkey
  FOREIGN KEY (inviter_user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

ALTER TABLE group_invites
  ADD CONSTRAINT group_invites_invitee_user_id_fkey
  FOREIGN KEY (invitee_user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- ============================================
-- STEP 5: Verify ALL foreign keys
-- ============================================

-- Verify groups table
SELECT 'groups' as table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'groups' AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.column_name;

-- Verify group_members table
SELECT 'group_members' as table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'group_members' AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.column_name;

-- Verify group_invites table
SELECT 'group_invites' as table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'group_invites' AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.column_name;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- GROUPS table should have:
--   - groups_created_by_user_id_fkey: created_by_user_id → profiles.id
--   - (plus group_id references if any)
--
-- GROUP_MEMBERS table should have:
--   - group_members_group_id_fkey: group_id → groups.id
--   - group_members_user_id_fkey: user_id → profiles.id
--
-- GROUP_INVITES table should have:
--   - group_invites_group_id_fkey: group_id → groups.id
--   - group_invites_inviter_user_id_fkey: inviter_user_id → profiles.id
--   - group_invites_invitee_user_id_fkey: invitee_user_id → profiles.id
-- ============================================

-- ============================================
-- BONUS: Check if any data would be orphaned
-- ============================================

-- Check for any group_members that don't have a profile
SELECT 'Orphaned group_members' as issue, gm.*
FROM group_members gm
LEFT JOIN profiles p ON gm.user_id = p.id
WHERE p.id IS NULL
LIMIT 5;

-- Check for any group_invites with missing profiles
SELECT 'Orphaned group_invites (inviter)' as issue, gi.*
FROM group_invites gi
LEFT JOIN profiles p ON gi.inviter_user_id = p.id
WHERE p.id IS NULL
LIMIT 5;

SELECT 'Orphaned group_invites (invitee)' as issue, gi.*
FROM group_invites gi
LEFT JOIN profiles p ON gi.invitee_user_id = p.id
WHERE p.id IS NULL
LIMIT 5;

-- Check for any groups with missing creator profile
SELECT 'Orphaned groups' as issue, g.*
FROM groups g
LEFT JOIN profiles p ON g.created_by_user_id = p.id
WHERE p.id IS NULL
LIMIT 5;

-- If any of the above return rows, you'll need to either:
-- 1. Create profiles for those users, OR
-- 2. Delete those orphaned records
-- ============================================
