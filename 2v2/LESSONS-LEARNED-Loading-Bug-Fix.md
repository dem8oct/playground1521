# Lessons Learned: Loading Bug Fix

**Date:** December 4, 2025
**Issue:** "Loading... Initializing session" infinite hang in production
**Branch:** `fix/loading-timeout-protection`
**Commits:** 6bfdde4

---

## Summary

Fixed a critical production bug where users got stuck on "Loading... Initializing session" screen after signup. The issue had multiple root causes that required a layered approach to fix completely.

---

## The Bug

**Symptom:** App stuck on loading screen indefinitely after user signup in production.

**Impact:**
- Users couldn't access the app after signup
- Affected production only (worked fine in development)
- Required manual browser reload to potentially recover

---

## Root Causes Discovered

### 1. Missing Timeout Protection (Primary Issue)
**What happened:**
- Previous fix (commit 79c02e0) removed timeout to fix React StrictMode conflicts
- Left NO protection if profile query hangs in production
- Works locally (fast network) but fails in production (slow network/latency)

**Location:** `src/contexts/AuthContext.tsx` lines 24-92

**Lesson:** Never remove error handling/timeouts without replacing them with equivalent protection.

### 2. Memory Leak from Uncancelled Timeouts
**What happened:**
- Used `Promise.race([queryPromise, timeoutPromise])` to add query timeout
- When query won the race, timeout promise kept running in background
- setTimeout fired 10 seconds later even though query already completed
- Caused false error logs and wasted CPU cycles

**Lesson:** `Promise.race()` doesn't cancel losing promises. Always manually track and clear timeouts/intervals.

**Solution:**
```typescript
let queryTimeoutId: NodeJS.Timeout | undefined

const timeoutPromise = new Promise<never>((_, reject) => {
  queryTimeoutId = setTimeout(() => reject(new Error('Timeout')), 10000)
})

await Promise.race([queryPromise, timeoutPromise])

// CRITICAL: Clear timeout after race completes
if (queryTimeoutId) clearTimeout(queryTimeoutId)
```

### 3. Duplicate Profile Loads
**What happened:**
- Supabase auth fires multiple SIGNED_IN events during signup flow
- Each event triggered `loadProfile()` without checking if already loaded
- Second profile query timed out (possibly due to database lock or rate limiting)

**Location:** `src/contexts/AuthContext.tsx` lines 66-85 (onAuthStateChange listener)

**Lesson:** Always guard against duplicate async operations in event handlers.

**Solution:**
```typescript
const loadingProfileRef = useRef(false)
const currentUserIdRef = useRef<string | null>(null)

async function loadProfile(userId: string) {
  // Prevent duplicate loads
  if (loadingProfileRef.current) {
    console.log('[AUTH] Profile load already in progress, skipping')
    return
  }

  // Skip if already loaded for this user
  if (currentUserIdRef.current === userId && profile) {
    console.log('[AUTH] Profile already loaded for this user, skipping')
    return
  }

  loadingProfileRef.current = true
  try {
    // ... load profile
  } finally {
    loadingProfileRef.current = false
  }
}
```

### 4. Browser-Specific Performance Issues
**What happened:**
- Brave browser showed 100% CPU usage during development
- Chrome had normal CPU usage with same code
- Heating MacBook was due to Brave's engine, not our code

**Lesson:** Test on multiple browsers during development. Performance issues may be browser-specific.

**Recommendation:** Use Chrome or Firefox for development. Test Brave/Safari separately.

---

## Investigation Process

### What Worked Well

1. **Systematic schema verification first**
   - Checked database before assuming code issue
   - Confirmed trigger and schema were correct
   - Eliminated database as root cause early

2. **Reading existing working patterns**
   - Examined `SessionContext.tsx` which had similar timeout logic
   - Copied proven patterns rather than inventing new ones
   - Reduced risk of introducing new bugs

3. **Comprehensive logging**
   - Added `[AUTH]` prefixed logs throughout flow
   - Logged timing (`Profile query took Xms`)
   - Made debugging much easier with detailed console output

4. **Testing in real conditions**
   - User tested in actual browser with signup flow
   - Caught issues that wouldn't appear in happy-path testing
   - Console logs revealed duplicate events

### What Could Be Improved

1. **Should have checked for duplicate events earlier**
   - Multiple SIGNED_IN events are common in auth flows
   - Should have anticipated this pattern
   - Could have saved iteration time

2. **Should have tested Promise.race cleanup**
   - Assumed Promise.race would cancel losing promise
   - Should have verified timeout cleanup immediately
   - Memory leak was discoverable with basic testing

---

## Key Lessons for Future Projects

### 1. Timeout Protection is Non-Negotiable

**Rule:** Every async operation that can hang MUST have timeout protection.

**Pattern:**
```typescript
useEffect(() => {
  let mounted = true
  let timeoutId: NodeJS.Timeout

  async function loadData() {
    try {
      // Overall timeout
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('Loading timed out')
          setLoading(false)
        }
      }, 10000)

      // Do async work...

    } catch (error) {
      // Handle error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  loadData()

  return () => {
    mounted = false
    clearTimeout(timeoutId)
  }
}, [])
```

### 2. Always Clean Up Async Operations

**What to clean up:**
- ✅ setTimeout / setInterval
- ✅ Event listeners
- ✅ Subscriptions
- ✅ AbortControllers for fetch
- ✅ Database connections

**Pattern:**
```typescript
useEffect(() => {
  const timerId = setInterval(...)
  const subscription = supabase.from('table').on(...)

  return () => {
    clearInterval(timerId)
    subscription.unsubscribe()
  }
}, [])
```

### 3. Guard Against Duplicate Operations

**When to use guards:**
- Auth state changes (can fire multiple times)
- User interactions (double-clicks)
- Real-time subscriptions (rapid updates)
- Network retries

**Pattern:**
```typescript
const operationInProgressRef = useRef(false)

async function doOperation() {
  if (operationInProgressRef.current) return

  operationInProgressRef.current = true
  try {
    // Do work
  } finally {
    operationInProgressRef.current = false
  }
}
```

### 4. StrictMode is Your Friend

**Benefits:**
- Catches missing cleanup in useEffect
- Reveals duplicate mounting issues
- Forces proper cleanup patterns

**Don't:** Remove StrictMode to "fix" bugs
**Do:** Fix the underlying cleanup/lifecycle issues

### 5. Promise.race() Requires Manual Cleanup

**Remember:**
- Losing promise keeps running
- Must manually clear timeouts/intervals
- Track IDs and clean up in finally blocks

**Pattern:**
```typescript
let timeoutId: NodeJS.Timeout | undefined

const timeoutPromise = new Promise((_, reject) => {
  timeoutId = setTimeout(() => reject(new Error('Timeout')), 5000)
})

try {
  await Promise.race([actualPromise, timeoutPromise])
} finally {
  // ALWAYS clear timeout
  if (timeoutId) clearTimeout(timeoutId)
}
```

### 6. Add Context-Specific Logging

**Good logging pattern:**
```typescript
console.log('[CONTEXT_NAME] Action starting:', details)
console.log('[CONTEXT_NAME] Action took Xms')
console.log('[CONTEXT_NAME] Action completed successfully')
```

**Benefits:**
- Easy to filter in console
- Shows flow and timing
- Helps debug production issues

### 7. Test Production Conditions

**Don't just test:**
- Happy path
- Local fast network
- Single browser

**Also test:**
- Slow network (Chrome DevTools throttling)
- Multiple rapid operations
- Different browsers (Chrome, Firefox, Brave, Safari)
- React StrictMode enabled
- Production build (not just dev)

### 8. Learn from Existing Patterns

**Before writing new code:**
1. Search codebase for similar patterns
2. Copy proven approaches
3. Understand WHY they work
4. Adapt for your use case

**Example:** We copied SessionContext's timeout pattern because it was proven to work with StrictMode.

### 9. Layer Your Defenses

**Don't rely on single fix:**
- ✅ useEffect-level timeout (10s)
- ✅ Query-level timeout (10s)
- ✅ Duplicate load prevention
- ✅ Error handling
- ✅ User-facing reload button

**Result:** Even if one layer fails, others catch it.

### 10. Browser DevTools Are Essential

**Critical tools:**
- **Console:** See all logs, errors, warnings
- **Network:** Track API calls, timing, duplicates
- **Performance:** CPU usage, memory leaks
- **React DevTools:** Component renders, state changes

**Lesson from Brave issue:** Activity Monitor showed 100% CPU, leading us to identify browser-specific problem.

---

## Implementation Checklist for Future Auth/Loading Features

- [ ] Add timeout protection (both useEffect and query level)
- [ ] Set up proper cleanup in useEffect return
- [ ] Guard against duplicate operations with useRef
- [ ] Clear all timeouts/intervals in finally blocks
- [ ] Add comprehensive logging with context prefix
- [ ] Test with React StrictMode enabled
- [ ] Test with slow network throttling
- [ ] Test in multiple browsers
- [ ] Test production build
- [ ] Add user-facing recovery option (reload button)
- [ ] Verify no memory leaks (uncancelled timers)
- [ ] Check for duplicate event handlers/subscriptions

---

## Code Patterns to Reuse

### Complete Context with Timeout Protection

See `src/contexts/AuthContext.tsx` (final version) for reference implementation including:
- Dual timeout protection (useEffect + query level)
- Proper cleanup patterns
- Duplicate load prevention
- Memory leak prevention
- Comprehensive logging

### Improved Loading Screen

See `src/App.tsx` lines 49-77 for loading screen that:
- Shows which context is loading
- Provides manual reload option
- Gives better UX during slow loads

---

## Metrics

**Time to Fix:** ~2 hours (including investigation, implementation, testing)
**Files Changed:** 2 (`AuthContext.tsx`, `App.tsx`)
**Lines Changed:** +88, -21
**Bugs Fixed:** 3 (timeout, memory leak, duplicate loads)
**Production Impact:** Critical - blocked all new user signups

---

## References

- **Plan Document:** `PLAN-Fix-Loading-Bug.md`
- **Commit:** 6bfdde4 "Fix: Add timeout protection and prevent duplicate profile loads"
- **Previous Related Fix:** 79c02e0 "Fix auth loading timeout issues"
- **SessionContext Pattern:** `src/contexts/SessionContext.tsx` lines 36-98

---

## Conclusion

This bug taught us that production issues often have multiple interconnected causes. A comprehensive fix requires:

1. Systematic investigation (schema → code → browser)
2. Multiple layers of protection (timeouts, guards, cleanup)
3. Learning from existing patterns
4. Thorough testing in production-like conditions
5. Proper cleanup of all async operations

The final solution is more robust than the original implementation and provides better UX even when things go wrong.

**Key Takeaway:** Never sacrifice error handling for convenience. Always replace removed protections with equivalent safeguards.
