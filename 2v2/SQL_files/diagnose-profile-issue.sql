-- Diagnose profile loading issue

-- Check if your profile exists
-- Run this while logged into your app in the browser
SELECT
  auth.uid() as my_user_id,
  auth.role() as my_role;

-- Check if your profile exists in the profiles table
SELECT
  id,
  display_name,
  username,
  created_at
FROM profiles
WHERE id = auth.uid();

-- Check RLS policies on profiles table
SELECT
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- If your profile doesn't exist, create it manually:
-- (Replace YOUR_USER_ID with the ID from the first query)
/*
INSERT INTO profiles (id, display_name, username)
VALUES (
  auth.uid(),
  'Your Display Name',
  'yourusername'
);
*/
