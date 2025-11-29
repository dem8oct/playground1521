# Future Ideas & Feature Proposals

**Project:** 2v2 Kick Off Night
**Purpose:** Document proposed features and UX improvements for future development

---

## 1. Dashboard Tabs/Sections Organization

**Status:** ✅ Complete (Implemented 2025-11-29)
**Priority:** Medium
**Effort:** ~2-3 hours

### Current State
The Dashboard is a single scrolling page with all sections stacked vertically:
- Match Logging Form
- Match History
- Player Leaderboard
- Pair Leaderboard

### Problem
- Lots of scrolling required, especially on mobile
- All sections visible at once can be overwhelming
- Hard to focus on one task at a time

### Proposed Solutions

#### Option A: Tabbed Navigation ⭐ **RECOMMENDED**

**UI Structure:**
```
[Log Match] [History] [Leaderboards]
─────────────────────────────────────
Content for selected tab appears here
```

**Tab Breakdown:**
1. **"Log Match"** tab
   - Just the match logging form
   - Clean, focused experience
   - No distractions

2. **"History"** tab
   - Match history only
   - Full width for better table display
   - Easy to review past matches

3. **"Leaderboards"** tab
   - Both Player and Pair leaderboards
   - Side-by-side on desktop
   - Stacked on mobile

**Pros:**
- Clean, focused view - one thing at a time
- Less scrolling, better mobile experience
- Common pattern users already understand
- Can use React state or URL params for tab selection

**Cons:**
- Can't see multiple sections simultaneously
- Requires some refactoring of Dashboard component

**Implementation Notes:**
```tsx
// Dashboard.tsx
const [activeTab, setActiveTab] = useState<'log' | 'history' | 'leaderboards'>('log')

// Tabs UI component
<div className="flex gap-2 border-b-2 border-border mb-6">
  <button
    onClick={() => setActiveTab('log')}
    className={activeTab === 'log' ? 'active' : ''}
  >
    Log Match
  </button>
  {/* ... more tabs */}
</div>

// Conditional rendering
{activeTab === 'log' && <MatchLoggingForm />}
{activeTab === 'history' && <MatchHistory />}
{activeTab === 'leaderboards' && (
  <div className="grid md:grid-cols-2 gap-6">
    <PlayerLeaderboard />
    <PairLeaderboard />
  </div>
)}
```

**Best For:** Mobile-first experience, reducing visual clutter

---

#### Option B: Collapsible Sections/Accordion

**UI Structure:**
```
▼ Match Logging Form (expanded)
  [Form content here]

▼ Match History (expanded)
  [History table here]

▶ Player Leaderboard (collapsed)

▶ Pair Leaderboard (collapsed)
```

**Pros:**
- Can expand/collapse what you need
- Can view multiple sections at once
- Flexible, customizable view

**Cons:**
- Still requires scrolling
- More complex UI state management
- Less intuitive than tabs

**Best For:** Power users who want custom layouts

---

#### Option C: Keep Current Layout + Add Quick Navigation

**UI Structure:**
```
[Jump to: ⚽ Form | 📊 History | 🏆 Players | 👥 Pairs]
─────────────────────────────────────────────────────
(All sections visible below, scrollable)

<Match Logging Form>

<Match History>

<Player Leaderboard>

<Pair Leaderboard>
```

**Pros:**
- Simple, no major refactor needed
- Can see everything at once
- Good for live tracking on large screens
- Smooth scroll navigation

**Cons:**
- Lots of scrolling on mobile
- Overwhelming with all content visible

**Implementation:**
```tsx
// Add refs for each section
const formRef = useRef<HTMLElement>(null)
const historyRef = useRef<HTMLElement>(null)
const playersRef = useRef<HTMLElement>(null)
const pairsRef = useRef<HTMLElement>(null)

// Quick nav buttons
<div className="sticky top-0 bg-bg-primary z-10 flex gap-2 p-4">
  <Button onClick={() => formRef.current?.scrollIntoView()}>
    ⚽ Form
  </Button>
  {/* ... more buttons */}
</div>
```

**Best For:** Quick iteration, minimal changes

---

### Decision Matrix

| Criteria | Option A: Tabs | Option B: Accordion | Option C: Quick Nav |
|----------|---------------|---------------------|---------------------|
| Mobile UX | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Desktop UX | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Implementation Effort | Medium | Medium | Low |
| Flexibility | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| User Familiarity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

**Recommendation:** **Option A - Tabs** for best overall UX

---

## 2. Registered Players Joining Sessions

**Status:** 💭 Proposed
**Priority:** High
**Effort:** ~3-4 hours

### Current State
- Only the session initiator can add players manually
- Registered users cannot join sessions on their own
- All players are added manually by typing names

### Problem
- Registered users have to wait for initiator to add them
- No way for friends to "join" your session independently
- Profile linking happens manually (if at all)

### Proposed Solutions

#### Option A: Join Code for Everyone (Simplest)

**How It Works:**
- Registered users use the same join code as guests
- They go through "Join Session" flow
- System detects they're logged in and auto-links profile_id
- They appear in session lobby automatically

**Pros:**
- No new UI needed
- Reuses existing join flow
- Simple to implement

**Cons:**
- Doesn't feel special for registered users
- Still requires manual "Add Player" from initiator
- Join code flow designed for guests, feels odd for registered users

**Implementation:**
```tsx
// In JoinSessionForm, detect user and auto-link
if (user) {
  // Auto-add user as player with profile_id
  await addPlayer(user.display_name, user.id)
}
```

---

#### Option B: Direct Invite System

**How It Works:**
- Session initiator can search for users by username/email
- Click "Invite User" button
- System creates invite record or generates invite link
- Invited user receives notification (email/in-app)
- User clicks accept → automatically added to session

**UI Mockup:**
```
Session Lobby
─────────────────────────────────
Invite Players:
[Search users...] [🔍]

Results:
👤 Ahmed (ahmed@example.com) [Invite]
👤 Salman (salman@example.com) [Invite]

Pending Invites:
- Mohamed (invited 2 mins ago) [Cancel]
```

**Pros:**
- Feels intentional and social
- Clear invite/accept flow
- Professional UX

**Cons:**
- Requires notification system
- New database table (`session_invites`)
- More complex implementation
- Email integration needed (optional)

**Database Schema:**
```sql
CREATE TABLE session_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  inviter_user_id UUID NOT NULL REFERENCES auth.users(id),
  invitee_user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Best For:** Polished, social experience

---

#### Option C: Hybrid Approach ⭐ **RECOMMENDED**

**How It Works:**

**Path 1: Quick Join (for registered users)**
- Registered users can join via join code
- Same flow as guests but profile auto-links
- Fast, self-service

**Path 2: Search & Add (for initiators)**
- Initiator types player name in "Add Player" field
- System shows autocomplete dropdown with matching registered users
- Two options appear:
  - Click registered user → adds them with profile linked
  - Press Enter → adds as guest (current behavior)

**UI Mockup:**
```
Add Player to Session
──────────────────────────────────
[Player name or username...]
                              [Add]

Matching Users:
✓ Ahmed (Registered)     [Add]
✓ Mohamed (Registered)   [Add]
─────────────────────────────────
or
⊕ Add "Ahm" as guest player
```

**Pros:**
- Best of both worlds
- No invites/notifications needed (simpler)
- Self-service for registered users
- Easy lookup for initiators
- Profile linking happens automatically

**Cons:**
- Autocomplete adds some complexity
- Need to query profiles table for search

**Implementation:**
```tsx
// SessionLobby.tsx - Enhanced Add Player

const [searchQuery, setSearchQuery] = useState('')
const [searchResults, setSearchResults] = useState([])

async function searchUsers(query: string) {
  if (query.length < 2) return []

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name')
    .ilike('display_name', `%${query}%`)
    .limit(5)

  setSearchResults(data || [])
}

// In the form:
<div className="relative">
  <Input
    label="Player Name or Username"
    value={searchQuery}
    onChange={(e) => {
      setSearchQuery(e.target.value)
      searchUsers(e.target.value)
    }}
  />

  {searchResults.length > 0 && (
    <div className="absolute z-10 bg-bg-secondary border-2 border-neon-green">
      {searchResults.map(user => (
        <button
          onClick={() => addPlayer(user.display_name, user.id)}
          className="flex items-center gap-2"
        >
          <Badge variant="success">Registered</Badge>
          {user.display_name}
        </button>
      ))}
      <button onClick={() => addPlayer(searchQuery)}>
        Add "{searchQuery}" as guest
      </button>
    </div>
  )}
</div>
```

**Best For:** Balance of simplicity and power

---

### Decision Matrix

| Criteria | Option A: Join Code | Option B: Invites | Option C: Hybrid |
|----------|-------------------|-------------------|------------------|
| User Experience | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Implementation | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Self-Service | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Profile Linking | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Maintenance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**Recommendation:** **Option C - Hybrid** for best balance

---

## 3. Other Future Ideas (Backlog)

### Real-time Updates (Phase 7)
- **Status:** Not started
- **Priority:** Low (React Query already handles refreshing)
- **Effort:** ~2-3 hours
- **Description:** Use Supabase Realtime subscriptions for live updates across all connected clients

### Match Editing/Deletion
- **Status:** Not implemented
- **Priority:** Medium
- **Effort:** ~2 hours
- **Description:**
  - Allow initiator/co-logger to edit match details
  - Delete matches with confirmation
  - Recalculate stats after changes

### Session History/Archive
- **Status:** Idea
- **Priority:** Low
- **Effort:** ~3-4 hours
- **Description:**
  - View past/ended sessions
  - Archive sessions instead of deleting
  - Historical leaderboards

### Export Stats
- **Status:** Idea
- **Priority:** Low
- **Effort:** ~1-2 hours
- **Description:**
  - Export leaderboards as CSV
  - Export match history as PDF
  - Share session summary

### Player Profile Pages
- **Status:** Idea
- **Priority:** Low
- **Effort:** ~4-5 hours
- **Description:**
  - Dedicated profile page for each user
  - Stats across all sessions
  - Match history
  - Achievement badges

### Dark/Light Mode Toggle
- **Status:** Idea
- **Priority:** Very Low
- **Effort:** ~1 hour
- **Description:** Add theme switcher (currently neon cyberpunk only)

---

## Implementation Priority

### Phase 6.5 (Next Up)
1. ✅ ~~Dashboard Tabs~~ (Option A recommended)
2. ✅ ~~Registered Player Joining~~ (Option C: Hybrid recommended)

### Phase 7 (Optional Polish)
1. Match Edit/Delete
2. Session Archive
3. Export Stats
4. Real-time subscriptions

### Phase 8 (Nice to Have)
1. Player Profiles
2. Achievement System
3. Dark/Light Mode
4. Advanced Filtering

---

## 3. User Profiles & Social Features 🎮

**Status:** 💭 Proposed (Major Feature)
**Priority:** High (Core to app evolution)
**Effort:** ~20-30 hours total

### Vision

Transform from a session-based tool into a social platform where users build profiles, join groups/clubs, track lifetime stats, and compete with friends across multiple game nights.

**Goal:** Make the app social, engaging, and potentially monetizable.

---

### Architecture Overview

#### Current Structure Issues
- ❌ Sessions are isolated - no connection between different game nights
- ❌ No user identity beyond current session
- ❌ Stats only exist per session, lost when session ends
- ❌ No community or social features

#### Proposed Structure
- ✅ Query-based architecture (no data duplication)
- ✅ Relational database design (proper indexes)
- ✅ Separation of concerns: Users → Groups → Sessions → Matches
- ✅ Calculated stats using materialized views

---

### Database Schema Changes

#### Tier 1: Enhanced User Profiles

```sql
-- MODIFY existing profiles table
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN bio TEXT;
ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();

-- Computed stats (not stored, calculated on-demand)
-- Example query:
SELECT
  COUNT(*) as total_matches,
  SUM(CASE WHEN win THEN 1 ELSE 0 END) as total_wins,
  -- ... more aggregations
FROM matches
WHERE player_id = user_id
```

**Profile Fields:**
- `id` - existing
- `display_name` - existing
- `avatar_url` - NEW (optional profile picture)
- `bio` - NEW (short description)
- `created_at` - NEW

**Calculated Stats (query-based):**
- Total matches participated
- Total wins/draws/losses
- Win rate percentage
- Total goals scored
- Favorite pair (most played with)
- Most played against

---

#### Tier 2: Groups/Clubs (NEW)

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  join_code TEXT UNIQUE, -- Optional, for public groups
  is_public BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
```

**Group Features:**
- Name (e.g., "Friday Night FIFA Club")
- Description
- Public/Private toggle
- Optional join code (for public groups)
- Admin vs. Member roles
- Group avatar

---

#### Tier 3: Enhanced Sessions

```sql
-- ADD to existing sessions table
ALTER TABLE sessions ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN session_type TEXT DEFAULT 'adhoc' CHECK (session_type IN ('group', 'adhoc'));

CREATE INDEX idx_sessions_group ON sessions(group_id);
```

**Session Types:**
1. **Group Sessions** - Created within a group, permanent record
2. **Ad-hoc Sessions** - Standalone, can be deleted after expiry

---

#### Tier 4: Materialized Views for Performance

```sql
-- User lifetime stats (auto-refreshed)
CREATE MATERIALIZED VIEW user_lifetime_stats AS
SELECT
  sp.profile_id as user_id,
  COUNT(DISTINCT m.id) as total_matches,
  SUM(CASE WHEN ps.w > 0 THEN 1 ELSE 0 END) as total_wins,
  SUM(ps.gf) as total_goals_scored,
  SUM(ps.ga) as total_goals_conceded,
  AVG(ps.pts::float / NULLIF(ps.mp, 0)) as avg_points_per_match
FROM session_players sp
JOIN player_stats ps ON ps.session_player_id = sp.id
JOIN matches m ON m.session_id = sp.session_id
WHERE sp.profile_id IS NOT NULL
GROUP BY sp.profile_id;

CREATE UNIQUE INDEX ON user_lifetime_stats(user_id);

-- Refresh function (call after each match insert/update/delete)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_lifetime_stats;
```

```sql
-- Group lifetime stats
CREATE MATERIALIZED VIEW group_lifetime_stats AS
SELECT
  s.group_id,
  sp.profile_id as user_id,
  sp.display_name,
  COUNT(DISTINCT m.id) as matches_in_group,
  SUM(ps.pts) as total_points,
  SUM(ps.gf) as goals_scored,
  SUM(ps.ga) as goals_conceded
FROM sessions s
JOIN session_players sp ON sp.session_id = s.id
JOIN player_stats ps ON ps.session_player_id = sp.id
JOIN matches m ON m.session_id = s.id
WHERE s.group_id IS NOT NULL AND sp.profile_id IS NOT NULL
GROUP BY s.group_id, sp.profile_id, sp.display_name;

CREATE INDEX ON group_lifetime_stats(group_id, total_points DESC);
```

---

### Feature Breakdown by User Type

| Feature | Guest User | Registered User | Group Member | Group Admin |
|---------|-----------|----------------|--------------|-------------|
| **Join session via code** | ✅ | ✅ | ✅ | ✅ |
| **Create ad-hoc session** | ❌ | ✅ | ✅ | ✅ |
| **View own profile** | ❌ | ✅ | ✅ | ✅ |
| **Personal lifetime stats** | ❌ | ✅ | ✅ | ✅ |
| **Session history** | ❌ | ✅ | ✅ | ✅ |
| **Match history** | ❌ | ✅ | ✅ | ✅ |
| **Create group** | ❌ | ✅ | ❌ | ✅ |
| **Join group** | ❌ | ✅ | ✅ | ✅ |
| **Create group session** | ❌ | ❌ | ✅ | ✅ |
| **View group leaderboards** | ❌ | ❌ | ✅ | ✅ |
| **View group history** | ❌ | ❌ | ✅ | ✅ |
| **Invite to group** | ❌ | ❌ | Maybe* | ✅ |
| **Manage group settings** | ❌ | ❌ | ❌ | ✅ |
| **Remove group members** | ❌ | ❌ | ❌ | ✅ |

*Maybe = Configurable permission (allow members to invite)

---

### Implementation Roadmap

#### **Phase 7: User Profiles & History** (~4-6 hours)

**Goal:** Give users persistent identity and stats

**Tasks:**
1. Enhance profile schema (avatar, bio)
2. Create user profile page component
3. Display lifetime stats (query-based)
4. Show session history (participated in)
5. Show match history (all matches user played in)
6. Add profile editing

**UI Components:**
- `UserProfile.tsx` - Profile page
- `UserStats.tsx` - Lifetime statistics
- `SessionHistory.tsx` - List of sessions
- `MatchHistory.tsx` - All matches across sessions
- `EditProfile.tsx` - Update avatar, bio

**Database Queries:**
```typescript
// Get user's lifetime stats
async function getUserLifetimeStats(userId: string) {
  const { data: stats } = await supabase
    .from('user_lifetime_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  return stats
}

// Get user's session history
async function getUserSessions(userId: string) {
  const { data: sessions } = await supabase
    .from('session_players')
    .select(`
      session_id,
      sessions (
        id,
        created_at,
        status,
        group_id,
        groups (name)
      )
    `)
    .eq('profile_id', userId)

  return sessions
}
```

---

#### **Phase 8: Groups/Clubs Foundation** (~8-10 hours)

**Goal:** Allow users to create permanent communities

**Tasks:**
1. Create `groups` and `group_members` tables
2. Add `group_id` to sessions table
3. Build "Create Group" flow
4. Build "Join Group" flow (via code or invite)
5. Group dashboard page
6. Group member list
7. Link sessions to groups
8. Group settings (admin only)

**UI Components:**
- `CreateGroup.tsx` - Group creation form
- `JoinGroup.tsx` - Join via code
- `GroupDashboard.tsx` - Group homepage
- `GroupMembers.tsx` - Member list
- `GroupSettings.tsx` - Admin controls
- `GroupLeaderboards.tsx` - Group-specific stats
- `GroupSessions.tsx` - All group sessions

**Features:**
- Group name, description, avatar
- Public/Private toggle
- Join code generation
- Member management (admin)
- Invite members by username
- Role management (admin/member)

---

#### **Phase 9: Social & Engagement Features** (~6-8 hours)

**Goal:** Make the app addictive and competitive

**Sub-Feature 1: Achievements & Badges** (~2-3 hours)
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition_type TEXT -- 'goals_scored', 'win_streak', etc.
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES auth.users(id),
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
```

**Achievement Examples:**
- 🎯 "Hat Trick Hero" - Score 3+ goals in a match
- 🔥 "Unbeatable" - 5 win streak
- 🤝 "Team Player" - Play with 5+ different partners
- ⚽ "Century Club" - 100 total goals
- 👑 "Champion" - Win a group leaderboard

**Sub-Feature 2: Rivalries & Head-to-Head** (~2 hours)
```typescript
// Query head-to-head record
async function getHeadToHead(player1Id: string, player2Id: string) {
  // Complex query to find matches where both played on opposite teams
  // Return: wins, losses, draws, goals for/against
}
```

**Display:**
- "Your nemesis is Ahmed (W:2 D:1 L:5)"
- "Your best partner is Salman (75% win rate together)"

**Sub-Feature 3: Activity Feed** (~2-3 hours)
```sql
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT, -- 'match_logged', 'achievement_unlocked', 'session_created'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Feed Items:**
- "Ahmed & Salman won 5-2 against Mohamed!"
- "New session starting in 10 mins"
- "Ahmed unlocked 'Hat Trick Hero'"

**Sub-Feature 4: Push Notifications** (~1-2 hours)
- "Your group has a new session tonight"
- "You've been invited to join a match"
- "Session starting in 15 minutes"

---

#### **Phase 10: Monetization** (~4-6 hours)

**Pricing Tiers:**

| Feature | Free | Premium ($5/mo) | Group Admin ($10/mo) |
|---------|------|----------------|----------------------|
| **Sessions** | Join any | Create unlimited | Create unlimited |
| **Groups** | Join 1 group | Join 3 groups | Create & manage groups |
| **Stats** | Session-only | Lifetime stats | Advanced analytics |
| **Profile** | Basic | Avatar + bio | Custom themes |
| **Features** | - | Head-to-head stats | Export data (CSV/PDF) |
| **Priority** | - | - | Priority support |
| **Ads** | Yes | No | No |

**Implementation:**
1. Add `subscription_tier` to profiles table
2. Integrate Stripe for payments
3. Add tier checks to features
4. Create upgrade flow UI
5. Admin dashboard for managing subscriptions

---

### ✅ Design Decisions (User Confirmed: 2025-11-29)

1. **Group Privacy:**
   - ✅ **DECISION: Invite-only groups**
   - Groups are private by default
   - Only group admins can invite new members
   - No public discovery or join codes for groups

2. **Session Ownership:**
   - ✅ **DECISION: Group sessions are permanent, tied to group lifecycle**
   - Group sessions cannot be individually deleted
   - Sessions are deleted when the group is deleted (CASCADE)
   - Only group admins can delete the group
   - **REJECTED:** "Graduate" feature (converting ad-hoc to group sessions)

3. **Leaderboards Scope:**
   - ✅ **DECISION: Group-specific leaderboards for members, global for admins only**
   - Regular users see only their group leaderboards
   - Admin role can access global leaderboards (all users across all sessions)
   - TODO: Define admin role permissions and access controls

4. **Pairs Persistence:**
   - ✅ **DECISION: Player duos (not club teams)**
   - Pairs are lightweight partnerships between two players (e.g., "John & Adam")
   - Stats-focused: track win rates, goals, matches played together
   - Optional: Allow pairs to set a team name (e.g., "The Dream Team")
   - NOT implementing full club teams with rosters, logos, etc.

5. **Data Retention:**
   - ✅ **DECISION: 10-hour auto-delete for ad-hoc, cascade delete for groups**
   - Ad-hoc sessions auto-delete after 10 hours
   - Group sessions persist forever (until group is deleted)
   - When a group is deleted, all its sessions are deleted (CASCADE)
   - No manual deletion of individual sessions

---

### UX Mockups

#### User Profile Page
```
┌──────────────────────────────────────┐
│  [Avatar]  John Doe               │
│            "The Goal Machine"        │
│            Member since Jan 2025     │
│            [Edit Profile]            │
├──────────────────────────────────────┤
│  Lifetime Stats                      │
│  Matches: 45  |  Win Rate: 62%      │
│  Goals: 87    |  Best Pair: Ahmed   │
├──────────────────────────────────────┤
│  Achievements                        │
│  🎯 Hat Trick Hero                  │
│  🔥 Unbeatable                      │
├──────────────────────────────────────┤
│  Session History  |  Match History  │
│  (Tabs)                             │
└──────────────────────────────────────┘
```

#### Group Dashboard
```
┌──────────────────────────────────────┐
│  Friday Night FIFA Club              │
│  [Avatar] 12 members                 │
│  [Sessions] [Leaderboards] [Members] │
├──────────────────────────────────────┤
│  Recent Activity                     │
│  • Ahmed won 5-2 (2 mins ago)       │
│  • New session created              │
├──────────────────────────────────────┤
│  Upcoming Sessions                   │
│  Tonight at 8pm - Join Code: ABC123 │
├──────────────────────────────────────┤
│  Group Leaderboards                  │
│  1. Ahmed - 45 pts                  │
│  2. Salman - 42 pts                 │
└──────────────────────────────────────┘
```

---

### Performance Considerations

**Materialized Views:**
- Refresh strategy: After each match insert/update/delete
- Use `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid locking
- Index heavily used columns

**Caching:**
- User stats: Cache for 5 minutes (acceptable staleness)
- Group leaderboards: Cache for 1 minute
- Session list: No cache (real-time important)

**Pagination:**
- Match history: 20 per page
- Session history: 10 per page
- Activity feed: Infinite scroll

---

### Success Metrics

To measure if social features are working:

**Engagement:**
- Daily Active Users (DAU)
- Sessions created per week
- Average matches per user
- Return rate (7-day, 30-day)

**Social:**
- Groups created
- Average group size
- Cross-group participation rate
- Invite conversion rate

**Monetization:**
- Free → Premium conversion rate
- Premium → Group Admin upgrade rate
- Churn rate
- Average LTV (Lifetime Value)

---

### Implementation Priority

**Must Have (Phase 7-8):**
- User profiles with stats
- Groups/Clubs foundation
- Group sessions

**Should Have (Phase 9):**
- Achievements
- Activity feed
- Rivalries

**Nice to Have (Phase 10):**
- Monetization
- Push notifications
- Advanced analytics

---

**Last Updated:** 2025-11-29
**Maintained By:** Claude (Sonnet 4.5)
