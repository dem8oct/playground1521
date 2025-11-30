-- TEMPORARY FIX: Disable RLS on groups table for testing
-- This will let us verify if RLS is the issue

-- Disable RLS on groups table
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'groups';
-- Should show rowsecurity = false

-- Now try creating a group in your app
-- If it works, we know RLS policies are the problem

-- AFTER TESTING: Re-enable RLS with this command:
-- ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
