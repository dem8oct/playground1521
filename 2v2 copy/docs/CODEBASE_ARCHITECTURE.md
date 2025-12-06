# 2v2 Kick Off Night Tracker - Codebase Architecture

**Generated:** 2025-11-30
**Purpose:** Comprehensive architecture documentation for developers

---

## Table of Contents
1. [Frontend Architecture](#frontend-architecture)
2. [Backend & Data Layer](#backend--data-layer)
3. [Quick Reference](#quick-reference)

---

# Frontend Architecture

## 1. Technology Stack

### Framework & Build Tools
- **Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4 (modern, fast bundler)
- **Language**: TypeScript 5.2.2 (strict mode enabled)
- **State Management**: React Context API + TanStack React Query 5.90.11
- **Backend**: Supabase (PostgreSQL + Auth)
- **Notifications**: React Hot Toast 2.6.0

### Key Configuration Files
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration (optimized for reduced CPU usage)
- `tsconfig.json` - TypeScript strict configuration
- `tailwind.config.js` - Styling configuration
- `postcss.config.js` - PostCSS configuration

---

## 2. Project Structure

```
/src
  ├── components/          # React components organized by feature
  │   ├── ui/             # Reusable UI components (Button, Card, Table, etc.)
  │   ├── auth/           # Authentication components (LoginForm, SignupForm, AuthScreen)
  │   ├── matches/        # Match logging & history (Dashboard, MatchLoggingForm)
  │   ├── groups/         # Group management features
  │   ├── session/        # Session creation & joining
  │   └── leaderboards/   # Leaderboard displays
  ├── contexts/           # React Context providers (AuthContext, SessionContext)
  ├── lib/                # Utilities and API functions
  │   ├── api/           # API functions (groups.ts)
  │   ├── auth/          # Authentication utilities
  │   ├── database.types.ts # Supabase type definitions
  │   ├── supabase.ts    # Supabase client initialization
  │   ├── types.ts       # Application type definitions
  │   └── stats.ts       # Statistics calculations
  ├── hooks/             # Custom React hooks
  ├── pages/             # Page-level components (if applicable)
  ├── App.tsx            # Main app component with routing logic
  ├── main.tsx           # Entry point
  └── index.css          # Global styles
```

---

## 3. Routing Architecture

**Type**: State-based routing (no routing library)

The application uses a `view` state variable in `App.tsx` that switches between screens:

```typescript
type View =
  | 'auth'                  // Authentication screen
  | 'create'                // Create new session
  | 'join'                  // Join existing session
  | 'lobby'                 // Session lobby
  | 'dashboard'             // Match logging dashboard
  | 'groups'                // Groups list
  | 'group-detail'          // Group dashboard
  | 'group-session-lobby'   // Group session lobby
  | 'invites'               // Group invites
```

### Protection Pattern
```typescript
// Example from App.tsx (lines 149-181)
if (view === 'groups') {
  if (!user) {
    setView('auth')
    return null
  }
  return <GroupsList ... />
}
```

---

## 4. Design System

### Color Palette (Neon/Brutalist Theme)
- **Neon Green**: `#00FF94` (primary accent)
- **Neon Pink**: `#FF2E97` (danger/secondary)
- **Neon Yellow**: `#FFD600` (warning)
- **Primary Background**: `#0A0E27`
- **Secondary Background**: `#1A1F3A`
- **Card Background**: `#151930`
- **Border**: `#2D3350`

### Typography
- **Display Font**: `Bungee` (bold headers)
- **Body Font**: `Outfit` (normal text)
- **Monospace Font**: `Share Tech Mono` (forms, stats)

### Shadow Effects (Brutalist Style)
- `shadow-brutal` - Default 8px offset
- `shadow-brutal-sm` - Smaller 4px offset
- `shadow-brutal-neon-*` - Color-tinted shadows

---

## 5. UI Components (`src/components/ui/`)

### Button.tsx
Reusable button with variants:
- **Variants**: `primary`, `secondary`, `danger`, `ghost`
- **Sizes**: `sm`, `md`, `lg`
- **Features**: Loading states, disabled states, press feedback animation

### Card.tsx
Container component with:
- **Variants**: `default`, `neon-green`, `neon-pink`, `neon-yellow`
- **Padding**: 6 units, border-4, rounded corners

### Input.tsx
Form input with:
- Label support
- Error message display
- Focus styling (neon-green border)
- Placeholder styling

### Select.tsx
Dropdown select with:
- Label support
- Error display
- Options array format: `{ value, label }`

### Table.tsx
Compound component system:
- `Table.Header`, `Table.Body`, `Table.Row`, `Table.Head`, `Table.Cell`
- Scrollable on mobile
- Hover effects on rows
- Header styling with neon-green text

### Tabs.tsx
Tab navigation with:
- Context-based active state management
- `TabsList`, `TabsTrigger`, `TabsContent` sub-components
- Active state styling (neon-green background)

### Badge.tsx
Status badge with variants:
- `success`, `warning`, `danger`, `info`, `default`

### PageLayout.tsx
Main page wrapper with:
- Optional header with max-width container
- Main content area
- Z-index layering

---

## 6. Component Patterns

### Pattern 1: Feature-Based Organization
- Components grouped by feature folder (groups, matches, session, auth)
- Index files export main components for easy imports
- Related utilities in `lib/api/` folder

### Pattern 2: Context-Based State Management
- **AuthContext** - User authentication state, profile, signOut
- **SessionContext** - Active session, players, joining/leaving
- QueryClient from TanStack React Query for server state

### Pattern 3: Props Structure
```typescript
interface ComponentProps {
  // Required props
  data: Data
  // Optional callbacks
  onSuccess?: () => void
  onBack?: () => void
  onNavigateToSession?: (sessionId: string) => void
}
```

### Pattern 4: Error Handling
```typescript
try {
  // API call
  const result = await apiFunction()
  toast.success('Success message')
  onSuccess?.()
} catch (error: any) {
  toast.error(error?.message || 'Default error')
} finally {
  setLoading(false)
}
```

### Pattern 5: Form Pattern
```typescript
const [field, setField] = useState('')
const [loading, setLoading] = useState(false)

function validateForm(): string | null {
  // Validation logic
  return null // or error message
}

async function handleSubmit(e: FormEvent) {
  e.preventDefault()
  const error = validateForm()
  if (error) {
    toast.error(error)
    return
  }
  // Submit logic
}
```

---

## 7. Example Component Structure

From `CreateSessionForm.tsx`:

```typescript
interface CreateSessionFormProps {
  onSuccess?: () => void
}

export default function CreateSessionForm({ onSuccess }: CreateSessionFormProps) {
  const { createSession } = useSession()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      const session = await createSession()
      toast.success('Session created!')
      onSuccess?.()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="neon-green" className="max-w-md mx-auto">
      <Button onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating...' : 'Create Session'}
      </Button>
    </Card>
  )
}
```

---

## 8. Development Workflow

### Available Scripts
```bash
npm run dev      # Start dev server (Vite)
npm run build    # Production build (TypeScript + Vite)
npm run lint     # ESLint (strict)
npm run preview  # Preview production build
```

### Package Management
- **Manager**: npm (using package-lock.json)
- **TypeScript**: Strict mode with no unused variables/parameters allowed

---

# Backend & Data Layer

## 1. Database Schema

### Core Tables

#### profiles
User profiles & metadata
- `id` (UUID, FK to auth.users)
- `display_name` (TEXT)
- `username` (TEXT, unique)
- `email` (TEXT)
- `is_admin` (BOOLEAN, default false)
- `avatar_url` (TEXT)
- `bio` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### sessions
Game sessions (ad-hoc and group)
- `id` (UUID)
- `initiator_user_id` (UUID, FK to profiles)
- `co_logger_player_id` (UUID, nullable)
- `join_code` (TEXT, unique, 6 chars)
- `status` (TEXT: active/ended/expired)
- `group_id` (UUID, nullable, FK to groups)
- `session_type` (TEXT: adhoc/group)
- `expires_at` (TIMESTAMPTZ, +10 hours)
- `created_at` (TIMESTAMPTZ)

#### session_players
Players in each session
- `id` (UUID)
- `session_id` (UUID, FK to sessions)
- `profile_id` (UUID, nullable, FK to profiles)
- `display_name` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### matches
Match records with scores
- `id` (UUID)
- `session_id` (UUID, FK to sessions)
- `logged_by_user_id` (UUID, FK to profiles)
- `team_a_player_ids` (UUID[], exactly 2)
- `team_b_player_ids` (UUID[], 1-2)
- `team_a_goals` (INTEGER)
- `team_b_goals` (INTEGER)
- `team_a_club` (TEXT)
- `team_b_club` (TEXT)
- `played_at` (TIMESTAMPTZ)

#### player_stats
Individual player statistics
- `id` (UUID)
- `session_id` (UUID, FK to sessions)
- `session_player_id` (UUID, FK to session_players)
- `mp`, `w`, `d`, `l` (INTEGER)
- `gf`, `ga`, `gd` (INTEGER)
- `pts` (INTEGER)
- **Unique constraint**: (session_id, session_player_id)

#### pair_stats
Pair partnership statistics
- `id` (UUID)
- `session_id` (UUID, FK to sessions)
- `session_player_id_1` (UUID, FK to session_players)
- `session_player_id_2` (UUID, FK to session_players)
- `label` (TEXT, e.g., "Ahmed & Salman")
- Stats fields (same as player_stats)
- **Constraint**: session_player_id_1 < session_player_id_2 (ordered pairs)
- **Unique constraint**: (session_id, session_player_id_1, session_player_id_2)

#### groups
Group/team management
- `id` (UUID)
- `name` (TEXT)
- `description` (TEXT)
- `created_by_user_id` (UUID, FK to profiles)
- `avatar_url` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### group_members
Group membership
- `id` (UUID)
- `group_id` (UUID, FK to groups)
- `user_id` (UUID, FK to profiles)
- `role` (TEXT: admin/member)
- `joined_at` (TIMESTAMPTZ)

#### group_invites
Group invitations
- `id` (UUID)
- `group_id` (UUID, FK to groups)
- `inviter_user_id` (UUID, FK to profiles)
- `invitee_user_id` (UUID, FK to profiles)
- `status` (TEXT: pending/accepted/declined)
- `created_at` (TIMESTAMPTZ)
- `responded_at` (TIMESTAMPTZ)

### Key Indexes
- `idx_sessions_join_code` - Fast code lookup
- `idx_sessions_status` - Status filtering
- `idx_matches_session_id`, `idx_matches_played_at`
- `idx_player_stats_leaderboard` (session_id, pts DESC, gd DESC, gf DESC)
- `idx_pair_stats_leaderboard` (session_id, pts DESC, gd DESC, gf DESC)

### Schema Files
- **Main Schema**: `supabase-schema.sql`
- **Migration**: `supabase/migrations/20251129_phase7_groups_and_social.sql`
- **SQL Fixes**: `SQL_files/` (24+ files with RLS policies and fixes)

---

## 2. Authentication & Authorization

### Authentication
**Type**: Supabase Auth (Magic Link Email)
**Location**: `src/lib/auth/auth.ts`

**Key Features**:
- Email-based authentication with magic link flow
- Username authentication (lookup email from profiles.username, then sign in)
- Password validation via `validatePassword()`
- Session persistence using localStorage with key `'2v2-kickoff-auth'`
- Auto-refresh tokens enabled
- Detect session from URL for magic link verification

**Auth Functions**:
```typescript
signUp(data: { username, email, password, displayName })
login(identifier: string, password: string) // username or email
logout()
```

### Authorization

**Admin Check**:
- `profiles.is_admin` boolean column (defaults to false)
- Access via `useAuth()` hook: `user.profile.is_admin`
- Admin route protection: Check before rendering admin panels

### Row Level Security (RLS) Policies

**Profiles**:
- SELECT: Users can view all profiles
- INSERT: Users can only insert their own profile (auth.uid() = id)
- UPDATE: Users can only update their own profile

**Sessions**:
- SELECT: Anyone can view sessions
- INSERT: Only authenticated users can create (auth.uid() = initiator_user_id)
- UPDATE: Only initiators can update

**Matches**:
- SELECT: Anyone can view
- INSERT/UPDATE/DELETE: Only initiators and co-loggers (session must be active)

**Groups**:
- SELECT: Only members of the group can view
- INSERT: Any authenticated user can create
- UPDATE/DELETE: Only group admins

**Stats Tables**:
- SELECT: Anyone can view
- INSERT/UPDATE/DELETE: System can manage (permissive WITH CHECK true)

---

## 3. API/Data Fetching Architecture

### API Functions Location
- **Main API**: `src/lib/api/groups.ts` (comprehensive groups/sessions/leaderboards API)
- **Auth**: `src/lib/auth/auth.ts`
- **Stats**: `src/lib/stats.ts`
- **Session Utils**: `src/lib/sessionUtils.ts`
- **Types**: `src/lib/types.ts`
- **DB Types**: `src/lib/database.types.ts` (auto-generated from Supabase)

### Data Fetching Pattern

**Type**: Direct Supabase client calls (no React Query for data fetching in core logic)

**Standard Pattern**:
```typescript
export async function apiFunction() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('table_name')
    .select('columns, relations(*)')
    .eq('filter_col', value)

  if (error) throw error
  return data
}
```

### Key API Functions (`src/lib/api/groups.ts`)

**Groups CRUD**:
- `createGroup(data)` - Create new group
- `getUserGroups(userId)` - Get user's groups with relations
- `getGroupDetails(groupId)` - Get group with members + profiles
- `updateGroup(groupId, data)` - Update group name/description
- `deleteGroup(groupId)` - Delete group

**Group Members**:
- `getGroupMembers(groupId)` - Get members with profile details
- `removeMemberFromGroup(groupId, userId)`
- `promoteMemberToAdmin(groupId, userId)`
- `leaveGroup(groupId)`

**Group Invites**:
- `searchUsersByUsername(query)` - ilike search
- `inviteUserToGroup(data)`
- `getUserInvites(userId)` - Pending invites with group + inviter details
- `getPendingInvitesForGroup(groupId)`
- `respondToInvite(inviteId, accept)`
- `cancelInvite(inviteId)`

**Group Sessions**:
- `createGroupSession(data)`
- `getGroupSessions(groupId, status?)`
- `getActiveGroupSessions(groupId)` - With player count
- `joinGroupSession(sessionId, groupId)` - Validates membership

**Group Leaderboards**:
- `getGroupAggregatePlayerStats(groupId)` - Aggregates across all sessions
- `getGroupAggregatePairStats(groupId)` - Same but for pairs
- `getGroupSessionBreakdown(groupId)` - Leaderboard per session

**Admin/Maintenance**:
- `cleanupExpiredSessions()` - Calls RPC `cleanup_expired_adhoc_sessions`
- `validateGroupMembership(userId, groupId): boolean`
- `getUserGroupRole(userId, groupId): 'admin' | 'member' | null`

---

## 4. Statistics Calculation (`src/lib/stats.ts`)

### Core Functions

```typescript
// Get match result for a team
getMatchResult(goalsFor, goalsAgainst): 'win' | 'draw' | 'loss'

// Get points for result
getPointsForResult(result): number // 3/1/0

// Calculate player stats from matches
calculatePlayerStats(playerId, matches): TeamStats

// Calculate pair stats from matches
calculatePairStats(playerId1, playerId2, matches): TeamStats

// Sort by leaderboard criteria
sortByLeaderboard<T>(items): T[] // by pts→gd→gf→name
```

### Stats Recalculation

**Core Function**: `recalculateSessionStats(sessionId)`
- Fetches all matches and players
- Calculates player stats for each player
- Calculates pair stats for all pairs that played together
- Deletes old stats and inserts new ones
- Called after each match change

### Stats Calculation Flow
1. Match inserted/updated/deleted via RLS-protected API
2. `recalculateSessionStats(sessionId)` called manually
3. Stats updated in `player_stats` and `pair_stats` tables
4. Clients see updates via manual refresh

---

## 5. Supabase Client Setup

**File**: `src/lib/supabase.ts`

```typescript
const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: window.localStorage,
    storageKey: '2v2-kickoff-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

---

## 6. Context-Based State Management

### AuthContext (`src/contexts/AuthContext.tsx`)
Manages:
- User authentication state
- User profile data (including `is_admin` flag)
- Session loading state
- `signOut()` function

**Access Pattern**:
```typescript
const { user, loading, signOut } = useAuth()
const isAdmin = user?.profile?.is_admin
```

### SessionContext (`src/contexts/SessionContext.tsx`)
Manages:
- Active session state
- Session operations (create, join, leave)
- Session players
- Session loading state

---

# Quick Reference

## Critical Files for New Features

**Routing & Main App**:
- `src/App.tsx` - State-based routing, view switching

**Authentication**:
- `src/contexts/AuthContext.tsx` - Auth state, admin check
- `src/lib/auth/auth.ts` - Auth functions

**API Patterns**:
- `src/lib/api/groups.ts` - Comprehensive API example (628 lines)
- `src/lib/stats.ts` - Stats calculation engine

**UI Components**:
- `src/components/ui/` - All reusable UI components

**Database**:
- `supabase-schema.sql` - Main schema
- `src/lib/database.types.ts` - Auto-generated types

**Example Components**:
- `src/components/groups/GroupDashboard.tsx` - Tab-based layout, admin checks
- `src/components/leaderboards/PlayerLeaderboard.tsx` - Leaderboard table

---

## Common Patterns Quick Reference

### Add New View to App
```typescript
// 1. Add to view type in App.tsx
type View = 'auth' | 'create' | ... | 'new-view'

// 2. Add handler
if (view === 'new-view') {
  if (!user) {
    setView('auth')
    return null
  }
  return <NewViewComponent onBack={() => setView('auth')} />
}
```

### Create New API Function
```typescript
export async function newApiFunction() {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('table')
    .select('*')

  if (error) throw error
  return data
}
```

### Create New Component
```typescript
interface NewComponentProps {
  data: Data
  onSuccess?: () => void
}

export default function NewComponent({ data, onSuccess }: NewComponentProps) {
  const [loading, setLoading] = useState(false)

  async function handleAction() {
    setLoading(true)
    try {
      await apiCall()
      toast.success('Success!')
      onSuccess?.()
    } catch (error: any) {
      toast.error(error?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="neon-green">
      <Button onClick={handleAction} disabled={loading}>
        {loading ? 'Loading...' : 'Action'}
      </Button>
    </Card>
  )
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-30
**Exploration Token Cost:** 66,352 tokens (~33% of budget)
