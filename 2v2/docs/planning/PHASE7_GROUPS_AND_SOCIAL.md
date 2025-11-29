# Phase 7: Groups, Social Features & Username Authentication

**Project:** 2v2 Kick Off Night
**Branch:** `feature/groups-and-social-features`
**Date Created:** 2025-11-29
**Status:** Planning Phase

---

## 🎯 Overview

This phase transforms the app from session-based tracking into a social platform with:
- Username-based authentication (replacing magic link)
- Groups/Clubs system
- Invite-only group membership
- Group-specific leaderboards
- System admin role
- Enhanced user profiles

---

## ✅ Design Decisions Summary

### Authentication
- ✅ Username + Password + Email (Option A+)
- ✅ Login with username OR email
- ✅ Fresh start - disable magic link entirely
- ✅ Username: 5-10 chars, lowercase, letters/numbers only
- ✅ Email required for notifications and validation

### Groups & Social
- ✅ Invite-only groups (no public discovery)
- ✅ Group sessions permanent (deleted only when group is deleted)
- ✅ Group-specific leaderboards for members
- ✅ Player duos with simple names (e.g., "John & Adam")
- ✅ 10-hour auto-delete for ad-hoc sessions

### Group Features
- ✅ Search users by username
- ✅ Invite/Accept/Decline invites
- ✅ Remove members
- ✅ Promote member to admin
- ❌ NO demote admin to member

### System Admin
- ✅ Manual assignment via database update
- ✅ Dedicated `/admin` panel (implemented later)
- ✅ Global leaderboards access
- ✅ Cleanup expired sessions button
- ⏭️ Advanced admin features (future phase)

### Skipped for Now
- ⏭️ Avatar uploads (groups & profiles)
- ⏭️ Advanced admin panel features

---

## 📊 Database Schema Changes

### 1. Enhance Profiles Table

```sql
-- Add username, admin role, and profile enhancements
ALTER TABLE profiles
  ADD COLUMN username TEXT UNIQUE NOT NULL
    CHECK (
      char_length(username) BETWEEN 5 AND 10
      AND username ~ '^[a-z0-9]+$'
    ),
  ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN avatar_url TEXT,
  ADD COLUMN bio TEXT;

-- Indexes
CREATE UNIQUE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_username_search ON profiles(username text_pattern_ops);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Update RLS policies (existing policies remain)
-- Usernames are public for search functionality
CREATE POLICY "Anyone can search usernames"
  ON profiles FOR SELECT
  USING (true);
```

**New Fields:**
- `username` - Unique identifier (5-10 chars, lowercase, letters/numbers only)
- `is_admin` - System admin flag (for global leaderboards, admin panel)
- `avatar_url` - Profile picture URL (optional, skipped for now)
- `bio` - User bio/description (optional, skipped for now)

**Validation Rules:**
- Length: 5-10 characters
- Format: lowercase letters and numbers only
- Unique across all users
- Required at signup

---

### 2. Create Groups Table

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL
    CHECK (char_length(name) BETWEEN 3 AND 50),
  description TEXT,
  created_by_user_id UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_groups_created_by ON groups(created_by_user_id);
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);

-- RLS Policies
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Users can view groups they're members of
CREATE POLICY "Users can view their groups"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = id
      AND gm.user_id = auth.uid()
    )
  );

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

-- Group admins can update their groups
CREATE POLICY "Group admins can update groups"
  ON groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Group admins can delete their groups
CREATE POLICY "Group admins can delete groups"
  ON groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**
- `id` - UUID primary key
- `name` - Group name (3-50 chars)
- `description` - Optional group description
- `created_by_user_id` - Creator (becomes first admin)
- `avatar_url` - Group avatar (optional, skipped for now)
- `created_at` / `updated_at` - Timestamps

---

### 3. Create Group Members Table

```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL
    REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Indexes
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(group_id, role);

-- RLS Policies
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of groups they belong to
CREATE POLICY "Users can view their group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
    )
  );

-- Group admins can add members (via accepted invites - handled by trigger)
CREATE POLICY "System can add members"
  ON group_members FOR INSERT
  WITH CHECK (true); -- Controlled by invite acceptance trigger

-- Group admins can remove members
CREATE POLICY "Group admins can remove members"
  ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Users can leave groups (delete their own membership)
CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (user_id = auth.uid());

-- Group admins can promote members to admin
CREATE POLICY "Group admins can promote members"
  ON group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );
```

**Fields:**
- `id` - UUID primary key
- `group_id` - Reference to group
- `user_id` - Reference to user
- `role` - 'admin' or 'member'
- `joined_at` - Timestamp

**Roles:**
- `admin` - Can invite, remove members, promote, edit group, delete group
- `member` - Can view group, participate in sessions

**Note:** No demotion from admin to member (by design decision)

---

### 4. Create Group Invites Table

```sql
CREATE TABLE group_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL
    REFERENCES groups(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_user_id UUID NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  UNIQUE(group_id, invitee_user_id) -- Can't invite same user twice to same group
);

-- Indexes
CREATE INDEX idx_group_invites_group_id ON group_invites(group_id);
CREATE INDEX idx_group_invites_invitee ON group_invites(invitee_user_id, status);
CREATE INDEX idx_group_invites_pending ON group_invites(status) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites sent to them
CREATE POLICY "Users can view their invites"
  ON group_invites FOR SELECT
  USING (invitee_user_id = auth.uid());

-- Group admins can view invites for their groups
CREATE POLICY "Group admins can view group invites"
  ON group_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- Group admins can create invites
CREATE POLICY "Group admins can create invites"
  ON group_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
    AND inviter_user_id = auth.uid()
  );

-- Invitees can respond to invites (accept/decline)
CREATE POLICY "Invitees can respond to invites"
  ON group_invites FOR UPDATE
  USING (invitee_user_id = auth.uid());

-- Group admins can cancel pending invites
CREATE POLICY "Group admins can cancel invites"
  ON group_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );
```

**Fields:**
- `id` - UUID primary key
- `group_id` - Group being invited to
- `inviter_user_id` - Admin who sent invite
- `invitee_user_id` - User being invited
- `status` - 'pending', 'accepted', 'declined'
- `created_at` - When invite was sent
- `responded_at` - When user responded

**Flow:**
1. Group admin searches for user by username
2. Admin sends invite
3. Invitee receives notification
4. Invitee accepts/declines
5. If accepted, automatically added to group_members

---

### 5. Update Sessions Table

```sql
-- Add group relationship and session type
ALTER TABLE sessions
  ADD COLUMN group_id UUID
    REFERENCES groups(id) ON DELETE CASCADE,
  ADD COLUMN session_type TEXT DEFAULT 'adhoc'
    CHECK (session_type IN ('group', 'adhoc'));

-- Indexes
CREATE INDEX idx_sessions_group_id ON sessions(group_id);
CREATE INDEX idx_sessions_type ON sessions(session_type);
CREATE INDEX idx_sessions_adhoc_cleanup ON sessions(expires_at)
  WHERE session_type = 'adhoc';

-- Update existing RLS policy for group sessions
DROP POLICY IF EXISTS "Anyone can view sessions" ON sessions;

CREATE POLICY "Users can view sessions"
  ON sessions FOR SELECT
  USING (
    session_type = 'adhoc' -- Ad-hoc sessions visible to all (existing behavior)
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = sessions.group_id
      AND gm.user_id = auth.uid()
    )
  );
```

**New Fields:**
- `group_id` - Optional reference to group (NULL for ad-hoc sessions)
- `session_type` - 'adhoc' or 'group'

**Session Types:**
1. **Ad-hoc Sessions** (`session_type = 'adhoc'`)
   - `group_id` is NULL
   - Auto-delete after 10 hours from `expires_at`
   - Current behavior (anyone can join via code)

2. **Group Sessions** (`session_type = 'group'`)
   - `group_id` references a group
   - Permanent (deleted only when group is deleted)
   - Only group members can view/join

---

### 6. Database Functions & Triggers

#### Auto-add Group Creator as Admin

```sql
CREATE OR REPLACE FUNCTION auto_add_group_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by_user_id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_created
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_group_creator_as_admin();
```

---

#### Auto-add Member When Invite is Accepted

```sql
CREATE OR REPLACE FUNCTION handle_invite_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Add user to group as member
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (NEW.group_id, NEW.invitee_user_id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;

    -- Update responded_at timestamp
    NEW.responded_at = NOW();
  ELSIF NEW.status = 'declined' AND OLD.status = 'pending' THEN
    -- Just update responded_at
    NEW.responded_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_invite_status_changed
  BEFORE UPDATE ON group_invites
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_invite_response();
```

---

#### Cleanup Expired Ad-hoc Sessions

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_adhoc_sessions()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  count INTEGER;
BEGIN
  DELETE FROM sessions
  WHERE session_type = 'adhoc'
  AND expires_at < NOW() - INTERVAL '10 hours'
  AND status != 'active'; -- Don't delete active sessions

  GET DIAGNOSTICS count = ROW_COUNT;
  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manual execution: SELECT * FROM cleanup_expired_adhoc_sessions();
```

---

#### Update Profile Creation Trigger (Add Username)

```sql
-- DROP existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create new version that requires username
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'username' -- Username must be provided at signup
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

## 🔐 Authentication Changes

### Current Auth (Magic Link)
```typescript
// Signup
await supabase.auth.signInWithOtp({ email })

// Login
await supabase.auth.signInWithOtp({ email })
```

### New Auth (Username + Password)

#### Signup Flow

```typescript
// File: src/lib/auth/signup.ts

export async function signUp(data: {
  username: string
  email: string
  password: string
  displayName: string
}) {
  // 1. Validate username format
  if (!/^[a-z0-9]{5,10}$/.test(data.username)) {
    throw new Error('Username must be 5-10 characters, lowercase letters and numbers only')
  }

  // 2. Check if username is already taken
  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', data.username)
    .single()

  if (existing) {
    throw new Error('Username already taken')
  }

  // 3. Sign up with Supabase Auth
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        username: data.username,
        display_name: data.displayName,
      },
    },
  })

  if (error) throw error

  // 4. Profile automatically created via trigger
  return authData
}
```

---

#### Login Flow (Username OR Email)

```typescript
// File: src/lib/auth/login.ts

export async function login(identifier: string, password: string) {
  // Check if identifier is email or username
  const isEmail = identifier.includes('@')

  if (isEmail) {
    // Standard email login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    })
    if (error) throw error
    return data
  } else {
    // Username login - need to lookup email first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', identifier)
      .single()

    if (profileError || !profile) {
      throw new Error('Invalid username or password')
    }

    // Get user's email from auth.users
    // Note: This requires a database function since we can't query auth.users directly
    const { data: emailData, error: emailError } = await supabase.rpc(
      'get_user_email_by_profile_id',
      { profile_id: profile.id }
    )

    if (emailError || !emailData) {
      throw new Error('Invalid username or password')
    }

    // Login with email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailData.email,
      password,
    })

    if (error) throw error
    return data
  }
}
```

---

#### Helper Function: Get Email by Profile ID

```sql
-- Function to get user email by profile ID (for username login)
CREATE OR REPLACE FUNCTION get_user_email_by_profile_id(profile_id UUID)
RETURNS TABLE(email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT u.email::TEXT
  FROM auth.users u
  WHERE u.id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Updated Signup/Login UI Components

**File:** `src/components/auth/SignupForm.tsx`

```typescript
// Signup form fields:
- Username (5-10 chars, lowercase, letters/numbers)
- Display Name
- Email
- Password
- Confirm Password

// Validation:
- Username: regex check + availability check
- Email: valid email format
- Password: min 8 chars (or your preferred rules)
- Confirm password: must match
```

**File:** `src/components/auth/LoginForm.tsx`

```typescript
// Login form fields:
- Username or Email
- Password

// Single input accepts both username and email
// Backend determines which one it is
```

---

## 📡 API Functions (TypeScript)

### File: `src/lib/api/groups.ts`

```typescript
import { supabase } from '@/lib/supabase'

// ============================================================================
// GROUPS CRUD
// ============================================================================

export async function createGroup(data: {
  name: string
  description?: string
}) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: data.name,
      description: data.description,
      created_by_user_id: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return group
}

export async function getUserGroups(userId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      role,
      joined_at,
      groups (
        id,
        name,
        description,
        avatar_url,
        created_at,
        created_by_user_id
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  if (error) throw error
  return data.map(item => ({
    ...item.groups,
    userRole: item.role,
    joinedAt: item.joined_at,
  }))
}

export async function getGroupDetails(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        id,
        user_id,
        role,
        joined_at,
        profiles (
          id,
          display_name,
          username,
          avatar_url
        )
      )
    `)
    .eq('id', groupId)
    .single()

  if (error) throw error
  return data
}

export async function updateGroup(
  groupId: string,
  data: {
    name?: string
    description?: string
  }
) {
  const { data: group, error } = await supabase
    .from('groups')
    .update(data)
    .eq('id', groupId)
    .select()
    .single()

  if (error) throw error
  return group
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)

  if (error) throw error
}

// ============================================================================
// GROUP MEMBERS
// ============================================================================

export async function getGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      id,
      user_id,
      role,
      joined_at,
      profiles (
        id,
        display_name,
        username,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })

  if (error) throw error
  return data
}

export async function removeMemberFromGroup(groupId: string, userId: string) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function promoteMemberToAdmin(groupId: string, userId: string) {
  const { error } = await supabase
    .from('group_members')
    .update({ role: 'admin' })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function leaveGroup(groupId: string) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  await removeMemberFromGroup(groupId, user.id)
}

// ============================================================================
// GROUP INVITES
// ============================================================================

export async function searchUsersByUsername(query: string) {
  if (query.length < 2) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .ilike('username', `%${query}%`)
    .limit(10)

  if (error) throw error
  return data
}

export async function inviteUserToGroup(data: {
  groupId: string
  inviteeUserId: string
}) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const { data: invite, error } = await supabase
    .from('group_invites')
    .insert({
      group_id: data.groupId,
      inviter_user_id: user.id,
      invitee_user_id: data.inviteeUserId,
    })
    .select()
    .single()

  if (error) throw error
  return invite
}

export async function getUserInvites(userId: string) {
  const { data, error } = await supabase
    .from('group_invites')
    .select(`
      *,
      groups (
        id,
        name,
        avatar_url,
        description
      ),
      inviter:profiles!inviter_user_id (
        display_name,
        username,
        avatar_url
      )
    `)
    .eq('invitee_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getPendingInvitesForGroup(groupId: string) {
  const { data, error } = await supabase
    .from('group_invites')
    .select(`
      *,
      invitee:profiles!invitee_user_id (
        display_name,
        username,
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  const { data, error } = await supabase
    .from('group_invites')
    .update({
      status: accept ? 'accepted' : 'declined',
    })
    .eq('id', inviteId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cancelInvite(inviteId: string) {
  const { error } = await supabase
    .from('group_invites')
    .delete()
    .eq('id', inviteId)

  if (error) throw error
}

// ============================================================================
// GROUP SESSIONS
// ============================================================================

export async function createGroupSession(data: {
  groupId: string
  joinCode: string
  expiresAt: string
}) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      initiator_user_id: user.id,
      join_code: data.joinCode,
      expires_at: data.expiresAt,
      group_id: data.groupId,
      session_type: 'group',
    })
    .select()
    .single()

  if (error) throw error
  return session
}

export async function getGroupSessions(groupId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================================
// GROUP LEADERBOARDS
// ============================================================================

export async function getGroupPlayerLeaderboard(groupId: string) {
  // Get all session IDs for this group
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id')
    .eq('group_id', groupId)

  if (sessionsError) throw sessionsError

  const sessionIds = sessions.map(s => s.id)

  if (sessionIds.length === 0) return []

  // Get player stats for these sessions
  const { data, error } = await supabase
    .from('player_stats')
    .select(`
      *,
      session_players (
        display_name,
        profile_id
      )
    `)
    .in('session_id', sessionIds)
    .order('pts', { ascending: false })
    .order('gd', { ascending: false })
    .order('gf', { ascending: false })

  if (error) throw error

  // Aggregate stats by player (profile_id)
  // This is a simplified version - you may want to do this aggregation in SQL
  return data
}

export async function getGroupPairLeaderboard(groupId: string) {
  // Similar to player leaderboard but for pairs
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id')
    .eq('group_id', groupId)

  if (sessionsError) throw sessionsError

  const sessionIds = sessions.map(s => s.id)

  if (sessionIds.length === 0) return []

  const { data, error } = await supabase
    .from('pair_stats')
    .select('*')
    .in('session_id', sessionIds)
    .order('pts', { ascending: false })
    .order('gd', { ascending: false })
    .order('gf', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

export async function cleanupExpiredSessions() {
  const { data, error } = await supabase.rpc('cleanup_expired_adhoc_sessions')

  if (error) throw error
  return data
}
```

---

## 🎨 UI Components

### 1. Authentication Components

#### `src/components/auth/SignupForm.tsx`
- Username input (with real-time validation)
- Display name input
- Email input
- Password input (with strength indicator)
- Confirm password input
- Submit button
- Link to login page

#### `src/components/auth/LoginForm.tsx`
- Username/Email input (single field)
- Password input
- Submit button
- Link to signup page
- Forgot password link (future)

---

### 2. Groups Components

#### `src/components/groups/CreateGroupForm.tsx`
- Group name input
- Description textarea
- Submit button
- Cancel button

#### `src/components/groups/GroupsList.tsx`
- Display user's groups (from `getUserGroups`)
- Group card: name, description, member count, role badge
- "Create Group" button
- Click group → navigate to group dashboard

#### `src/components/groups/GroupDashboard.tsx`
- Tabbed interface:
  - **Overview Tab**: Group info, recent activity
  - **Sessions Tab**: Group sessions list
  - **Leaderboards Tab**: Player & pair leaderboards
  - **Members Tab**: Member list, invites (admin only)
  - **Settings Tab**: Edit group, delete group (admin only)

#### `src/components/groups/GroupMembers.tsx`
- List of members with roles
- Admin badge
- Remove button (admin only)
- Promote to admin button (admin only)
- Leave group button (own membership)

#### `src/components/groups/InviteUser.tsx`
- Search input (username search)
- Search results dropdown
- User card: username, display name
- Invite button
- Pending invites list (admin only)
- Cancel invite button

#### `src/components/groups/UserInvites.tsx`
- List of pending invites for current user
- Group info: name, description
- Inviter info: username, display name
- Accept button
- Decline button

#### `src/components/groups/GroupLeaderboards.tsx`
- Two sections: Players & Pairs
- Filtered by group sessions only
- Same table format as existing leaderboards

---

### 3. Sessions Components (Updates)

#### `src/components/sessions/CreateSessionForm.tsx`
- Add option to create group session
- Dropdown: Select group (if user is in any groups)
- If group selected, set `session_type = 'group'` and `group_id`

---

### 4. Admin Components (Basic)

#### `src/components/admin/AdminPanel.tsx`
- Check `user.is_admin` flag
- Display admin dashboard
- Sections:
  - Global leaderboards
  - Cleanup expired sessions button
  - (Future: analytics, user management)

#### `src/components/admin/GlobalLeaderboards.tsx`
- Player leaderboard (all sessions)
- Pair leaderboard (all sessions)
- No filtering by group

#### `src/components/admin/CleanupButton.tsx`
- Button: "Clean Up Expired Sessions"
- Calls `cleanupExpiredSessions()`
- Shows count of deleted sessions

---

## 📋 Implementation Phases

### **Phase 1: Database Setup** ✅
**Tasks:**
1. Create SQL migration file with all schema changes
2. Run migration in Supabase SQL Editor
3. Verify tables, indexes, triggers created
4. Test RLS policies

**Deliverables:**
- `supabase/migrations/phase7_groups_and_social.sql`

**Testing:**
- Insert test data manually
- Verify cascading deletes work
- Verify triggers fire correctly

---

### **Phase 2: Username Authentication** 🔐
**Tasks:**
1. Add username validation helper functions
2. Update signup flow (new form + API)
3. Update login flow (username OR email)
4. Create helper function `get_user_email_by_profile_id`
5. Disable magic link auth in Supabase dashboard
6. Test signup/login flows

**Deliverables:**
- `src/lib/auth/signup.ts`
- `src/lib/auth/login.ts`
- `src/lib/auth/validation.ts`
- `src/components/auth/SignupForm.tsx`
- `src/components/auth/LoginForm.tsx`

**Testing:**
- Sign up with username, email, password
- Login with username + password
- Login with email + password
- Verify username uniqueness check
- Verify username format validation

---

### **Phase 3: Groups API Layer** 📡
**Tasks:**
1. Create `src/lib/api/groups.ts`
2. Implement all CRUD functions
3. Implement invite functions
4. Implement member management
5. Test with Supabase client

**Deliverables:**
- Complete groups API module

**Testing:**
- Create group
- Invite user
- Accept/decline invite
- Promote member
- Remove member
- Delete group (verify cascade)

---

### **Phase 4: Groups UI** 🎨
**Tasks:**
1. Create group form component
2. Create groups list component
3. Create group dashboard (tabbed)
4. Create member management UI
5. Create invite UI
6. Create user invites list
7. Update navigation (add "Groups" link)

**Deliverables:**
- All group UI components
- Routes: `/groups`, `/groups/:id`

**Testing:**
- Full user flow: create group → invite user → accept invite
- Member management: remove, promote
- Leave group

---

### **Phase 5: Group Sessions & Leaderboards** 📊
**Tasks:**
1. Update CreateSessionForm (add group option)
2. Implement group leaderboards
3. Filter stats by group sessions
4. Display group sessions in GroupDashboard

**Deliverables:**
- Updated session creation
- Group-specific leaderboards

**Testing:**
- Create group session
- Log matches
- Verify leaderboards show only group data
- Verify ad-hoc sessions don't appear in group leaderboards

---

### **Phase 6: Admin Panel (Basic)** 👑
**Tasks:**
1. Create admin panel route (`/admin`)
2. Add `is_admin` check middleware
3. Implement global leaderboards
4. Implement cleanup button
5. Manually set first admin in database

**Deliverables:**
- Basic admin panel
- Global leaderboards view
- Cleanup functionality

**Testing:**
- Set `is_admin = true` for test user
- Access `/admin` route
- View global leaderboards
- Click cleanup button, verify old sessions deleted

---

### **Phase 7: Cleanup & Polish** ✨
**Tasks:**
1. Add loading states
2. Add error handling
3. Add success notifications
4. Add confirmation dialogs (delete group, remove member)
5. Responsive design testing
6. Cross-browser testing

**Deliverables:**
- Polished UX
- Comprehensive error handling

**Testing:**
- Test all flows end-to-end
- Test edge cases (no groups, no invites, etc.)
- Mobile responsive testing

---

### **Phase 8: Documentation & Deployment** 📚
**Tasks:**
1. Update README
2. Update PROJECT_STATUS.md
3. Create user guide (how to use groups)
4. Commit all changes
5. Create pull request
6. Merge to main
7. Deploy to production

**Deliverables:**
- Updated documentation
- Deployed feature

---

## 🧪 Testing Checklist

### Authentication
- [ ] Sign up with valid username
- [ ] Sign up with invalid username (too short, uppercase, special chars)
- [ ] Sign up with duplicate username (error shown)
- [ ] Login with username + password
- [ ] Login with email + password
- [ ] Login with invalid credentials (error shown)
- [ ] Logout

### Groups
- [ ] Create group
- [ ] View groups list
- [ ] View group dashboard
- [ ] Edit group (admin only)
- [ ] Delete group (admin only)
- [ ] Verify sessions deleted when group deleted

### Invites
- [ ] Search users by username
- [ ] Send invite to user
- [ ] Receive invite notification
- [ ] Accept invite → user added to group
- [ ] Decline invite → not added to group
- [ ] Cancel pending invite (admin)
- [ ] Cannot invite same user twice to same group

### Members
- [ ] View member list
- [ ] Promote member to admin
- [ ] Remove member (admin only)
- [ ] Leave group (own membership)
- [ ] Verify can't demote admin

### Sessions
- [ ] Create ad-hoc session (existing behavior)
- [ ] Create group session
- [ ] Group members can view group sessions
- [ ] Non-members cannot view group sessions
- [ ] Ad-hoc sessions auto-delete after 10 hours

### Leaderboards
- [ ] Group leaderboards show only group data
- [ ] Regular users cannot see global leaderboards
- [ ] Admins can see global leaderboards

### Admin
- [ ] Admin can access `/admin` panel
- [ ] Non-admin redirected from `/admin`
- [ ] Cleanup button deletes expired ad-hoc sessions
- [ ] Global leaderboards display all data

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Database migration tested on staging
- [ ] No console errors
- [ ] Mobile responsive verified

### Database
- [ ] Backup current database
- [ ] Run migration SQL in production Supabase
- [ ] Verify tables created
- [ ] Verify RLS policies active
- [ ] Set first admin user manually

### Supabase Configuration
- [ ] Disable magic link authentication
- [ ] Enable email/password authentication
- [ ] Verify email templates (confirmation, password reset)
- [ ] Set email sender

### Deployment
- [ ] Deploy frontend
- [ ] Test production environment
- [ ] Monitor error logs
- [ ] Send announcement to users

---

## 📝 Open Questions & Future Enhancements

### Future Phase Ideas
1. **Avatar Uploads**
   - User profile avatars
   - Group avatars
   - Implement Supabase Storage

2. **Email Notifications**
   - Invite received
   - Session starting soon
   - Achievement unlocked (future)

3. **Advanced Admin Panel**
   - User management (ban, delete)
   - Analytics dashboard
   - Group management
   - Session management

4. **Real-time Updates**
   - Live invite notifications
   - Live session updates
   - Supabase Realtime subscriptions

5. **Pairs Naming**
   - Allow pairs to set custom team names
   - "The Dream Team", etc.
   - Store in new column or separate table

6. **Search Enhancements**
   - Search users by display name too
   - Fuzzy search
   - Search history

7. **Group Discoverability** (Future consideration)
   - Public groups option
   - Browse/search public groups
   - Join code for groups

---

## 📦 File Structure

```
2v2/
├── supabase/
│   └── migrations/
│       └── phase7_groups_and_social.sql
├── src/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── signup.ts
│   │   │   ├── login.ts
│   │   │   └── validation.ts
│   │   └── api/
│   │       └── groups.ts
│   ├── components/
│   │   ├── auth/
│   │   │   ├── SignupForm.tsx
│   │   │   └── LoginForm.tsx
│   │   ├── groups/
│   │   │   ├── CreateGroupForm.tsx
│   │   │   ├── GroupsList.tsx
│   │   │   ├── GroupDashboard.tsx
│   │   │   ├── GroupMembers.tsx
│   │   │   ├── InviteUser.tsx
│   │   │   ├── UserInvites.tsx
│   │   │   └── GroupLeaderboards.tsx
│   │   └── admin/
│   │       ├── AdminPanel.tsx
│   │       ├── GlobalLeaderboards.tsx
│   │       └── CleanupButton.tsx
│   └── pages/ (or app/ if using Next.js 13+)
│       ├── groups/
│       │   ├── index.tsx
│       │   └── [id].tsx
│       └── admin/
│           └── index.tsx
└── PHASE7_GROUPS_AND_SOCIAL.md (this file)
```

---

## 🎯 Success Metrics

**Phase 7 is complete when:**
- ✅ Users can sign up with username/password
- ✅ Users can login with username or email
- ✅ Users can create groups
- ✅ Users can invite others to groups
- ✅ Users can accept/decline invites
- ✅ Groups have member management (promote, remove)
- ✅ Group sessions are created and linked to groups
- ✅ Group leaderboards show only group data
- ✅ Ad-hoc sessions auto-delete after 10 hours
- ✅ System admins can view global leaderboards
- ✅ System admins can manually cleanup sessions
- ✅ All features tested and working
- ✅ Documentation updated

---

**Last Updated:** 2025-11-29
**Status:** Planning Complete - Ready for Implementation
**Next Step:** Create database migration SQL file (Phase 1)
