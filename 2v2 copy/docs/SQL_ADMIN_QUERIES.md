# SQL Admin & Debug Queries - Quick Reference

**2v2 Kick Off Night Tracker**
**For a friend who needs to quickly manage and debug the app** 😉

---

## Table of Contents
1. [User Management](#user-management)
2. [Password Management](#password-management)
3. [Session Management](#session-management)
4. [Group Management](#group-management)
5. [Match & Stats Queries](#match--stats-queries)
6. [Debugging Queries](#debugging-queries)
7. [Cleanup & Maintenance](#cleanup--maintenance)
8. [Analytics & Reports](#analytics--reports)

---

## User Management

### View All Users
```sql
-- Simple user list
SELECT
  id,
  username,
  display_name,
  is_admin,
  created_at
FROM profiles
ORDER BY created_at DESC;
```

### View Users with Email
```sql
-- Users with email from auth.users
SELECT
  p.id,
  p.username,
  p.display_name,
  p.is_admin,
  p.created_at,
  au.email,
  au.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;
```

### Make User Admin
```sql
-- By username
UPDATE profiles
SET is_admin = true
WHERE username = 'your_username';

-- By ID
UPDATE profiles
SET is_admin = true
WHERE id = 'user-uuid-here';

-- Make first user admin
UPDATE profiles
SET is_admin = true
WHERE id = (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1);
```

### Remove Admin Access
```sql
-- Revoke admin by username
UPDATE profiles
SET is_admin = false
WHERE username = 'their_username';
```

### View All Admins
```sql
-- List all admin users
SELECT
  username,
  display_name,
  is_admin,
  created_at
FROM profiles
WHERE is_admin = true
ORDER BY created_at DESC;
```

### Count Users
```sql
-- Total users and admin breakdown
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_admin = true) as admin_users,
  COUNT(*) FILTER (WHERE is_admin = false OR is_admin IS NULL) as regular_users
FROM profiles;
```

### Delete User (Careful!)
```sql
-- Delete user and all related data (CASCADE)
-- WARNING: This is permanent!
DELETE FROM auth.users
WHERE email = 'user@example.com';
-- This will cascade to profiles, group_members, etc.
```

---

## Password Management

### Reset User Password
```sql
-- Set password to 'password123'
UPDATE auth.users
SET
  encrypted_password = crypt('password123', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'user@example.com';

-- By username (via profiles join)
UPDATE auth.users
SET
  encrypted_password = crypt('newpassword', gen_salt('bf')),
  updated_at = NOW()
WHERE id = (SELECT id FROM profiles WHERE username = 'their_username');
```

### Generate Random Password
```sql
-- Generate and display random password
DO $$
DECLARE
  random_pwd TEXT;
  user_email TEXT := 'user@example.com';
BEGIN
  random_pwd := encode(gen_random_bytes(8), 'hex');

  UPDATE auth.users
  SET encrypted_password = crypt(random_pwd, gen_salt('bf'))
  WHERE email = user_email;

  RAISE NOTICE 'New password for %: %', user_email, random_pwd;
END $$;
```

### Make Admin + Reset Password (Combo)
```sql
-- Set admin AND password in one go
WITH user_update AS (
  UPDATE auth.users
  SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
  WHERE id = (SELECT id FROM profiles WHERE username = 'their_username')
  RETURNING id
)
UPDATE profiles
SET is_admin = true
WHERE id IN (SELECT id FROM user_update);
```

---

## Session Management

### View All Sessions
```sql
-- All sessions with details
SELECT
  s.id,
  s.join_code,
  s.status,
  s.session_type,
  s.created_at,
  s.expires_at,
  p.username as initiator,
  COUNT(sp.id) as player_count
FROM sessions s
LEFT JOIN profiles p ON s.initiator_user_id = p.id
LEFT JOIN session_players sp ON s.id = sp.session_id
GROUP BY s.id, p.username
ORDER BY s.created_at DESC;
```

### View Active Sessions Only
```sql
-- Currently active sessions
SELECT
  s.id,
  s.join_code,
  s.session_type,
  s.created_at,
  s.expires_at,
  p.username as initiator,
  COUNT(sp.id) as players
FROM sessions s
LEFT JOIN profiles p ON s.initiator_user_id = p.id
LEFT JOIN session_players sp ON s.id = sp.session_id
WHERE s.status = 'active'
GROUP BY s.id, p.username
ORDER BY s.created_at DESC;
```

### Find Session by Join Code
```sql
-- Search by join code
SELECT
  s.*,
  p.username as initiator
FROM sessions s
LEFT JOIN profiles p ON s.initiator_user_id = p.id
WHERE s.join_code = 'ABC123';
```

### End a Session Manually
```sql
-- Force end a session
UPDATE sessions
SET status = 'ended'
WHERE id = 'session-uuid-here';

-- End by join code
UPDATE sessions
SET status = 'ended'
WHERE join_code = 'ABC123';
```

### Delete a Session (and all data)
```sql
-- Delete session and cascade to matches, players, stats
DELETE FROM sessions
WHERE id = 'session-uuid-here';
```

### View Session with Players
```sql
-- Session details with all players
SELECT
  s.join_code,
  s.status,
  s.session_type,
  sp.display_name as player_name,
  sp.created_at as joined_at
FROM sessions s
JOIN session_players sp ON s.id = sp.session_id
WHERE s.join_code = 'ABC123'
ORDER BY sp.created_at;
```

---

## Group Management

### View All Groups
```sql
-- All groups with member count
SELECT
  g.id,
  g.name,
  g.description,
  g.created_at,
  p.username as creator,
  COUNT(gm.id) as member_count
FROM groups g
LEFT JOIN profiles p ON g.created_by_user_id = p.id
LEFT JOIN group_members gm ON g.id = gm.group_id
GROUP BY g.id, p.username
ORDER BY member_count DESC;
```

### View Group Members
```sql
-- Members of a specific group
SELECT
  g.name as group_name,
  p.username,
  p.display_name,
  gm.role,
  gm.joined_at
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN profiles p ON gm.user_id = p.id
WHERE g.name = 'Group Name Here'
ORDER BY gm.role, gm.joined_at;
```

### Add User to Group (as Admin)
```sql
-- Add user to group as admin
INSERT INTO group_members (group_id, user_id, role)
VALUES (
  (SELECT id FROM groups WHERE name = 'Group Name'),
  (SELECT id FROM profiles WHERE username = 'their_username'),
  'admin'
);

-- Add as regular member
INSERT INTO group_members (group_id, user_id, role)
VALUES (
  (SELECT id FROM groups WHERE name = 'Group Name'),
  (SELECT id FROM profiles WHERE username = 'their_username'),
  'member'
);
```

### Promote Member to Admin
```sql
-- Make group member an admin
UPDATE group_members
SET role = 'admin'
WHERE group_id = (SELECT id FROM groups WHERE name = 'Group Name')
  AND user_id = (SELECT id FROM profiles WHERE username = 'their_username');
```

### Delete Group (and all data)
```sql
-- Delete group and cascade to members, sessions, matches
DELETE FROM groups
WHERE name = 'Group Name Here';
```

---

## Match & Stats Queries

### View Recent Matches
```sql
-- Last 20 matches across all sessions
SELECT
  m.id,
  s.join_code,
  m.team_a_club,
  m.team_b_club,
  m.team_a_goals,
  m.team_b_goals,
  m.played_at,
  p.username as logged_by
FROM matches m
JOIN sessions s ON m.session_id = s.id
LEFT JOIN profiles p ON m.logged_by_user_id = p.id
ORDER BY m.played_at DESC
LIMIT 20;
```

### View Matches in a Session
```sql
-- All matches in a specific session
SELECT
  m.team_a_club,
  m.team_b_club,
  m.team_a_goals,
  m.team_b_goals,
  m.played_at
FROM matches m
JOIN sessions s ON m.session_id = s.id
WHERE s.join_code = 'ABC123'
ORDER BY m.played_at;
```

### Player Leaderboard (All Sessions)
```sql
-- Global player stats
SELECT
  sp.display_name,
  SUM(ps.mp) as matches_played,
  SUM(ps.w) as wins,
  SUM(ps.d) as draws,
  SUM(ps.l) as losses,
  SUM(ps.gf) as goals_for,
  SUM(ps.ga) as goals_against,
  SUM(ps.gd) as goal_diff,
  SUM(ps.pts) as points
FROM player_stats ps
JOIN session_players sp ON ps.session_player_id = sp.id
GROUP BY sp.display_name
ORDER BY points DESC, goal_diff DESC, goals_for DESC
LIMIT 20;
```

### Delete a Match
```sql
-- Delete specific match
DELETE FROM matches
WHERE id = 'match-uuid-here';

-- Note: You'll need to recalculate stats after this!
```

### Recalculate Stats for Session
```sql
-- Delete all stats for a session (they'll be recalculated)
DELETE FROM player_stats WHERE session_id = 'session-uuid';
DELETE FROM pair_stats WHERE session_id = 'session-uuid';

-- Then trigger recalculation from the app
```

---

## Debugging Queries

### Find User by Partial Name
```sql
-- Search users by username or display name
SELECT
  username,
  display_name,
  is_admin,
  created_at
FROM profiles
WHERE username ILIKE '%search%'
   OR display_name ILIKE '%search%'
ORDER BY created_at DESC;
```

### Check User's Groups
```sql
-- What groups is this user in?
SELECT
  g.name,
  gm.role,
  gm.joined_at
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
WHERE gm.user_id = (SELECT id FROM profiles WHERE username = 'their_username')
ORDER BY gm.joined_at DESC;
```

### Check User's Sessions
```sql
-- Sessions created by user
SELECT
  s.join_code,
  s.status,
  s.session_type,
  s.created_at,
  COUNT(m.id) as match_count
FROM sessions s
LEFT JOIN matches m ON s.id = m.session_id
WHERE s.initiator_user_id = (SELECT id FROM profiles WHERE username = 'their_username')
GROUP BY s.id
ORDER BY s.created_at DESC;
```

### Check Group Invites
```sql
-- Pending invites for a user
SELECT
  g.name as group_name,
  p_inviter.username as invited_by,
  gi.status,
  gi.created_at
FROM group_invites gi
JOIN groups g ON gi.group_id = g.id
JOIN profiles p_inviter ON gi.inviter_user_id = p_inviter.id
WHERE gi.invitee_user_id = (SELECT id FROM profiles WHERE username = 'their_username')
  AND gi.status = 'pending'
ORDER BY gi.created_at DESC;
```

### Find Orphaned Data
```sql
-- Session players without a profile (guests)
SELECT
  sp.display_name,
  s.join_code,
  sp.created_at
FROM session_players sp
JOIN sessions s ON sp.session_id = s.id
WHERE sp.profile_id IS NULL
ORDER BY sp.created_at DESC
LIMIT 50;
```

### Check Database Sizes
```sql
-- Count records in each table
SELECT
  'profiles' as table_name, COUNT(*) as record_count FROM profiles
UNION ALL
SELECT 'groups', COUNT(*) FROM groups
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'session_players', COUNT(*) FROM session_players
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
UNION ALL
SELECT 'player_stats', COUNT(*) FROM player_stats
UNION ALL
SELECT 'pair_stats', COUNT(*) FROM pair_stats
UNION ALL
SELECT 'group_members', COUNT(*) FROM group_members
UNION ALL
SELECT 'group_invites', COUNT(*) FROM group_invites;
```

---

## Cleanup & Maintenance

### Delete Expired Ad-hoc Sessions
```sql
-- Manual cleanup (safe - only deletes expired ad-hoc sessions)
DELETE FROM sessions
WHERE session_type = 'adhoc'
  AND status = 'expired'
  AND expires_at < NOW() - INTERVAL '10 hours';
```

### Delete All Test Data
```sql
-- WARNING: Nuclear option - deletes ALL sessions and matches!
-- Use only in development/testing
DELETE FROM sessions WHERE session_type = 'adhoc';
DELETE FROM groups WHERE name ILIKE '%test%';
```

### Reset a User's Data
```sql
-- Remove user from all groups
DELETE FROM group_members
WHERE user_id = (SELECT id FROM profiles WHERE username = 'their_username');

-- Delete all their sessions
DELETE FROM sessions
WHERE initiator_user_id = (SELECT id FROM profiles WHERE username = 'their_username');
```

### Find and Delete Old Sessions
```sql
-- Sessions older than 7 days
SELECT
  join_code,
  status,
  session_type,
  created_at,
  expires_at
FROM sessions
WHERE created_at < NOW() - INTERVAL '7 days'
ORDER BY created_at;

-- Delete them
DELETE FROM sessions
WHERE created_at < NOW() - INTERVAL '7 days'
  AND session_type = 'adhoc';
```

### Cancel All Pending Invites
```sql
-- Cancel old pending invites (older than 30 days)
UPDATE group_invites
SET status = 'declined'
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## Analytics & Reports

### Daily Active Users
```sql
-- Users active in last 24 hours
SELECT COUNT(DISTINCT user_id) as active_users_24h
FROM (
  SELECT initiator_user_id as user_id FROM sessions
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  UNION
  SELECT logged_by_user_id FROM matches
  WHERE played_at >= NOW() - INTERVAL '24 hours'
) active;
```

### New Users This Week
```sql
-- Users who joined in the last 7 days
SELECT
  username,
  display_name,
  created_at
FROM profiles
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Most Active Groups
```sql
-- Groups ranked by session count
SELECT
  g.name,
  COUNT(DISTINCT s.id) as session_count,
  COUNT(DISTINCT m.id) as match_count,
  COUNT(DISTINCT gm.user_id) as member_count
FROM groups g
LEFT JOIN sessions s ON g.id = s.group_id
LEFT JOIN matches m ON s.id = m.session_id
LEFT JOIN group_members gm ON g.id = gm.group_id
GROUP BY g.id
ORDER BY session_count DESC
LIMIT 10;
```

### Match Statistics
```sql
-- Overall match statistics
SELECT
  COUNT(*) as total_matches,
  COUNT(*) FILTER (WHERE played_at >= NOW() - INTERVAL '24 hours') as matches_today,
  COUNT(*) FILTER (WHERE played_at >= NOW() - INTERVAL '7 days') as matches_this_week,
  AVG(team_a_goals + team_b_goals) as avg_goals_per_match,
  MAX(team_a_goals + team_b_goals) as highest_scoring_match
FROM matches;
```

### Top Scorers (by goals)
```sql
-- Players with most goals
SELECT
  sp.display_name,
  SUM(ps.gf) as total_goals,
  SUM(ps.mp) as matches_played,
  ROUND(SUM(ps.gf)::numeric / NULLIF(SUM(ps.mp), 0), 2) as goals_per_match
FROM player_stats ps
JOIN session_players sp ON ps.session_player_id = sp.id
GROUP BY sp.display_name
HAVING SUM(ps.mp) > 0
ORDER BY total_goals DESC
LIMIT 20;
```

### Session Activity by Day
```sql
-- Sessions created per day (last 30 days)
SELECT
  DATE(created_at) as date,
  COUNT(*) as sessions_created,
  COUNT(*) FILTER (WHERE session_type = 'adhoc') as adhoc_sessions,
  COUNT(*) FILTER (WHERE session_type = 'group') as group_sessions
FROM sessions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### User Growth Over Time
```sql
-- User signups by month
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as cumulative_users
FROM profiles
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

---

## Quick Emergency Fixes

### Fix Stuck Active Session
```sql
-- End all stuck active sessions (older than 24h)
UPDATE sessions
SET status = 'expired'
WHERE status = 'active'
  AND created_at < NOW() - INTERVAL '24 hours';
```

### Remove Duplicate Group Members
```sql
-- Find duplicates
SELECT
  group_id,
  user_id,
  COUNT(*) as duplicate_count
FROM group_members
GROUP BY group_id, user_id
HAVING COUNT(*) > 1;

-- Delete duplicates (keeps oldest)
DELETE FROM group_members a
USING group_members b
WHERE a.id > b.id
  AND a.group_id = b.group_id
  AND a.user_id = b.user_id;
```

### Reset All Stats (Recalculation Needed)
```sql
-- Delete all calculated stats
-- WARNING: Stats will need to be recalculated by app
DELETE FROM player_stats;
DELETE FROM pair_stats;
```

---

## Useful One-Liners

```sql
-- Quick admin check
SELECT username, is_admin FROM profiles WHERE is_admin = true;

-- Quick session count
SELECT status, COUNT(*) FROM sessions GROUP BY status;

-- Quick user count
SELECT COUNT(*) FROM profiles;

-- Quick match count today
SELECT COUNT(*) FROM matches WHERE played_at >= CURRENT_DATE;

-- Find my user ID
SELECT id, username FROM profiles WHERE username = 'your_username';

-- See what I'm working with
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

---

## Pro Tips

1. **Always test queries with SELECT first** before running UPDATE or DELETE
2. **Use transactions** for multiple related updates:
   ```sql
   BEGIN;
   -- your queries here
   COMMIT; -- or ROLLBACK if something went wrong
   ```
3. **Back up before major cleanups**
4. **Check foreign key constraints** - deletes may cascade
5. **Use LIMIT** when testing queries that return many rows
6. **Save useful queries** - you'll use them again!

---

**Last Updated:** 2025-11-30
**Version:** 1.0
**For:** Your friend who definitely isn't doing anything sketchy 😉
