# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Missing Supabase environment variables" Error

**Symptom:** App crashes on startup with this error message

**Solutions:**
- Make sure you've created a `.env` file (copy from `.env.example`)
- Verify the environment variables are named correctly:
  - `VITE_SUPABASE_URL` (not `SUPABASE_URL`)
  - `VITE_SUPABASE_ANON_KEY` (not `SUPABASE_KEY`)
- Restart the dev server after changing `.env` files
- Make sure `.env` is in the `2v2/` directory (not the root)

### 2. Magic Link Email Not Arriving

**Symptom:** User doesn't receive magic link email after signup/login

**Solutions:**
- Check your spam/junk folder
- Verify email provider is enabled in Supabase (Authentication → Providers)
- Check Supabase logs (Authentication → Logs) for failed email sends
- For development, check Supabase email rate limits (default is 3-4 emails per hour for free tier)
- Use Supabase's SMTP settings for custom email provider if needed

### 3. Authentication State Not Persisting

**Symptom:** User gets logged out on page refresh

**Solutions:**
- Verify `supabase.ts` has correct storage configuration
- Check browser's localStorage for `2v2-kickoff-auth` key
- Try clearing browser cache/localStorage and logging in again
- Make sure you're not in incognito/private browsing mode
- Check browser console for auth-related errors

### 4. Database Query Errors (RLS Violations)

**Symptom:** Getting "row-level security policy" errors when querying data

**Solutions:**
- Verify you're logged in (check `supabase.auth.getSession()` in console)
- Check that RLS policies were created correctly (run `supabase-schema.sql` again)
- For development, you can temporarily disable RLS on a table:
  ```sql
  ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
  ```
  (Re-enable for production!)
- Check Supabase logs (Database → Query Performance) for detailed error messages

### 5. TypeScript Errors with Database Types

**Symptom:** Type errors when working with Supabase queries

**Solutions:**
- Make sure `database.types.ts` matches your actual database schema
- Regenerate types using Supabase CLI if schema changed:
  ```bash
  npx supabase gen types typescript --project-id your-project-id > src/lib/database.types.ts
  ```
- Use `.maybeSingle()` instead of `.single()` for queries that might not return results

### 6. Build Errors

**Symptom:** `npm run build` fails with TypeScript errors

**Solutions:**
- Run `npm run lint` to see all errors
- Check that all imports use correct paths
- Verify all components have proper TypeScript types
- Run `tsc --noEmit` to check for type errors without building

### 7. Session Expired / Invalid Join Code

**Symptom:** Can't join session with valid-looking code

**Solutions:**
- Verify session status is 'active' (not 'ended' or 'expired')
- Check `expires_at` timestamp in database
- Sessions auto-expire after 10 hours
- Join codes are case-sensitive
- Try creating a new session

### 8. Real-time Updates Not Working

**Symptom:** Changes from other users don't appear without refresh

**Solutions:**
- Verify Realtime is enabled in Supabase (Database → Replication)
- Enable replication for all relevant tables (matches, player_stats, pair_stats)
- Check browser console for WebSocket connection errors
- Verify subscription code properly handles INSERT/UPDATE/DELETE events
- Check network tab for WebSocket connections (should be WSS)

### 9. Stats Calculation Issues

**Symptom:** Leaderboards showing incorrect numbers

**Solutions:**
- Stats are recalculated after every match insert/update/delete
- Check `player_stats` and `pair_stats` tables directly in Supabase
- Verify match data has correct team assignments and goals
- Look for calculation errors in stats recalculation logic
- Try deleting all stats rows and re-logging a match to recalculate

### 10. Styling Issues / Tailwind Not Working

**Symptom:** UI looks broken or unstyled

**Solutions:**
- Verify Tailwind directives are in `index.css`
- Check `tailwind.config.js` has correct content paths
- Make sure PostCSS is configured (`postcss.config.js`)
- Try running dev server with `--force` flag to clear cache
- Check browser console for CSS loading errors

## Debug Checklist

When debugging issues, check these in order:

1. ✅ Browser console for JavaScript errors
2. ✅ Network tab for failed requests
3. ✅ Supabase project dashboard → Logs
4. ✅ `.env` file has correct values
5. ✅ Database tables exist with correct schema
6. ✅ RLS policies are enabled
7. ✅ User is authenticated (check `localStorage`)
8. ✅ Realtime subscriptions are active

## Still Having Issues?

- Check the main spec in `2v2.md` for expected behavior
- Review Supabase documentation: https://supabase.com/docs
- Check React Query docs: https://tanstack.com/query/latest
- Look for similar issues in Supabase GitHub discussions

## Development Tips

- Use React DevTools to inspect component state
- Use Supabase Studio to inspect database directly
- Add `console.log` statements liberally during development
- Use React Query DevTools for debugging queries
- Check Supabase logs for auth and database errors
