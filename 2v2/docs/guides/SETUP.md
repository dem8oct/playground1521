# 2v2 Kick Off Night Tracker - Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works fine)
- Basic knowledge of React and TypeScript

## Step 1: Clone and Install Dependencies

```bash
cd 2v2
npm install
```

## Step 2: Set Up Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning (2-3 minutes)
3. Note your project's URL and anon key (you'll need these in Step 4)

## Step 3: Run Database Migration

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste into the SQL Editor and click **Run**
5. Verify tables were created by checking the **Table Editor** section

You should see the following tables:
- `profiles`
- `sessions`
- `session_players`
- `matches`
- `player_stats`
- `pair_stats`

## Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   To find these values:
   - Go to your Supabase project dashboard
   - Click **Settings** (gear icon)
   - Click **API** in the sidebar
   - Copy the **Project URL** and **anon/public** key

## Step 5: Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional but recommended):
   - Go to **Authentication** → **Email Templates**
   - Customize the Magic Link template if desired

4. Add your site URL to allowed redirect URLs:
   - Go to **Authentication** → **URL Configuration**
   - Add `http://localhost:5173` to **Redirect URLs** (for development)
   - Add your production URL when deploying

## Step 6: Run Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:5173`

## Step 7: Test the Setup

1. Open the app in your browser
2. You should see the UI with design system components
3. Try creating an account with magic link authentication
4. Check that you can receive the magic link email

## Optional: Import Sample Data

If you want to test with sample data, you can run this SQL in the Supabase SQL Editor:

```sql
-- Sample session (you'll need to replace 'your-user-id' with a real auth user ID)
INSERT INTO sessions (initiator_user_id, join_code, expires_at)
VALUES ('your-user-id', 'DEMO01', NOW() + INTERVAL '10 hours');
```

## Next Steps

Once setup is complete:
- Read the main spec in `2v2.md` to understand the full feature set
- Check `TROUBLESHOOTING.md` if you encounter issues
- Start implementing the remaining features!

## Production Deployment

When deploying to production:

1. Update `.env` with production Supabase URL and key
2. Build the app: `npm run build`
3. Deploy the `dist` folder to your VPS or hosting service
4. Update Supabase redirect URLs to include your production domain
5. Configure email templates with your production branding
