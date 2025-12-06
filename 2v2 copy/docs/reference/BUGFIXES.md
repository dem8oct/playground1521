# Bug Fixes Applied - 2025-11-28

## Issues Fixed

### 1. ✅ Session Auto-Loading Bug
**Problem:** App automatically loaded ANY active session from database on startup, causing users to see random sessions they didn't create or join.

**Solution:**
- Changed session loading to only check localStorage for session ID first
- Only loads sessions that user explicitly created or joined
- Added `2v2-kickoff-session` localStorage key to track user's current session
- Store session ID in localStorage when creating or joining sessions
- Clear localStorage when ending or leaving sessions

**Files Modified:**
- `src/contexts/SessionContext.tsx` - Modified `loadActiveSession()` to check localStorage first, added localStorage management to all session operations

**Code Changes:**
```typescript
// Before: Loaded ANY active session
const { data } = await supabase.from('sessions').select('*').eq('status', 'active').maybeSingle()

// After: Only load user's stored session
const storedSessionId = localStorage.getItem('2v2-kickoff-session')
if (storedSessionId) {
  const { data } = await supabase.from('sessions').select('*').eq('id', storedSessionId).eq('status', 'active').maybeSingle()
}
```

---

### 2. ✅ Sign Out Not Clearing Session
**Problem:** Clicking "Sign Out" would clear auth but leave the session active in localStorage, causing the app to try loading a stale session on refresh and getting stuck on "Loading...".

**Solution:**
- Added `leaveSession()` call before `signOut()` in all sign-out handlers
- Clears both auth state AND session state on sign out
- Resets view to 'auth' screen
- Prevents stuck loading state on page refresh after sign out

**Files Modified:**
- `src/App.tsx` - Modified `handleSignOut()` to call `leaveSession()` first
- `src/components/session/SessionLobby.tsx` - Updated sign out handler

**Impact:** Users can now sign out cleanly without getting stuck on loading screens.

---

### 3. ✅ Join as Guest Button Not Working
**Problem:** "Join as Guest" button clicked successfully but didn't navigate to join form because routing logic checked `if (!user)` before checking `if (view === 'join')`.

**Solution:**
- Reordered routing logic to check `view === 'join'` BEFORE checking `if (!user)`
- Allows guests (unauthenticated users) to access join form
- Moved join view handling to top of routing logic

**Files Modified:**
- `src/App.tsx` - Reordered view routing logic (lines 95-112)

**Code Changes:**
```typescript
// Before: Guest couldn't reach join form
if (!user) return <AuthScreen />
if (view === 'join') return <JoinForm />  // Never reached!

// After: Join form accessible to guests
if (view === 'join') return <JoinForm />  // Checked first
if (!user) return <AuthScreen />
```

---

### 4. ✅ Leave Session Button Added
**Problem:** No way for guests or non-initiators to exit a session without manually clearing localStorage or ending the entire session.

**Solution:**
- Added `leaveSession()` function to SessionContext (client-side only, doesn't end session in DB)
- Added "Leave Session" button for non-initiators in SessionLobby header
- Initiators still see "End Session" button (permanently ends for everyone)
- Both buttons clear localStorage properly

**Files Modified:**
- `src/contexts/SessionContext.tsx` - Added `leaveSession()` function
- `src/components/session/SessionLobby.tsx` - Added conditional button rendering

**UX Improvement:** Non-initiators can now cleanly exit sessions without affecting other users.

---

### 5. ✅ Session Creation Appearing to Hang
**Problem:** Session creation appeared to hang with "Creating..." message indefinitely, but database insert was actually succeeding (HTTP 201).

**Root Cause:** No timeout on database operations, making it unclear if requests were hanging or just slow. Extensive debugging revealed inserts were working but UI feedback was poor.

**Solution:**
- Added comprehensive logging throughout session creation flow
- Added 10-second timeout to prevent infinite waiting on database operations
- Verified Supabase client auth token presence before insert
- Added detailed response logging to diagnose issues
- Confirmed RLS policies working correctly

**Files Modified:**
- `src/contexts/SessionContext.tsx` - Added timeout wrapper and extensive logging
- `src/components/session/CreateSessionForm.tsx` - Added flow logging and better error messages

**Technical Details:**
```typescript
const insertPromise = supabase.from('sessions').insert(data).select().single()
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 10000)
)
const result = await Promise.race([insertPromise, timeoutPromise])
```

**Outcome:** Session creation now completes successfully with proper UI feedback (success toast + navigation to lobby).

---

### 6. ✅ Infinite Loading State After Sign Out or Session End
**Problem:** After signing out or ending a session, refreshing the page would show "Loading... Initializing session" indefinitely. Both AuthContext and SessionContext could hang without timeout.

**Solution:**
- Added 5-second safety timeout to both AuthContext and SessionContext
- Enhanced error handling in session loading with automatic localStorage cleanup
- Added comprehensive logging to diagnose which context is hanging
- Improved loading state management with timeout guards

**Files Modified:**
- `src/contexts/SessionContext.tsx` - Added 5-second timeout and better error handling
- `src/contexts/AuthContext.tsx` - Added 5-second timeout and catch blocks

**Code Changes:**
```typescript
// Added to both contexts
let timeoutId = setTimeout(() => {
  if (mounted) {
    console.warn('Loading timed out after 5 seconds')
    setLoading(false)
  }
}, 5000)

// Cleanup in finally block
finally {
  if (mounted) {
    clearTimeout(timeoutId)
    setLoading(false)
  }
}
```

**Impact:** App now always exits loading state within 5 seconds maximum, preventing infinite loading screens.

---

## New Features Added

### 1. Sign Out Button on Main Menu
Added "Sign Out" button to the "What would you like to do?" screen for logged-in users.

**Files Modified:**
- `src/App.tsx` - Added header with Sign Out button to default view

---

## Documentation Added

### 1. Session Management Pattern Guide
Created comprehensive guide explaining the localStorage-based session management pattern to prevent auto-loading bugs.

**Files Created:**
- `SESSION_MANAGEMENT_PATTERN.md`

### 2. Debug Queries Reference
Created SQL queries for debugging common Supabase issues (profiles, sessions, RLS policies).

**Files Created:**
- `DEBUG_QUERIES.md`

### 3. Bug Fixes Log
This file - documents all fixes applied during debugging session.

**Files Created:**
- `BUGFIXES.md`

---

## Testing Checklist

### Core Authentication & Session Management
- [x] Sign in with magic link works
- [x] Sign out clears both auth and session properly
- [x] Page refresh maintains auth state correctly
- [x] Page refresh after sign out doesn't get stuck on loading
- [x] Auth loading completes within 5 seconds (or times out gracefully)

### Session Creation & Navigation
- [x] Create session works and navigates to lobby
- [x] Session creation shows success toast with join code
- [x] Session stored in localStorage on creation
- [x] Session creation completes within reasonable time (<2 seconds typically)

### Session Joining
- [x] "Join as Guest" button navigates to join form
- [x] Join form accessible without authentication
- [ ] Join existing session with valid code works (needs second user to test)
- [ ] Join form validation for invalid codes (needs testing)

### Session Lobby
- [x] Leave session button works for non-initiators/guests
- [x] End session button works for initiators
- [x] Session lobby displays join code correctly
- [x] Page refresh maintains active session correctly
- [x] Page refresh after ending session clears properly
- [x] Session loading completes within 5 seconds (or times out gracefully)
- [ ] Co-logger assignment works (needs players to test)
- [ ] Add/remove players works (needs testing)

### Edge Cases
- [x] Loading states timeout after 5 seconds maximum
- [x] Stale session IDs in localStorage get cleaned up automatically
- [x] Sign out from lobby clears session and returns to auth screen
- [x] Multiple sign in/out cycles work without issues

---

## Known Issues / TODO

### High Priority - Core Features Not Yet Implemented
1. **Match Logging Form** (Phase 5)
   - Team selection dropdowns
   - Goals input
   - Match validation and submission
   - Match history display

2. **Leaderboards** (Phase 6)
   - Player stats calculation and persistence
   - Pair stats calculation and persistence
   - Player leaderboard component
   - Pair leaderboard component

3. **Realtime Subscriptions** (Phase 7)
   - Subscribe to match updates
   - Subscribe to stats updates
   - Subscribe to player list updates
   - Auto-refresh on changes

### Medium Priority - UX Improvements
4. Session expiration auto-detection (currently requires manual refresh)
5. "Rejoin session" flow if user accidentally leaves
6. Better error messages for network failures (currently generic)
7. Loading skeletons instead of "Loading..." text
8. Confirmation dialogs for destructive actions (already added for End/Leave session)

### Low Priority - Code Quality
9. Remove excessive debug console.log statements once app is stable
10. Consider adding session history (view past sessions)
11. Add proper error boundaries for React component errors
12. Consider analytics/telemetry for production debugging

### Tech Debt
13. Consider migrating from manual localStorage to React Query for session state
14. Evaluate if timeout values (5s, 10s) need tuning based on real usage
15. Add unit tests for critical flows (auth, session creation, etc.)

---

## Performance Notes

### Measured Timings
- **Session creation:** ~200-500ms (Supabase insert + localStorage write)
- **Session loading on startup:** ~100-300ms (localStorage check + DB query)
- **Auth check:** ~100-200ms (Supabase auth.getSession() + profile lookup)
- **Sign out:** <100ms (localStorage clear + auth sign out)

### Timeout Guards
- **Auth loading timeout:** 5 seconds (prevents infinite loading)
- **Session loading timeout:** 5 seconds (prevents infinite loading)
- **Session creation timeout:** 10 seconds (prevents hung database operations)

### Observations
- All normal operations complete within 500ms
- Timeouts rarely trigger in normal operation
- Loading states are now bounded and predictable
- No performance bottlenecks identified

All operations are well within acceptable UX limits (<1 second for most actions).

---

## Lessons Learned for Future Projects

### 1. Session Management Pattern
**Lesson:** Never auto-load "any active" record from a database without explicit user context.

**Why It Matters:** Loading arbitrary active sessions causes users to see data they didn't create or access, creating confusion and security concerns.

**Best Practice:**
```typescript
// ❌ BAD: Loads any active session
const { data } = await db.from('sessions').select('*').eq('status', 'active').single()

// ✅ GOOD: Use localStorage to track user's specific session
const sessionId = localStorage.getItem('app-session-id')
if (sessionId) {
  const { data } = await db.from('sessions').select('*').eq('id', sessionId).single()
}
```

**Application:** Use localStorage, URL params, or a user-session join table to explicitly track which records belong to which user.

**See Also:** `SESSION_MANAGEMENT_PATTERN.md`

---

### 2. Always Add Timeout Guards to Async Operations
**Lesson:** Async operations (database queries, API calls) can hang indefinitely without timeout protection.

**Why It Matters:** Hung operations create terrible UX (infinite loading spinners) and make debugging impossible.

**Best Practice:**
```typescript
// ✅ Add timeout to any async operation that could hang
const operation = db.from('table').select()
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
)
const result = await Promise.race([operation, timeout])
```

**Recommended Timeouts:**
- Auth checks: 5 seconds
- Data loading: 5 seconds
- Data mutations: 10 seconds
- File uploads: 30-60 seconds

**Application:** Add timeouts to ALL database queries, API calls, and external service calls.

---

### 3. Clear Related State When Signing Out
**Lesson:** Sign out should clear ALL user-related state, not just auth tokens.

**Why It Matters:** Stale session data in localStorage causes loading loops and confusion after sign out.

**Best Practice:**
```typescript
async function signOut() {
  // ✅ Clear all related state
  await auth.signOut()
  localStorage.removeItem('session-id')
  localStorage.removeItem('user-preferences')
  // Clear React state
  setUser(null)
  setSession(null)
  // Reset navigation
  navigate('/login')
}
```

**Application:** Document all localStorage keys used by your app and clear them all on sign out.

---

### 4. Order Routing Logic Carefully
**Lesson:** The order of conditional checks in routing logic matters - early returns prevent later conditions from being evaluated.

**Why It Matters:** Incorrect order can make certain views inaccessible (e.g., guest users unable to reach public pages).

**Best Practice:**
```typescript
// ✅ GOOD: Most specific conditions first
if (view === 'public-page') return <PublicPage />  // Check view first
if (!user) return <Login />                         // Then check auth
if (view === 'settings') return <Settings />        // Then other views
return <Dashboard />                                 // Default

// ❌ BAD: Auth check blocks public views
if (!user) return <Login />                         // Blocks everything!
if (view === 'public-page') return <PublicPage />  // Never reached
```

**Application:** Always check specific routes/views BEFORE checking authentication state.

---

### 5. Add Comprehensive Logging During Development
**Lesson:** Strategic console logging is invaluable for debugging async flows and state changes.

**Why It Matters:** Silent failures are the hardest to debug. Logging reveals exactly where code is hanging or failing.

**Best Practice:**
```typescript
async function complexOperation() {
  console.log('Starting operation...')

  try {
    console.log('Step 1: Fetching data')
    const data = await fetchData()
    console.log('Step 1 complete:', data)

    console.log('Step 2: Processing')
    const result = await process(data)
    console.log('Step 2 complete:', result)

    return result
  } catch (error) {
    console.error('Operation failed at:', error)
    throw error
  }
}
```

**Cleanup Strategy:**
- Keep logs during development and testing
- Remove or convert to debug-only in production
- Consider using a logging library with log levels

**Application:** Add logs at every async boundary and state transition during development.

---

### 6. Handle Loading States Defensively
**Lesson:** Loading states must ALWAYS resolve, even on errors or timeouts.

**Why It Matters:** Infinite loading states trap users and make the app unusable.

**Best Practice:**
```typescript
useEffect(() => {
  let mounted = true
  let timeoutId

  async function load() {
    try {
      // Safety timeout
      timeoutId = setTimeout(() => {
        if (mounted) setLoading(false)
      }, 5000)

      const data = await fetchData()
      if (mounted) setData(data)
    } catch (error) {
      console.error(error)
    } finally {
      if (mounted) {
        clearTimeout(timeoutId)
        setLoading(false)  // ALWAYS clear loading
      }
    }
  }

  load()

  return () => {
    mounted = false
    clearTimeout(timeoutId)
  }
}, [])
```

**Application:** Every loading state should have a timeout guard and MUST be cleared in finally blocks.

---

### 7. Test Edge Cases: Sign In/Out Cycles
**Lesson:** Repeatedly signing in and out reveals state management bugs that single-session testing misses.

**Why It Matters:** State cleanup bugs often only appear after multiple sign in/out cycles.

**Testing Checklist:**
- ✅ Sign in → Sign out → Sign in again (does it work?)
- ✅ Sign in → Create session → Sign out → Refresh (stuck loading?)
- ✅ Sign out with active session (is session cleared?)
- ✅ Refresh after sign out (returns to login screen?)

**Application:** Always test authentication flows multiple times in sequence.

---

### 8. Clean Up localStorage Automatically
**Lesson:** localStorage can accumulate stale data. Implement automatic cleanup for invalid entries.

**Why It Matters:** Stale data causes bugs that are hard to reproduce and diagnose.

**Best Practice:**
```typescript
async function loadSession() {
  const sessionId = localStorage.getItem('session-id')

  if (sessionId) {
    const session = await db.from('sessions').select('*').eq('id', sessionId).single()

    if (!session || session.status !== 'active') {
      // ✅ Automatically clean up stale data
      localStorage.removeItem('session-id')
      console.log('Cleaned up stale session ID')
    } else {
      setSession(session)
    }
  }
}
```

**Application:** Validate localStorage data against the source of truth and clean up invalid entries.

---

### 9. Use Descriptive localStorage Keys
**Lesson:** Generic localStorage keys cause collisions between apps and environments.

**Why It Matters:** Key collisions can cause data corruption or unexpected behavior.

**Best Practice:**
```typescript
// ❌ BAD: Generic keys
localStorage.setItem('session', sessionId)
localStorage.setItem('user', userId)

// ✅ GOOD: Namespaced, descriptive keys
localStorage.setItem('myapp-session-id', sessionId)
localStorage.setItem('myapp-user-id', userId)
localStorage.setItem('myapp-auth-token', token)
```

**Naming Convention:** `{app-name}-{data-type}-{qualifier}`

**Application:** Always prefix localStorage keys with your app name.

---

### 10. Document Database Operations in Debug Queries
**Lesson:** Keep a reference file of SQL queries for common debugging tasks.

**Why It Matters:** Speeds up debugging when you can quickly check database state without writing queries from scratch.

**Best Practice:**
- Create a `DEBUG_QUERIES.md` file
- Include queries for checking data state
- Include queries for manually fixing common issues
- Include queries for testing RLS policies

**Application:** Build this file incrementally as you encounter and fix bugs.

**See Also:** `DEBUG_QUERIES.md`

---

### 11. Supabase-Specific: RLS Policies Can Fail Silently
**Lesson:** Row Level Security (RLS) policy failures don't always return clear error messages - sometimes operations just hang or return empty results.

**Why It Matters:** Silent RLS failures are extremely hard to debug.

**Debugging Strategy:**
1. Test database operations directly in SQL Editor (bypasses RLS)
2. If SQL works but app doesn't, it's an RLS issue
3. Check `auth.uid()` is returning the expected user ID
4. Verify policy conditions match your exact use case

**Best Practice:**
```sql
-- Always test RLS policies explicitly
SELECT auth.uid(); -- Verify user context
SELECT * FROM table WHERE id = 'known-id'; -- Test read
INSERT INTO table (...) VALUES (...) RETURNING *; -- Test write
```

**Application:** When Supabase operations hang, test in SQL Editor first to isolate RLS vs code issues.

---

### 12. State Management: Mounted Flags Prevent Race Conditions
**Lesson:** Use `mounted` flags in useEffect to prevent state updates on unmounted components.

**Why It Matters:** Prevents React warnings and potential memory leaks.

**Best Practice:**
```typescript
useEffect(() => {
  let mounted = true

  async function load() {
    const data = await fetch()
    if (mounted) {  // ✅ Only update if still mounted
      setState(data)
    }
  }

  load()

  return () => {
    mounted = false  // ✅ Cleanup
  }
}, [])
```

**Application:** Always use mounted flags in useEffect hooks with async operations.

---

## Key Takeaways Summary

1. **Never auto-load arbitrary data** - Always use explicit user context (localStorage, URL, join tables)
2. **Add timeouts to all async operations** - Prevent infinite loading states
3. **Clear all related state on sign out** - Not just auth tokens
4. **Order routing logic carefully** - Most specific first, auth checks later
5. **Log extensively during development** - Remove or gate with env vars in production
6. **Loading states must always resolve** - Use finally blocks and timeouts
7. **Test sign in/out cycles** - Reveals state cleanup bugs
8. **Auto-clean stale localStorage** - Validate and remove invalid data
9. **Use namespaced localStorage keys** - Prevent collisions
10. **Document debug queries** - Speed up troubleshooting
11. **Test RLS policies in SQL first** - Isolate policy issues from code issues
12. **Use mounted flags in useEffect** - Prevent race conditions

---

## Recommended Reading

- `SESSION_MANAGEMENT_PATTERN.md` - Deep dive on session management anti-patterns
- `DEBUG_QUERIES.md` - SQL queries for debugging Supabase issues
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [React useEffect Cleanup](https://react.dev/learn/synchronizing-with-effects#step-3-add-cleanup-if-needed)
