# 2v2 Kick Off Night Tracker ⚽

A social platform for tracking 2v2 football matches, managing groups, and competing with friends through leaderboards.

## 🎯 Features

### Current (Phase 6)
- **Session Management**: Create and manage game sessions with unique join codes
- **Match Logging**: Track 2v2 matches with scores and teams
- **Player Stats**: Individual player performance tracking (W/D/L, goals, points)
- **Pair Stats**: Partnership statistics for player duos
- **Leaderboards**: Real-time rankings for players and pairs
- **Guest & Registered Players**: Support for both casual and registered users
- **Co-Logger Role**: Delegate match logging to trusted players

### Coming Soon (Phase 7)
- **Username Authentication**: Login with username/email + password
- **Groups & Clubs**: Create invite-only groups for regular players
- **Group Leaderboards**: Track stats within your group
- **Enhanced Profiles**: Usernames, bios, and more
- **System Admin Panel**: Global leaderboards and admin tools

## 🚀 Quick Start

See [docs/guides/SETUP.md](docs/guides/SETUP.md) for full setup instructions.

### Prerequisites
- Node.js 16+
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Supabase credentials to .env

# Run development server
npm run dev
```

## 📚 Documentation

### Guides
- [Setup Guide](docs/guides/SETUP.md) - Installation and configuration
- [Testing Checklist](docs/guides/TESTING_CHECKLIST.md) - QA testing procedures
- [Troubleshooting](docs/guides/TROUBLESHOOTING.md) - Common issues and solutions
- [Best Practices](docs/guides/BEST_PRACTICES.md) - Development guidelines

### Planning & Status
- [Project Status](docs/planning/PROJECT_STATUS.md) - Current state and progress
- [Phase 7 Plan](docs/planning/PHASE7_GROUPS_AND_SOCIAL.md) - Groups & social features implementation
- [UX Improvements](docs/planning/UX_IMPROVEMENTS.md) - Completed enhancements
- [Ideas](docs/planning/ideas.md) - Brainstorming and proposals

### Reference
- [Future Ideas](docs/reference/FUTURE_IDEAS.md) - Feature proposals and designs
- [Bug Fixes](docs/reference/BUGFIXES.md) - Bug tracking and resolutions
- [Debug Queries](docs/reference/DEBUG_QUERIES.md) - Helpful database queries
- [Session Patterns](docs/reference/SESSION_MANAGEMENT_PATTERN.md) - Architecture patterns

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS (Neon Cyberpunk theme)
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router

## 📊 Database Schema

See [supabase-schema.sql](supabase-schema.sql) for the complete database schema.

**Main Tables:**
- `profiles` - User profiles
- `sessions` - Game sessions
- `session_players` - Players in sessions
- `matches` - Individual match records
- `player_stats` - Player statistics
- `pair_stats` - Pair/duo statistics

## 🤝 Contributing

This is a personal project, but contributions and suggestions are welcome!

## 📝 License

MIT

---

**Last Updated:** 2025-11-29
**Current Phase:** Phase 7 - Groups & Social Features (In Progress)
