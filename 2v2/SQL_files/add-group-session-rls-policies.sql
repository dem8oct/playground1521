-- RLS Policies for Group Sessions
-- This file adds Row Level Security policies to ensure only group members can access group sessions

-- ============================================================================
-- SESSIONS TABLE POLICIES
-- ============================================================================

-- Policy: Group members can view group sessions
-- Ensures users can only see group sessions if they are members of that group
CREATE POLICY "Group members can view group sessions"
ON sessions
FOR SELECT
USING (
  -- Allow viewing ad-hoc sessions (no group restriction)
  session_type = 'adhoc'
  OR
  -- Allow viewing group sessions only if user is a member
  (
    session_type = 'group'
    AND group_id IN (
      SELECT group_id
      FROM group_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Group members can create group sessions
-- Ensures only group members can create sessions for their group
CREATE POLICY "Group members can create group sessions"
ON sessions
FOR INSERT
WITH CHECK (
  -- Allow creating ad-hoc sessions (no group restriction)
  session_type = 'adhoc'
  OR
  -- Allow creating group sessions only if user is a member
  (
    session_type = 'group'
    AND group_id IN (
      SELECT group_id
      FROM group_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Session initiators can update their sessions
-- This policy allows session creators to update session details (e.g., end session)
CREATE POLICY "Session initiators can update sessions"
ON sessions
FOR UPDATE
USING (initiator_user_id = auth.uid());

-- ============================================================================
-- SESSION_PLAYERS TABLE POLICIES
-- ============================================================================

-- Policy: Group members can join group sessions
-- Ensures only group members can add themselves to group sessions
CREATE POLICY "Group members can join group sessions"
ON session_players
FOR INSERT
WITH CHECK (
  -- Allow joining ad-hoc sessions (no group restriction)
  session_id IN (
    SELECT id FROM sessions WHERE session_type = 'adhoc'
  )
  OR
  -- Allow joining group sessions only if user is a group member
  session_id IN (
    SELECT s.id
    FROM sessions s
    INNER JOIN group_members gm ON s.group_id = gm.group_id
    WHERE s.session_type = 'group'
      AND gm.user_id = auth.uid()
  )
);

-- Policy: Users can view session players
-- Allow viewing all session players (needed for displaying lobbies and leaderboards)
CREATE POLICY "Users can view session players"
ON session_players
FOR SELECT
USING (true);

-- Policy: Session participants can remove players
-- Allow session initiators or the players themselves to remove players from sessions
CREATE POLICY "Session participants can remove players"
ON session_players
FOR DELETE
USING (
  -- User can remove themselves
  profile_id = auth.uid()
  OR
  -- Session initiator can remove any player
  session_id IN (
    SELECT id FROM sessions WHERE initiator_user_id = auth.uid()
  )
);

-- ============================================================================
-- NOTES
-- ============================================================================

-- These policies enforce the following security rules:
-- 1. Only group members can view and create group sessions
-- 2. Only group members can join group sessions
-- 3. Ad-hoc sessions remain publicly accessible (existing behavior)
-- 4. Session initiators can manage their sessions (update, remove players)
-- 5. All users can view session players (for leaderboards and dashboards)

-- To apply these policies:
-- 1. Run this SQL file in your Supabase SQL editor
-- 2. Verify policies are created with: SELECT * FROM pg_policies WHERE tablename IN ('sessions', 'session_players');
-- 3. Test by creating/joining group sessions as different users

-- To rollback (remove these policies):
-- DROP POLICY "Group members can view group sessions" ON sessions;
-- DROP POLICY "Group members can create group sessions" ON sessions;
-- DROP POLICY "Session initiators can update sessions" ON sessions;
-- DROP POLICY "Group members can join group sessions" ON session_players;
-- DROP POLICY "Users can view session players" ON session_players;
-- DROP POLICY "Session participants can remove players" ON session_players;
