-- Diagnose why INSERT is failing
-- Check if the user_id exists in auth.users

-- First, let's see what users exist in auth.users
SELECT
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check if YOUR user exists (replace with your user ID from the app)
-- You can find this in browser console or from the 403 error
-- The user_id should be: 37b8c5a8-299e-4ea5-bc42-08dca7edba11 (from earlier error)
SELECT
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE id = '37b8c5a8-299e-4ea5-bc42-08dca7edba11';

-- Check if there's a profile for this user
SELECT
  id,
  display_name,
  username,
  created_at
FROM profiles
WHERE id = '37b8c5a8-299e-4ea5-bc42-08dca7edba11';

-- Now let's test if we can INSERT directly (bypassing RLS)
-- This will tell us if the foreign key constraint is the issue
SET session_replication_role = replica; -- Temporarily disable RLS
INSERT INTO groups (name, description, created_by_user_id)
VALUES ('Test Direct Insert', 'Testing', '37b8c5a8-299e-4ea5-bc42-08dca7edba11')
RETURNING *;
SET session_replication_role = DEFAULT; -- Re-enable RLS

-- If the above works, RLS is the problem
-- If the above fails, the foreign key or user_id is the problem
