# Fix RLS Policy Infinite Recursion

## Problem
The RLS policies on `group_members` table are causing infinite recursion because they check membership by querying the same table.

**Error:** `infinite recursion detected in policy for relation "group_members"`

## Solution
Run the SQL script to fix the policies with non-recursive queries.

## Steps to Fix

1. **Open Supabase Dashboard**
   - Go to your project: https://supabase.com/dashboard/project/[your-project-id]

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Run the Fix Script**
   - Copy the contents of `fix-rls-policies.sql`
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify the Fix**
   - The last query in the script will show all policies
   - Verify no errors appear
   - Refresh your app at http://localhost:5173/
   - Click "My Groups" - should work now!

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
