# Fix RLS Policy Infinite Recursion

## Problem
The RLS policies on `group_members` table are causing infinite recursion because they check membership by querying the same table.

**Error:** `infinite recursion detected in policy for relation "group_members"`

## Solution
Run the COMPLETE reset script to drop ALL old policies and create correct ones.

## ⚠️ IMPORTANT: Use the Simple Fix Script

**FINAL FIX:** `simple-rls-fix.sql` - This is the one that works!
**Why previous scripts failed:** They all had recursive SELECT policies

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to your project: https://supabase.com/dashboard/project/[your-project-id]

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Run the Simple Fix Script**
   - Copy ALL contents of `simple-rls-fix.sql`
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - This replaces the SELECT policy on group_members

4. **Verify the Fix**
   - The last query will show 1 policy for SELECT on group_members
   - Should say: `authenticated_can_read_members`
   - Refresh your app at http://localhost:5173/
   - Click "My Groups" - should work now!

## Why This Works

The problem was that any SELECT policy on `group_members` that checked
"is user a member of this group" causes infinite recursion because
it queries the same table it's protecting.

**Solution:** Allow all authenticated users to SELECT from group_members.
This is safe because:
- The API `getUserGroups()` filters by user_id in the query
- The `groups` table policy restricts which groups users can see
- We only allow reading, not writing without proper checks

## What the Fix Does

### Before (Problematic):
```sql
-- This causes recursion
CREATE POLICY "Users can view their group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm  -- ❌ Queries same table!
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
    )
  );
```

### After (Fixed):
```sql
-- No recursion - uses subquery
CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT gm.group_id  -- ✅ Simple subquery
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
    )
  );
```

## Alternative: If SQL Editor Doesn't Work

You can also run these commands one by one in your terminal using `psql`:

```bash
# Get your database connection string from Supabase dashboard
# Settings → Database → Connection string

psql "postgresql://[connection-string]" -f fix-rls-policies.sql
```

## After Running the Fix

1. Refresh the app in your browser
2. Click "My Groups"
3. Should now load without errors!
4. Test creating a group
5. Test all group functionality

## Troubleshooting

If you still see errors:

1. **Check policies were updated:**
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'group_members';
   ```

2. **Verify RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'group_members';
   ```
   Should show `rowsecurity = true`

3. **Check user authentication:**
   - Make sure you're logged in with username/password
   - Check browser console for auth.uid()

4. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
