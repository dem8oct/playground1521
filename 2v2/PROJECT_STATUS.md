# Project Status Overview: 2v2 Kick Off Night Tracker

**Last Updated:** 2025-11-28
**Branch:** feature/matches-and-leaderboards
**Overall Completion:** ~50% (4/7 phases)

---

## ✅ COMPLETED PHASES

### Phase 1-4: Foundation & Session Management (DONE)

#### ✅ Authentication & Auth Context
- Supabase auth with magic link email
- Profile system with `profiles` table
- Session persistence with localStorage
- Auth context with proper loading states and timeouts
- Sign in/Sign out flows
- Guest mode support

#### ✅ Session Management
- Create session with join code generation (6-character codes)
- Join session (guest or authenticated)
- Session lobby with join code display
- End session (initiator only)
- Leave session (non-initiators)
- Session expiration (10 hours)
- LocalStorage-based session tracking (`2v2-kickoff-session`)
- Timeout guards on all async operations (5-10 second timeouts)

#### ✅ Player Management
- Add players to session (4-10 players)
- Remove players with confirmation
- Link players to profiles
- Prevent duplicate names within session
- Co-logger assignment (delegate match logging rights)
- Player count tracking (0/10 display)

#### ✅ Design System (`components/ui`)
- Button (with variants: primary, secondary, ghost, danger)
- Input with labels
- Select dropdowns
- Card (with neon variants: green, pink)
- Badge (status indicators: success, info, warning)
- PageLayout (header + content area)
- Mobile-responsive with Tailwind CSS
- Neon cyberpunk aesthetic (green/pink theme)

#### ✅ Database Schema
- `sessions` table with RLS policies
- `profiles` table with auto-creation trigger
- `session_players` table with unique constraints
- Proper indexes and foreign key constraints
- Row Level Security (RLS) policies configured

#### ✅ Bug Fixes & Polish (See BUGFIXES.md)
- Fixed infinite loading states (5-second timeouts added)
- Fixed session auto-loading bug (localStorage-based tracking)
- Fixed sign out clearing sessions properly
- Fixed button overlapping in headers (flex-wrap + gap-3)
- Added timeout protection to all database queries
- Comprehensive error handling with try-catch blocks
- Extensive console logging for debugging
- Automatic localStorage cleanup for stale data

---

## 🚧 REMAINING PHASES (Phase 5-7)

### Phase 5: Match Logging 🔴 NOT STARTED

**Missing Components:**
- [ ] Match logging form component
  - Team selection dropdowns (Team A: 2 players, Team B: 1-2 players)
  - Goals input for each team (0-99 range)
  - Optional club names (e.g., "Real Madrid vs PSG")
  - Match validation (3-4 distinct players, no duplicates across teams)
  - Quick mobile-friendly UX (simplified dropdowns)
  - Timestamp picker (default: now, editable)

- [ ] Match submission logic
  - Insert to `matches` table
  - Store `logged_by_user_id` (initiator or co-logger)
  - Trigger stats recalculation after insert
  - Toast notifications for success/error
  - Real-time updates to all connected clients

- [ ] Match history view
  - Reverse chronological list of all matches
  - Display teams, player names, and scores
  - Show match time (e.g., "22:15")
  - Show club names if entered
  - Show who logged the match
  - Edit/delete controls (initiator + co-logger only)
  - Empty state when no matches

- [ ] Edit/Delete match functionality
  - Edit form (pre-populate existing data)
  - Delete with confirmation dialog
  - Recalculate stats on edit/delete
  - Optimistic UI updates

**Database Tables Needed:**
- [ ] `matches` table
  ```sql
  CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    logged_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    team_a_player_ids UUID[] NOT NULL CHECK (array_length(team_a_player_ids, 1) = 2),
    team_b_player_ids UUID[] NOT NULL CHECK (array_length(team_b_player_ids, 1) BETWEEN 1 AND 2),
    team_a_club TEXT,
    team_b_club TEXT,
    team_a_goals INTEGER NOT NULL CHECK (team_a_goals >= 0),
    team_b_goals INTEGER NOT NULL CHECK (team_b_goals >= 0),
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_matches_session_id ON matches(session_id);
  CREATE INDEX idx_matches_played_at ON matches(played_at DESC);
  ```

**RLS Policies Needed:**
- [ ] Allow read for users in the same session (check via session join code or player list)
- [ ] Allow insert for initiator and co-logger
- [ ] Allow update/delete for initiator and co-logger

---

### Phase 6: Stats & Leaderboards 🔴 NOT STARTED

**Missing Components:**
- [ ] Player stats calculation logic
  - MP (Matches Played)
  - W (Wins) = 3 points
  - D (Draws) = 1 point each
  - L (Losses) = 0 points
  - GF (Goals For)
  - GA (Goals Against)
  - GD (Goal Difference = GF - GA)
  - Pts (Points = W*3 + D*1)
  - Triggered after each match insert/update/delete
  - Persist to `player_stats` table

- [ ] Pair stats calculation logic
  - Same metrics as players but for pairs
  - Unordered pairs (A+B = B+A, use sorted IDs)
  - Only count matches where both players were on the same team
  - Persist to `pair_stats` table
  - Generate pair label: "Name1 & Name2" (alphabetical)

- [ ] Player leaderboard component
  - Sort by: Pts (DESC) → GD (DESC) → GF (DESC) → Name (ASC)
  - Display all stats columns in a table
  - Mobile-responsive (scrollable table or card layout)
  - Real-time updates
  - Empty state when no matches

- [ ] Pair leaderboard component
  - Same sorting logic as players
  - Show pair labels ("Ahmed & Salman")
  - Display stats for each pair
  - Filter pairs with at least 1 match played

- [ ] Dashboard tabs/sections
  - Match Logging form
  - Match History
  - Player Leaderboard
  - Pair Leaderboard
  - Tab navigation or sections

**Database Tables Needed:**
- [ ] `player_stats` table
  ```sql
  CREATE TABLE player_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    session_player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
    mp INTEGER NOT NULL DEFAULT 0,
    w INTEGER NOT NULL DEFAULT 0,
    d INTEGER NOT NULL DEFAULT 0,
    l INTEGER NOT NULL DEFAULT 0,
    gf INTEGER NOT NULL DEFAULT 0,
    ga INTEGER NOT NULL DEFAULT 0,
    gd INTEGER NOT NULL DEFAULT 0,
    pts INTEGER NOT NULL DEFAULT 0,
    UNIQUE(session_id, session_player_id)
  );

  CREATE INDEX idx_player_stats_session ON player_stats(session_id);
  ```

- [ ] `pair_stats` table
  ```sql
  CREATE TABLE pair_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    session_player_id_1 UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
    session_player_id_2 UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    mp INTEGER NOT NULL DEFAULT 0,
    w INTEGER NOT NULL DEFAULT 0,
    d INTEGER NOT NULL DEFAULT 0,
    l INTEGER NOT NULL DEFAULT 0,
    gf INTEGER NOT NULL DEFAULT 0,
    ga INTEGER NOT NULL DEFAULT 0,
    gd INTEGER NOT NULL DEFAULT 0,
    pts INTEGER NOT NULL DEFAULT 0,
    CHECK (session_player_id_1 < session_player_id_2),
    UNIQUE(session_id, session_player_id_1, session_player_id_2)
  );

  CREATE INDEX idx_pair_stats_session ON pair_stats(session_id);
  ```

**Business Logic Needed:**
- [ ] Stats calculation functions in `lib/stats.ts`
  - `calculatePlayerStats(sessionId: string): Promise<void>`
  - `calculatePairStats(sessionId: string): Promise<void>`
  - Called after every match insert/update/delete
  - Use transactions to ensure consistency
  - Handle edge cases (draws, 2v1 matches)

- [ ] Recalculation triggers
  - Database trigger OR
  - Serverless function (Supabase Edge Functions) OR
  - Client-side calculation with proper error handling

---

### Phase 7: Real-time Updates 🔴 NOT STARTED

**Missing Features:**
- [ ] Supabase Realtime subscriptions
  - Subscribe to `matches` table changes for active session
  - Subscribe to `player_stats` changes for active session
  - Subscribe to `pair_stats` changes for active session
  - Subscribe to `session_players` changes for active session

- [ ] Real-time UI updates
  - Match history auto-refreshes when new match logged
  - Leaderboards auto-update when stats recalculated
  - Player list updates when players added/removed
  - All connected clients see changes instantly (no manual refresh)

- [ ] Connection state management
  - Handle connection loss gracefully
  - Reconnect on network recovery
  - Show online/offline indicator
  - Queue updates during offline periods (optional)

**Implementation Needed:**
- [ ] Set up Realtime channels in SessionContext or dedicated hook
  ```typescript
  const channel = supabase
    .channel('session-updates')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'matches', filter: `session_id=eq.${sessionId}` },
      (payload) => handleMatchChange(payload)
    )
    .subscribe()
  ```

- [ ] Handle INSERT/UPDATE/DELETE events
  - Refetch data or update React Query cache
  - Update local state optimistically
  - Show toast notifications for changes made by others

- [ ] Testing
  - Test with multiple browser windows
  - Verify all clients update simultaneously
  - Test connection loss scenarios
  - Verify no duplicate events

---

## 📊 Progress Summary

| Phase | Feature | Status | Files |
|-------|---------|--------|-------|
| 1-2 | Auth & Profiles | ✅ Complete | `AuthContext.tsx`, `AuthScreen.tsx` |
| 3 | Session Management | ✅ Complete | `SessionContext.tsx`, `CreateSessionForm.tsx`, `JoinSessionForm.tsx` |
| 4 | Player Management | ✅ Complete | `SessionLobby.tsx` |
| 4 | Design System | ✅ Complete | `components/ui/*` |
| 4 | Bug Fixes | ✅ Complete | See `BUGFIXES.md` |
| **5** | **Match Logging** | 🔴 **Not Started** | - |
| **6** | **Leaderboards** | 🔴 **Not Started** | - |
| **7** | **Real-time** | 🔴 **Not Started** | - |

**Completion: ~50%** (4/7 phases done)

---

## 🎯 Next Steps

To complete the MVP, implement in this order:

### 1. Phase 5: Match Logging (~3-5 hours)
- Create `matches` table in Supabase
- Build `MatchLoggingForm.tsx` component
- Build `MatchHistory.tsx` component
- Implement edit/delete functionality
- Add proper validation and error handling

### 2. Phase 6: Stats & Leaderboards (~4-6 hours)
- Create `player_stats` and `pair_stats` tables
- Write stats calculation logic in `lib/stats.ts`
- Build `PlayerLeaderboard.tsx` component
- Build `PairLeaderboard.tsx` component
- Integrate stats recalculation on match changes
- Add dashboard tabs/sections

### 3. Phase 7: Real-time (~2-3 hours)
- Set up Supabase Realtime subscriptions
- Handle INSERT/UPDATE/DELETE events
- Update UI on real-time changes
- Test multi-client synchronization
- Add connection state indicators

**Estimated Time to MVP:** 9-14 hours of focused development

---

## 📁 Current File Structure

```
2v2/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx ✅
│   │   └── SessionContext.tsx ✅
│   ├── components/
│   │   ├── ui/ ✅
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── PageLayout.tsx
│   │   │   └── index.ts
│   │   ├── auth/ ✅
│   │   │   └── AuthScreen.tsx
│   │   ├── session/ ✅
│   │   │   ├── CreateSessionForm.tsx
│   │   │   ├── JoinSessionForm.tsx
│   │   │   └── SessionLobby.tsx
│   │   ├── matches/ 🔴 (TO DO)
│   │   │   ├── MatchLoggingForm.tsx
│   │   │   ├── MatchHistory.tsx
│   │   │   └── MatchCard.tsx
│   │   └── leaderboards/ 🔴 (TO DO)
│   │       ├── PlayerLeaderboard.tsx
│   │       └── PairLeaderboard.tsx
│   ├── lib/
│   │   ├── supabase.ts ✅
│   │   ├── types.ts ✅
│   │   ├── sessionUtils.ts ✅
│   │   └── stats.ts 🔴 (TO DO)
│   └── index.css ✅
├── supabase-schema.sql ✅ (partial - needs matches & stats tables)
├── .env ✅
├── .env.example ✅
├── package.json ✅
├── vite.config.ts ✅
├── tailwind.config.js ✅
├── tsconfig.json ✅
├── SETUP.md ✅
├── TROUBLESHOOTING.md ✅
├── BUGFIXES.md ✅
├── SESSION_MANAGEMENT_PATTERN.md ✅
├── DEBUG_QUERIES.md ✅
├── TESTING_CHECKLIST.md ✅
└── PROJECT_STATUS.md ✅ (this file)
```

---

## 🐛 Known Issues

See `BUGFIXES.md` for complete list. All critical issues have been resolved:
- ✅ Infinite loading states (timeouts added)
- ✅ Session auto-loading bug (localStorage tracking)
- ✅ Sign out not clearing session
- ✅ Button overlapping in headers
- ✅ Guest join flow

---

## 📚 Documentation Files

- **2v2.md** - Original project specification and requirements
- **SETUP.md** - Initial setup instructions
- **TROUBLESHOOTING.md** - Common issues and solutions
- **BUGFIXES.md** - All bugs fixed and lessons learned
- **SESSION_MANAGEMENT_PATTERN.md** - Session persistence pattern documentation
- **DEBUG_QUERIES.md** - SQL queries for debugging
- **TESTING_CHECKLIST.md** - Manual testing scenarios (Tests 1-10)
- **PROJECT_STATUS.md** - This file (project progress overview)

---

## 🚀 Ready to Continue?

All foundation work is complete and tested. The app is stable and ready for the core features:
1. Match logging
2. Stats calculation
3. Leaderboards
4. Real-time updates

When ready to proceed, start with Phase 5: Match Logging.
