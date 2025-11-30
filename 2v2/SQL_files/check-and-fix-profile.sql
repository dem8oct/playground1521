-- Check if your profile exists and fix it if missing

-- ============================================
-- STEP 1: Check if profile exists for your user
-- ============================================

-- Check if profile exists for user 37b8c5a8-299e-4ea5-bc42-08dca7edba11
SELECT
  id,
  display_name,
  username,
  is_admin,
  created_at
FROM profiles
WHERE id = '37b8c5a8-299e-4ea5-bc42-08dca7edba11';

-- If the above returns NO ROWS, your profile is missing!

-- ============================================
-- STEP 2: Check if the user exists in auth.users
-- ============================================

SELECT
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE id = '37b8c5a8-299e-4ea5-bc42-08dca7edba11';

-- ============================================
-- STEP 3: If profile is missing, create it
-- ============================================

-- Run this ONLY if STEP 1 returned no rows
INSERT INTO profiles (id, display_name, username)
VALUES (
  '37b8c5a8-299e-4ea5-bc42-08dca7edba11',
  'Player',  -- Change this to your preferred display name
  'player' || substr(md5(random()::text), 1, 4)  -- Generates unique username like 'player1a2b'
)
ON CONFLICT (id) DO NOTHING;

-- Verify it was created
SELECT
  id,
  display_name,
  username,
  created_at
FROM profiles
WHERE id = '37b8c5a8-299e-4ea5-bc42-08dca7edba11';

-- ============================================
-- ALTERNATIVE: If you want a specific username
-- ============================================

-- If the generated username isn't what you want, update it:
/*
UPDATE profiles
SET
  display_name = 'Your Name',
  username = 'yourname'
WHERE id = '37b8c5a8-299e-4ea5-bc42-08dca7edba11';
*/
