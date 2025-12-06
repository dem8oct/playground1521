# Session Management Pattern

## Problem
When building multi-user session-based apps with Supabase, a common pitfall is automatically loading ANY active session from the database on app startup. This causes users to see random sessions they didn't create or join.

## Anti-Pattern (Don't Do This)

```typescript
// ❌ BAD: Loads ANY active session from database
useEffect(() => {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'active')
    .maybeSingle()  // Returns any active session!

  setActiveSession(data)
}, [])
```

**Issues:**
- Users see sessions they never joined
- No way to track which session belongs to which user
- Creates confusion in multi-user environments

## Correct Pattern (Use This)

### 1. Store Session ID in localStorage

```typescript
// When creating a session
const session = await createSession()
localStorage.setItem('app-session-id', session.id)

// When joining a session
const session = await joinSession(code)
localStorage.setItem('app-session-id', session.id)
```

### 2. Load Only User's Session on Startup

```typescript
useEffect(() => {
  const storedSessionId = localStorage.getItem('app-session-id')

  if (storedSessionId) {
    // Load the specific session by ID
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', storedSessionId)
      .eq('status', 'active')
      .maybeSingle()

    if (data) {
      setActiveSession(data)
    } else {
      // Session not found or expired, clear localStorage
      localStorage.removeItem('app-session-id')
    }
  }
}, [])
```

### 3. Clean Up localStorage on Exit

```typescript
// When ending session (initiator)
async function endSession() {
  await supabase
    .from('sessions')
    .update({ status: 'ended' })
    .eq('id', sessionId)

  setActiveSession(null)
  localStorage.removeItem('app-session-id')
}

// When leaving session (guest/participant)
function leaveSession() {
  setActiveSession(null)
  localStorage.removeItem('app-session-id')
}
```

## Key Benefits

✅ **User-specific:** Each user only sees sessions they explicitly joined
✅ **Persistent:** Session survives page refreshes
✅ **Clean:** Easy to clear when leaving
✅ **Predictable:** No surprise sessions appearing

## UI Recommendation

Provide clear exit options for all user types:

- **Initiators:** "End Session" button (terminates for everyone)
- **Participants/Guests:** "Leave Session" button (removes from their view only)

## Storage Key Naming

Use descriptive, namespaced keys to avoid collisions:

```typescript
// Good
localStorage.setItem('myapp-session-id', sessionId)
localStorage.setItem('myapp-auth-token', token)

// Avoid
localStorage.setItem('session', sessionId)  // Too generic
localStorage.setItem('id', sessionId)       // Too vague
```

## Alternative: URL-based Sessions

For temporary/guest sessions, consider URL-based tracking:

```typescript
// Store session in URL
router.push(`/session/${sessionId}`)

// Load from URL params
const { sessionId } = useParams()
```

**Pros:** Works without localStorage, shareable links
**Cons:** Lost on navigation, harder to persist

## Summary

**Rule of Thumb:** Never query for "any active session" unless you have explicit user-session relationships in your database schema (e.g., `user_sessions` join table). Always use localStorage or URL params to track which session belongs to the current user.
