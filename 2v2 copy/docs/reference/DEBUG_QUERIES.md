# Debug Queries for Supabase

Run these queries in your Supabase SQL Editor to diagnose issues:

## 1. Check if profile exists for your user

```sql
SELECT * FROM profiles WHERE id = '75443f5b-2b7d-4ce6-8dc1-cbb26c607876';
```

**Expected:** Should return 1 row with your profile
**If empty:** Profile was not auto-created, need to create it manually

## 2. Check if you can insert a session manually

```sql
INSERT INTO sessions (initiator_user_id, join_code, expires_at)
VALUES (
  '75443f5b-2b7d-4ce6-8dc1-cbb26c607876',
  'TEST01',
  NOW() + INTERVAL '10 hours'
)
RETURNING *;
```

**Expected:** Should create a session and return it
**If fails:** Check the error message - likely RLS policy issue

## 3. Check existing sessions

```sql
SELECT * FROM sessions;
```

## 4. Verify RLS policies are enabled

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**Expected:** `rowsecurity` should be `true` for all tables

## 5. Check if the trigger for auto-creating profiles exists

```sql
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Expected:** Should return 1 row
**If empty:** Trigger was not created

## 6. Manually create profile if missing

```sql
INSERT INTO profiles (id, display_name)
VALUES (
  '75443f5b-2b7d-4ce6-8dc1-cbb26c607876',
  'Your Name Here'
)
ON CONFLICT (id) DO NOTHING;
```

## 7. Check auth.users table

```sql
SELECT id, email, created_at FROM auth.users WHERE id = '75443f5b-2b7d-4ce6-8dc1-cbb26c607876';
```

## 8. Test RLS policy with explicit auth context

```sql
-- This simulates what happens when your app tries to create a session
SELECT auth.uid(); -- Should return your user ID when run from authenticated context
```

---

## Quick Fix Steps

1. Run query #1 to check if profile exists
2. If profile is missing, run query #6 to create it
3. Try creating a session again in the app
4. If still fails, run query #2 to test manual insert and see the exact error
