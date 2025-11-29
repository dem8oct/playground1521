-- FINAL RLS FIX - NO SELF-REFERENCE ON group_members
-- The issue: SELECT policy on group_members was querying itself

-- ============================================================================
-- DROP THE PROBLEMATIC SELECT POLICY
-- ============================================================================

DROP POLICY IF EXISTS "select_members_of_my_groups" ON group_members;

-- ============================================================================
-- CREATE SIMPLE SELECT POLICY - NO SUBQUERY TO SAME TABLE
-- ============================================================================

-- Strategy: Allow users to see ALL group_members rows
-- The groups table already restricts which groups they can see
-- So when they query group_members, they'll only get members of groups they can see

CREATE POLICY "select_all_group_members"
  ON group_members FOR SELECT
  USING (true);

-- This is safe because:
-- 1. To see group_members, users must join through groups table
-- 2. The groups table policy already restricts to only groups they're members of
-- 3. So users can only see members of groups they can already see

-- Alternative if the above seems too permissive:
-- We can filter by checking if the user owns this membership OR if they own any membership in this group
-- But we need to avoid the circular reference

-- Let's try a different approach: check if user_id matches OR check via a lateral join
DROP POLICY IF EXISTS "select_all_group_members" ON group_members;

CREATE POLICY "select_group_members_simple"
  ON group_members FOR SELECT
  USING (
    -- User can see their own memberships
    user_id = auth.uid()
    OR
    -- User can see memberships in groups they belong to
    EXISTS (
      SELECT 1
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.group_id = group_members.group_id
      LIMIT 1  -- Add LIMIT to potentially help optimizer
    )
  );

-- If that still causes recursion, we need a completely different approach:
-- Use a security definer function

-- Drop the problematic policy again
DROP POLICY IF EXISTS "select_group_members_simple" ON group_members;

-- Create a security definer function to check membership
CREATE OR REPLACE FUNCTION is_group_member(check_group_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM group_members
    WHERE group_id = check_group_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create policy using the function
CREATE POLICY "select_group_members_via_function"
  ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    is_group_member(group_id, auth.uid())
  );

-- Verify
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'group_members'
ORDER BY cmd, policyname;
