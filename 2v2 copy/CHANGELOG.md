# Changelog

All notable changes to the 2v2 Kick Off Night Tracker will be documented in this file.


  My Recommendation: Hybrid Approach

  1. During development: I'll update CHANGELOG.md as we complete features
  2. When releasing: You run /release-notes to generate formatted output

  Example flow:
  [We complete Phase 6 Admin Panel]
  Me: "Phase 6 complete! I've updated CHANGELOG.md with the new features."

  [Later, when you're ready to release]
  You: /release-notes
  [Command generates formatted release notes from CHANGELOG.md]

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Phase 6 Feature 1: Admin Dashboard (COMPLETE ✅)
  - Dashboard overview with system metrics (users, groups, active sessions, total matches)
  - Recent activity feed (last 10 sessions/groups created)
  - Real-time refresh functionality
  - Admin-only access protection
- Admin API module (`src/lib/api/admin.ts`)
- Admin components (`src/components/admin/AdminPanel.tsx`, `AdminDashboard.tsx`)
- Codebase architecture documentation (`docs/CODEBASE_ARCHITECTURE.md`)
- SQL admin queries reference (`docs/SQL_ADMIN_QUERIES.md`)

### Changed
- Added `admin` view state to App.tsx routing
- Enhanced auth loading with better timeout handling (20s) and detailed logging
- Improved profile loading reliability with timeout management

### Fixed
- Auth loading timeout issues preventing admin panel access
- Supabase foreign key relationship query errors in activity feed
- Profile loading race conditions

## [1.0.0] - 2025-11-30

### Added
- Phase 7: Groups & Social Features
  - Group creation and management
  - Group membership with admin/member roles
  - Group invitations system
  - Group sessions (persistent sessions tied to groups)
  - Group leaderboards (aggregate stats across group sessions)
  - Session breakdown by group
- Hybrid player adding (registered users + guest players)
- Group navigation and dashboard
- Group session lobby

### Fixed
- Groups navigation and database relationships
- INSERT policy for group members
- Group session UX improvements

### Database
- Added `groups`, `group_members`, `group_invites` tables
- Enhanced `sessions` table with `group_id` and `session_type` columns
- Implemented comprehensive RLS policies for groups

## [0.9.0] - 2025-11-29

### Added
- Initial application release
- User authentication (email/password and magic link)
- Session creation and management (ad-hoc sessions)
- Match logging with team selection
- Player statistics calculation
- Pair statistics calculation
- Session leaderboards (player and pair)
- Real-time session updates
- Join code system for sessions
- Co-logger functionality

### Database
- Core schema with `profiles`, `sessions`, `session_players`, `matches`, `player_stats`, `pair_stats` tables
- Row Level Security (RLS) policies
- Stats calculation triggers and functions

### UI/UX
- Brutalist/Neon design system
- Custom Tailwind CSS components
- Responsive mobile layout
- Toast notifications for user feedback
- Loading states and error handling

---

## Release Notes

For detailed feature documentation, see:
- `/docs/planning/ADMIN_PANEL_FEATURES.md` - Admin panel features breakdown
- `/docs/CODEBASE_ARCHITECTURE.md` - Technical architecture documentation
- `/docs/planning/PROJECT_STATUS.md` - Project progress overview
