# Debug Authentication Issue

## The Problem

When you run SQL in Supabase SQL Editor, `auth.uid()` returns NULL because:
- SQL Editor runs in Supabase dashboard context
- It doesn't use your app's authentication session
- This is NORMAL and EXPECTED

## The REAL Issue

The actual problem is that when your app makes API calls to Supabase, the RLS policies can't see `auth.uid()` properly.

## How to Debug in the Browser

1. **Open your app** at http://localhost:5173/
2. **Open Browser Console** (F12)
3. **Run these commands:**

```javascript
// Check if you're logged in
const { data: { user } } = await window.supabase.auth.getUser()
console.log('User:', user)

// Check session
const { data: { session } } = await window.supabase.auth.getSession()
console.log('Session:', session)
console.log('Access Token:', session?.access_token)

// Try to create a group manually
const { data, error } = await window.supabase
  .from('groups')
  .insert({
    name: 'Test Group',
    description: 'Testing',
    created_by_user_id: user.id
  })
  .select()

console.log('Result:', { data, error })
```

## Expected vs Actual

**Expected:**
- User should have an ID
- Session should exist with access_token
- Insert should work

**If auth.uid() is NULL in RLS:**
This means the JWT token isn't being passed or parsed correctly.

## Fix: Make Supabase Client Available in Console

Add this to your browser console to test:

```javascript
// Make supabase accessible in console
window.supabase = (await import('http://localhost:5173/src/lib/supabase.ts')).supabase
```

Or better, let's add a debug function to the app.

## Alternative: Bypass RLS Temporarily for Testing

Run this in Supabase SQL Editor:

```sql
-- TEMPORARY: Disable RLS on groups table for testing
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
```

Then test creating a group. If it works, we know RLS is the issue.

**Remember to re-enable it after:**
```sql
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
```

## Likely Root Cause

The issue is probably:
1. ✅ Supabase client is configured correctly
2. ✅ User is authenticated in the app
3. ❌ RLS policy syntax is wrong OR
4. ❌ Auth headers aren't being sent properly

## Next Steps

1. Check browser console for user/session
2. Verify access_token exists
3. Check Network tab for Authorization header
4. Temporarily disable RLS to verify that's the issue
5. Fix RLS policies if needed
