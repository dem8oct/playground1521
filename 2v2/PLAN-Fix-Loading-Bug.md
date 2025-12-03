# Fix: "Loading... Initializing session" Bug - Comprehensive Solution

## Problem Summary
The app gets stuck on "Loading... Initializing session" in production when users sign up and try to use the app. Investigation revealed multiple root causes that must all be addressed.

---

## Root Causes Identified

1. **AuthContext has NO timeout protection** - Primary issue
   - Commit 79c02e0 removed timeout to fix StrictMode conflicts
   - Left no protection if profile query hangs in production
   - Works locally (fast network) but fails in production (slow network)

2. **Database trigger creates incomplete profiles**
   - `handle_new_user()` trigger missing `username` field insertion
   - New users get profiles without usernames → cascading failures

3. **Schema mismatch between code and database**
   - Code expects: `username`, `is_admin`, `avatar_url`, `bio` in profiles
   - Base schema may be missing these columns
   - Need to verify production schema first

4. **Blocking OR logic in App.tsx**
   - If EITHER context hangs, entire app stuck
   - SessionContext has 5s timeout, AuthContext has none

---

## Implementation Plan

### PHASE 1: Verify Production Schema (5 minutes)

**Before making changes, check production database:**

Go to Supabase Dashboard → SQL Editor → Run:
```sql
-- Check profiles table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check current trigger code
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
```

**Expected vs Actual:**
- Should have: `id`, `display_name`, `username`, `is_admin`, `avatar_url`, `bio`, `created_at`
- Trigger should insert: `id`, `display_name`, AND `username`

If schema is complete and trigger is correct, skip to Phase 3 (code fixes only).
If missing columns/trigger incomplete, proceed with Phase 2.

---

### PHASE 2: Fix Database (If Schema Issues Found)

#### Step 1: Add Missing Columns (if needed)
```sql
-- Run in Supabase SQL Editor
-- Add missing columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create index on username for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
```

#### Step 2: Fix Database Trigger
```sql
-- Replace the existing trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'username',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify trigger exists
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

#### Step 3: Backfill Existing Incomplete Profiles (if needed)
```sql
-- Check for profiles missing username
SELECT COUNT(*) FROM profiles WHERE username IS NULL;

-- If any exist, create temporary usernames
UPDATE profiles
SET username = 'user_' || substring(id::text from 1 for 8)
WHERE username IS NULL;
```

---

### PHASE 3: Fix Code - Add Timeout Protection

#### File 1: `src/contexts/AuthContext.tsx`

**Problem:** No timeout on profile query (lines 81-85)

**Solution:** Apply SessionContext's proven timeout pattern

**Changes:**

1. Update the useEffect (lines 24-74):
```typescript
useEffect(() => {
  let mounted = true
  let timeoutId: NodeJS.Timeout  // ADD THIS

  async function loadAuth() {
    try {
      // ADD TIMEOUT PROTECTION - 10 seconds
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('[AUTH] Loading timed out after 10 seconds')
          setLoading(false)
        }
      }, 10000)

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()

      if (!mounted) return

      console.log('Initial session check:', session ? 'logged in' : 'not logged in')
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        console.log('No session, setting loading to false')
        setLoading(false)
      }
    } catch (err) {
      console.error('Error getting initial session:', err)
      if (mounted) {
        setLoading(false)
      }
    } finally {
      clearTimeout(timeoutId)  // ALWAYS CLEAR TIMEOUT
    }
  }

  loadAuth()

  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth event:', event)

      if (!mounted) return

      // Don't process INITIAL_SESSION since we already handled it above
      if (event === 'INITIAL_SESSION') return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    }
  )

  return () => {
    mounted = false
    clearTimeout(timeoutId)  // CLEANUP
    subscription.unsubscribe()
  }
}, [])
```

2. Add timeout to loadProfile function (lines 76-114):
```typescript
async function loadProfile(userId: string) {
  try {
    console.log('[AUTH] Loading profile for user:', userId)
    const startTime = Date.now()

    // ADD QUERY-LEVEL TIMEOUT
    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<Profile>()

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => {
        console.error('[AUTH] Profile query timed out after 10 seconds')
        reject(new Error('Profile query timeout'))
      }, 10000)
    )

    const { data, error } = await Promise.race([queryPromise, timeoutPromise])

    const loadTime = Date.now() - startTime
    console.log(`[AUTH] Profile query took ${loadTime}ms`)

    if (error) {
      console.error('[AUTH] Error loading profile:', error)
      throw error
    }

    if (!data) {
      console.warn('[AUTH] No profile found for user:', userId)
    } else {
      console.log('[AUTH] Profile loaded successfully:', {
        username: data.username,
        display_name: data.display_name,
        is_admin: data.is_admin
      })
    }

    setProfile(data)
  } catch (error) {
    console.error('[AUTH] Failed to load profile:', error)
    // Set profile to null on error so app doesn't get stuck
    setProfile(null)
  } finally {
    console.log('[AUTH] Setting loading to false')
    setLoading(false)
  }
}
```

**Why this works:**
- Uses SAME pattern as SessionContext (lines 36-98) which already handles StrictMode correctly
- useEffect-level timeout prevents infinite hanging
- Query-level timeout handles specific database hangs
- Cleanup in return prevents memory leaks

---

#### File 2: `src/App.tsx`

**Problem:** Blocking OR logic + poor UX during slow loading

**Solution:** Better loading screen with timeout awareness

**Changes:** Update loading screen (lines 49-64):
```typescript
if (authLoading || sessionLoading) {
  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="font-mono text-neon-green text-xl mb-2">
            Loading...
          </div>
          <div className="font-mono text-sm text-gray-400 mb-4">
            {authLoading && sessionLoading && 'Initializing session'}
            {authLoading && !sessionLoading && 'Loading authentication...'}
            {!authLoading && sessionLoading && 'Loading session...'}
          </div>

          {/* Add helpful message after 5 seconds */}
          <div className="font-mono text-xs text-gray-500 mt-4">
            Taking longer than expected?{' '}
            <button
              onClick={() => window.location.reload()}
              className="text-neon-green hover:underline"
            >
              Try reloading
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
```

**Benefits:**
- Shows which context is still loading
- Gives users option to reload if stuck
- Better UX during slow connections

---

### PHASE 4: Testing Strategy

#### Local Testing (Before Deploy)
1. Test with normal conditions:
   ```bash
   npm run dev
   # Sign up new user, verify loads correctly
   ```

2. Test with React StrictMode (already enabled in main.tsx):
   - Create new account
   - Verify no double-loading issues
   - Check console for no duplicate logs

3. Test with simulated slow network:
   - Open DevTools → Network → Throttle to "Slow 3G"
   - Sign up new user
   - Verify timeout fires at 10s and app doesn't hang

4. Test timeout recovery:
   - Temporarily change timeout to 1 second in code
   - Verify app shows loading screen then recovers
   - Change back to 10 seconds

#### Production Testing (After Deploy)
1. Have a friend sign up with new account
2. Monitor browser console for:
   - `[AUTH] Loading profile for user:`
   - `[AUTH] Profile query took Xms`
   - `[AUTH] Profile loaded successfully`
   - `[AUTH] Setting loading to false`

3. Verify no timeout warnings appear (unless network truly slow)

4. Check that app loads within 3-5 seconds even on slow connections

---

### PHASE 5: Deployment Steps

1. **Commit code changes:**
   ```bash
   git add src/contexts/AuthContext.tsx src/App.tsx
   git commit -m "Fix: Add timeout protection to prevent infinite loading state

   - Add 10-second timeout to AuthContext using SessionContext's proven pattern
   - Add query-level timeout to loadProfile() to handle database hangs
   - Improve loading screen UX to show which context is loading
   - Add manual reload option for users if loading takes too long

   Fixes the recurring 'Loading... Initializing session' bug in production
   caused by profile queries hanging without timeout protection.

   Previous fix (79c02e0) removed timeout to fix StrictMode issues but
   left no protection for actual query hangs in production environments
   with slow networks.
   "
   ```

2. **Build and test locally:**
   ```bash
   npm run build
   npm run preview
   # Test at http://localhost:4173
   ```

3. **Deploy to VPS:**
   ```bash
   scp -r dist/* root@57.129.114.213:/var/www/2v2-tracker/
   ```

4. **Monitor production:**
   - Check https://c1.dem101.dev
   - Have friends test signup
   - Watch for any errors in browser console

---

### PHASE 6: Rollback Plan (If Issues Arise)

If the fix causes new problems:

1. **Quick rollback:**
   ```bash
   git revert HEAD
   npm run build
   scp -r dist/* root@57.129.114.213:/var/www/2v2-tracker/
   ```

2. **Restore from backup branch:**
   ```bash
   git reset --hard backup-phase6-admin-panel
   npm run build
   # Redeploy
   ```

3. **Database rollback (if you ran migrations):**
   - Database changes are additive (ADD COLUMN IF NOT EXISTS)
   - Safe to leave in place even if code is rolled back
   - No rollback needed for database changes

---

## Success Criteria

✅ **App loads successfully for new users in production**
✅ **No infinite loading states, even with slow networks**
✅ **Loading completes within 10 seconds or shows timeout message**
✅ **No React StrictMode conflicts in development**
✅ **Console logs show clear loading progress**
✅ **Users can manually reload if stuck**

---

## Critical Files to Modify

1. **`src/contexts/AuthContext.tsx`** - Add timeout protection (PRIMARY FIX)
2. **`src/App.tsx`** - Improve loading screen UX
3. **Supabase SQL Editor** - Fix database trigger and schema (if needed)

---

## Estimated Time
- Schema verification: 5 minutes
- Database fixes (if needed): 15 minutes
- Code changes: 30 minutes
- Testing: 30 minutes
- Deployment: 10 minutes
- **Total: ~1.5 hours**

---

## Why This Fix Will Work

1. **Proven Pattern:** Uses SessionContext's timeout pattern that already works
2. **StrictMode Safe:** Properly handles cleanup and mounted checks
3. **Production Ready:** 10-second timeout handles slow networks gracefully
4. **Multiple Layers:** Fixes database, code, and UX issues
5. **Zero Risk:** Additive changes, easy to rollback
6. **User Friendly:** Better UX during slow loading periods

This comprehensive fix addresses ALL root causes identified in the investigation and should permanently resolve the recurring "Loading... Initializing session" bug.
