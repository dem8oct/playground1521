-- Fix INSERT policy on groups table
-- The issue: policy might be too restrictive or auth.uid() is null

-- First, let's check what the current policy is
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
AND cmd = 'INSERT';

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "insert_groups_authenticated" ON groups;

-- Create a new INSERT policy that's more explicit
CREATE POLICY "authenticated_users_can_create_groups"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by_user_id
  );

-- Verify the new policy
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'groups'
AND cmd = 'INSERT';

-- Also verify that auth.uid() is working
SELECT auth.uid() as current_user_id;
