# Admin Panel Features - Basic vs Advanced

**Project:** 2v2 Kick Off Night Tracker
**Date Created:** 2025-11-30
**Status:** Planning - Phase 6 Implementation Ready

---

## 🎯 Overview

This document outlines the features for the Admin Panel, divided into Basic (MVP) and Advanced features. The Basic features are essential for Phase 6, while Advanced features can be implemented in future phases based on user needs and scale.

---

## 🔧 Basic Admin Features (Phase 6 - MVP)

### 1. Dashboard Overview
**Purpose:** Quick snapshot of system health and activity

**Metrics to Display:**
- Total users count
- Total groups count
- Active sessions count
- Total matches logged (all-time)
- Recent activity feed (last 10 actions)

**Implementation:**
- Simple card-based dashboard
- Real-time counts from database
- Activity feed from recent database changes

**Priority:** HIGH
**Time Estimate:** 1 hour

---

### 2. Global Leaderboards 📊
**Purpose:** View performance across all sessions and groups

**Features:**
```
┌─────────────────────────────────────────────┐
│  GLOBAL PLAYER LEADERBOARD                  │
├─────────────────────────────────────────────┤
│ Rank | Player    | MP | W | D | L | Pts    │
│   1  | Ahmed     | 45 | 30| 8 | 7 | 98     │
│   2  | Salman    | 42 | 28| 7 | 7 | 91     │
│   3  | John      | 40 | 25| 9 | 6 | 84     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  GLOBAL PAIR LEADERBOARD                    │
├─────────────────────────────────────────────┤
│ Rank | Pair           | MP | W | D | L     │
│   1  | Ahmed & Salman | 25 | 18| 4 | 3     │
│   2  | John & Mike    | 23 | 16| 5 | 2     │
└─────────────────────────────────────────────┘
```

**Data Sources:**
- Aggregate from all `player_stats` across all sessions
- Aggregate from all `pair_stats` across all sessions
- Include both ad-hoc and group sessions

**Filters:**
- Date range (last week, month, all-time)
- Session type (ad-hoc, group, both)

**Export:**
- CSV export for both leaderboards
- Include timestamp and filters used

**Priority:** HIGH
**Time Estimate:** 2 hours

---

### 3. Session Management 🧹
**Purpose:** Monitor and clean up sessions

**Features:**

#### View All Sessions
- List all sessions (active + expired + ended)
- Columns: ID, Type (ad-hoc/group), Status, Created, Expires, Player Count
- Filter by status, type, date
- Search by session ID or join code

#### Cleanup Expired Sessions
- **Button:** "Clean Up Expired Sessions"
- **Logic:**
  - Delete ad-hoc sessions older than 10 hours AND status = 'expired'
  - KEEP all group sessions (permanent)
  - Show confirmation: "This will delete X expired ad-hoc sessions. Continue?"
  - Success message: "Cleaned up 15 expired sessions"
- **Cascade:** Delete associated session_players, matches, stats

#### Manual Session Actions
- **End Session:** Manually end any active session (emergency use)
- Confirmation required
- Only for stuck/problematic sessions

**Priority:** HIGH
**Time Estimate:** 1.5 hours

---

### 4. System Stats 📈
**Purpose:** Track app usage and growth

**Metrics:**

#### User Stats
- Total users registered
- New users (today/week/month)
- Active users (last 24h, 7d, 30d)
- Users in groups vs solo players

#### Group Stats
- Total groups created
- Average group size
- Most popular groups (by member count)
- Most active groups (by session count)

#### Session Stats
- Sessions created (today/week/month)
- Ad-hoc vs Group sessions ratio
- Average session duration
- Average players per session

#### Match Stats
- Matches logged (today/week/month)
- Total matches all-time
- Average matches per session
- Most active day of the week

**Display:**
- Card-based stat display
- Simple bar charts for trends
- Comparison with previous period (↑ 12% vs last week)

**Priority:** MEDIUM
**Time Estimate:** 2 hours

---

### 5. User List (View Only) 👥
**Purpose:** Quick user lookup for support

**Features:**
- Search users by username or email
- User profile view:
  - Username, Email, Join Date
  - Groups (list of group names)
  - Match count (total matches participated in)
  - Last active date
  - Admin status (Yes/No)

**Actions Available:**
- View only (no edit/delete in basic version)
- Click username to see full profile
- Click group name to navigate to group

**Priority:** MEDIUM
**Time Estimate:** 1.5 hours

---

### Phase 6 Basic - Summary

**Total Features:** 5
**Total Time Estimate:** 8-9 hours
**Priority Order:**
1. Dashboard Overview (1h)
2. Global Leaderboards (2h)
3. Session Management (1.5h)
4. System Stats (2h)
5. User List (1.5h)

**Deliverables:**
- `src/components/admin/AdminPanel.tsx`
- `src/components/admin/AdminDashboard.tsx`
- `src/components/admin/GlobalLeaderboards.tsx`
- `src/components/admin/SessionManagement.tsx`
- `src/components/admin/SystemStats.tsx`
- `src/components/admin/UserList.tsx`
- `src/lib/api/admin.ts`

---

## 🚀 Advanced Admin Features (Future Phases)

### 1. User Management 👥
**Priority:** Phase 9

#### Features:
- **Ban/Unban Users**
  - Mark user as banned in database
  - Prevent login when banned
  - Show ban reason to user
  - Admin can see ban history

- **Delete Users**
  - Soft delete vs hard delete option
  - Remove from all groups
  - Keep historical matches (mark as "deleted user")
  - Cascade or preserve data (configurable)

- **Edit User Profiles**
  - Change username (with uniqueness check)
  - Reset password (send reset email)
  - Update email
  - Update display name
  - Toggle admin status

- **Impersonate User** (Support Feature)
  - View app as that user
  - Debug user-specific issues
  - Session logged in audit trail
  - "Exit impersonation" button

**Database Changes:**
```sql
ALTER TABLE profiles
  ADD COLUMN banned BOOLEAN DEFAULT false,
  ADD COLUMN ban_reason TEXT,
  ADD COLUMN banned_at TIMESTAMPTZ,
  ADD COLUMN banned_by UUID REFERENCES profiles(id);
```

**Time Estimate:** 4-5 hours

---

### 2. Group Management 🎪
**Priority:** Phase 9

#### Features:
- **View All Groups**
  - Search by name
  - See member count
  - See session count
  - See match count
  - Filter by activity level

- **Delete Groups**
  - Confirmation required ("This will delete X sessions and Y matches")
  - Cascades to sessions, matches, stats
  - Notify members (optional)

- **Transfer Group Ownership**
  - Reassign creator to another member
  - Original creator becomes regular admin
  - New owner must be existing admin

- **Featured Groups**
  - Mark groups as "featured"
  - Show on homepage/groups list
  - Admin curated list

**Time Estimate:** 3-4 hours

---

### 3. Match Moderation ⚖️
**Priority:** Phase 10

#### Features:
- **View All Matches**
  - List matches across all sessions
  - Filter by date, session, player
  - Search by team names, clubs
  - Sort by date, score, session

- **Delete Matches**
  - Remove inappropriate/test matches
  - Recalculate stats automatically
  - Show confirmation with match details
  - Log deletion in audit trail

- **Edit Matches**
  - Fix score errors
  - Fix player assignments
  - Update timestamp
  - Update club names
  - Recalculate stats on save

- **Bulk Operations**
  - Delete all matches from a session
  - Reset session stats
  - Export matches to CSV

**Time Estimate:** 3-4 hours

---

### 4. Analytics & Insights 📊
**Priority:** Phase 10

#### Features:
- **Activity Graphs**
  - Matches per day/week/month (line chart)
  - New users per week (bar chart)
  - Active users trend (line chart)
  - Sessions created over time (area chart)

- **User Engagement**
  - DAU (Daily Active Users)
  - WAU (Weekly Active Users)
  - MAU (Monthly Active Users)
  - Retention rate (7-day, 30-day)
  - Churn rate

- **Popular Features**
  - Most used features (clicks tracked)
  - Session types distribution (pie chart)
  - Group vs ad-hoc usage
  - Average session size

- **Geographic Data** (if tracking location)
  - Users by country/city (map)
  - Popular regions
  - Timezone distribution

**Tools:**
- Recharts or Chart.js for visualizations
- Date range picker for custom ranges

**Time Estimate:** 5-6 hours

---

### 5. System Configuration ⚙️
**Priority:** Phase 11

#### Features:
- **Settings Panel**
  - Session expiry time (default: 10 hours)
  - Max players per session (default: 10)
  - Max groups per user (default: unlimited)
  - Username length limits (5-10 chars)
  - Minimum match participants (default: 3)

- **Feature Flags**
  - Enable/disable groups feature
  - Enable/disable ad-hoc sessions
  - Enable/disable guest players
  - Maintenance mode (block all users except admins)

- **Email Templates** (if email notifications added)
  - Customize invite emails
  - Customize notification emails
  - Customize welcome email

**Database:**
```sql
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);
```

**Time Estimate:** 4-5 hours

---

### 6. Data Export & Backup 💾
**Priority:** Phase 11

#### Features:
- **Export Data**
  - All users (CSV)
  - All groups (CSV)
  - All matches (CSV)
  - Global leaderboard (CSV)
  - Export includes timestamp

- **Backup Database**
  - Manual backup trigger (Supabase backup)
  - Scheduled backups (weekly)
  - Download backup file
  - Restore from backup (manual via Supabase)

- **Import Data** (Advanced)
  - Bulk import users (CSV)
  - Bulk import groups (CSV)
  - Validation before import

**Time Estimate:** 3-4 hours

---

### 7. Logs & Activity 📝
**Priority:** Phase 12

#### Features:
- **Audit Log**
  - Track all admin actions (delete, ban, edit)
  - Track user actions (login, create group, etc.)
  - Filter by user, action type, date
  - Export audit log (CSV)

- **Error Logs**
  - View app errors from frontend
  - Filter by severity (error, warning, info)
  - Search by error message
  - Auto-report critical errors

- **API Usage** (if tracking)
  - Supabase queries count
  - Rate limiting info
  - Most expensive queries
  - Database usage stats

**Database:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Time Estimate:** 4-5 hours

---

### 8. Announcements & Notifications 📢
**Priority:** Phase 12

#### Features:
- **Create Announcements**
  - Show banner to all users (top of page)
  - Show in-app notification (toast)
  - Set priority (info, warning, critical)
  - Set expiry date

- **Send Notifications**
  - Email to all users
  - Email to specific groups
  - Email to specific users
  - Custom message and subject

- **Schedule Maintenance**
  - Set maintenance window (start time, end time)
  - Auto-notify users 24h before
  - Show countdown on homepage
  - Block access during maintenance (admins exempt)

**Database:**
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'critical')),
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Time Estimate:** 3-4 hours

---

### 9. Reports & Moderation 🚩
**Priority:** Phase 13

#### Features:
- **User Reports** (requires report feature first)
  - View reported users/matches/groups
  - Review and take action
  - Ban reported users
  - Delete reported content
  - Dismiss false reports

- **Content Moderation**
  - Review group names/descriptions
  - Review user bios
  - Automatic profanity filter
  - Flagged content queue

- **Report Types:**
  - Inappropriate username
  - Inappropriate group name
  - Cheating/fake scores
  - Harassment
  - Spam

**Database:**
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reported_by UUID REFERENCES profiles(id),
  report_type TEXT,
  resource_type TEXT,
  resource_id UUID,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Time Estimate:** 5-6 hours

---

### 10. Admin Team Management 👑
**Priority:** Phase 13

#### Features:
- **Multiple Admins**
  - Promote users to admin
  - Demote admins
  - List all admins

- **Admin Roles**
  - Super Admin (full access)
  - Moderator (limited access: view only, delete matches)
  - Support (view only, impersonate users)

- **Admin Activity Log**
  - Track admin actions separately
  - Show who did what and when
  - Accountability and security

- **Admin Permissions Matrix:**
  ```
  | Action                | Super Admin | Moderator | Support |
  |-----------------------|-------------|-----------|---------|
  | View Users            | ✅          | ✅        | ✅      |
  | Ban Users             | ✅          | ✅        | ❌      |
  | Delete Users          | ✅          | ❌        | ❌      |
  | Delete Matches        | ✅          | ✅        | ❌      |
  | Edit Settings         | ✅          | ❌        | ❌      |
  | Impersonate Users     | ✅          | ❌        | ✅      |
  | Promote to Admin      | ✅          | ❌        | ❌      |
  ```

**Database:**
```sql
ALTER TABLE profiles
  ADD COLUMN admin_role TEXT CHECK (admin_role IN ('super_admin', 'moderator', 'support'));

-- Update existing is_admin to use admin_role
UPDATE profiles SET admin_role = 'super_admin' WHERE is_admin = true;
```

**Time Estimate:** 4-5 hours

---

## 📊 Implementation Priority & Timeline

### Phase 6: Basic Admin Panel (MVP)
**Time:** 8-9 hours
**Priority:** HIGH - Essential for launch
- Dashboard Overview
- Global Leaderboards
- Session Management & Cleanup
- System Stats
- User List (view only)

### Phase 9: User & Group Management
**Time:** 7-9 hours
**Priority:** MEDIUM - Needed as user base grows
- User Management (ban, delete, edit)
- Group Management (delete, transfer)

### Phase 10: Moderation & Analytics
**Time:** 8-10 hours
**Priority:** MEDIUM - Useful with 100+ users
- Match Moderation
- Analytics & Insights

### Phase 11: Configuration & Backup
**Time:** 7-9 hours
**Priority:** LOW - Nice to have
- System Configuration
- Data Export & Backup

### Phase 12: Logging & Communications
**Time:** 7-9 hours
**Priority:** LOW - Useful at scale
- Logs & Activity
- Announcements & Notifications

### Phase 13: Advanced Moderation
**Time:** 9-11 hours
**Priority:** LOW - Only needed with community issues
- Reports & Moderation
- Admin Team Management

---

## 🎯 Recommendation

### Start With: Phase 6 Basic
**Why:**
- Essential for managing the app
- Provides visibility into usage
- Allows cleanup of expired data
- Enables global competition view

### When to Build Advanced Features:
- **50+ users:** Add User Management (ban, delete)
- **100+ users:** Add Analytics & Insights
- **500+ users:** Add Reports & Moderation
- **Multiple admins needed:** Add Admin Team Management

Most advanced features are only valuable at scale. Build basic features first, launch the app, and add advanced features based on actual user needs.

---

## 🔐 Security Considerations

### Access Control
- Protect `/admin` route with authentication
- Check `is_admin = true` before allowing access
- Redirect non-admins to homepage

### RLS Policies
- Admins need bypass RLS for certain queries
- Use `SECURITY DEFINER` functions for admin operations
- Log all admin actions for accountability

### Rate Limiting
- Limit admin API calls (prevent abuse)
- Especially for bulk operations (delete, export)

### Audit Trail
- Log all destructive actions (delete, ban)
- Store who, what, when, why
- Immutable logs (append-only)

---

## 📝 Notes

- All time estimates are approximate
- Advanced features should be prioritized based on actual user feedback
- Some features (like email notifications) require additional setup (email service)
- Consider using a library like `react-admin` for faster development
- Test all admin features thoroughly before deploying to production

---

**Document Status:** Complete
**Last Updated:** 2025-11-30
**Next Review:** After Phase 6 completion
