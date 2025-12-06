-- 2v2 Kick Off Night Tracker - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  co_logger_player_id UUID,
  join_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ
);

-- Index for faster lookups
CREATE INDEX idx_sessions_join_code ON sessions(join_code);
CREATE INDEX idx_sessions_status ON sessions(status);

-- RLS Policies for sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sessions"
  ON sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = initiator_user_id);

CREATE POLICY "Session initiators can update their sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = initiator_user_id);

-- ============================================================================
-- SESSION PLAYERS TABLE
-- ============================================================================
CREATE TABLE session_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(session_id, display_name)
);

-- Index for faster lookups
CREATE INDEX idx_session_players_session_id ON session_players(session_id);
CREATE INDEX idx_session_players_profile_id ON session_players(profile_id);

-- RLS Policies for session_players
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view session players"
  ON session_players FOR SELECT
  USING (true);

CREATE POLICY "Session initiators and co-loggers can add players"
  ON session_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
      AND (
        s.initiator_user_id = auth.uid()
        OR s.co_logger_player_id IN (
          SELECT id FROM session_players sp WHERE sp.profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session initiators can remove players"
  ON session_players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
      AND s.initiator_user_id = auth.uid()
    )
  );

-- Add foreign key constraint for co_logger (after session_players exists)
ALTER TABLE sessions
  ADD CONSTRAINT fk_co_logger_player
  FOREIGN KEY (co_logger_player_id)
  REFERENCES session_players(id)
  ON DELETE SET NULL;

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  logged_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_a_player_ids UUID[] NOT NULL CHECK (array_length(team_a_player_ids, 1) = 2),
  team_b_player_ids UUID[] NOT NULL CHECK (array_length(team_b_player_ids, 1) BETWEEN 1 AND 2),
  team_a_club TEXT,
  team_b_club TEXT,
  team_a_goals INTEGER NOT NULL CHECK (team_a_goals >= 0),
  team_b_goals INTEGER NOT NULL CHECK (team_b_goals >= 0),
  played_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster lookups
CREATE INDEX idx_matches_session_id ON matches(session_id);
CREATE INDEX idx_matches_played_at ON matches(played_at DESC);

-- RLS Policies for matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches"
  ON matches FOR SELECT
  USING (true);

CREATE POLICY "Session initiators and co-loggers can log matches"
  ON matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
      AND s.status = 'active'
      AND (
        s.initiator_user_id = auth.uid()
        OR s.co_logger_player_id IN (
          SELECT id FROM session_players sp WHERE sp.profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session initiators and co-loggers can update matches"
  ON matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
      AND (
        s.initiator_user_id = auth.uid()
        OR s.co_logger_player_id IN (
          SELECT id FROM session_players sp WHERE sp.profile_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session initiators and co-loggers can delete matches"
  ON matches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions s
      WHERE s.id = session_id
      AND (
        s.initiator_user_id = auth.uid()
        OR s.co_logger_player_id IN (
          SELECT id FROM session_players sp WHERE sp.profile_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- PLAYER STATS TABLE
-- ============================================================================
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  session_player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  mp INTEGER DEFAULT 0 NOT NULL,
  w INTEGER DEFAULT 0 NOT NULL,
  d INTEGER DEFAULT 0 NOT NULL,
  l INTEGER DEFAULT 0 NOT NULL,
  gf INTEGER DEFAULT 0 NOT NULL,
  ga INTEGER DEFAULT 0 NOT NULL,
  gd INTEGER DEFAULT 0 NOT NULL,
  pts INTEGER DEFAULT 0 NOT NULL,
  UNIQUE(session_id, session_player_id)
);

-- Index for faster lookups
CREATE INDEX idx_player_stats_session_id ON player_stats(session_id);
CREATE INDEX idx_player_stats_leaderboard ON player_stats(session_id, pts DESC, gd DESC, gf DESC);

-- RLS Policies for player_stats
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player stats"
  ON player_stats FOR SELECT
  USING (true);

CREATE POLICY "System can manage player stats"
  ON player_stats FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- PAIR STATS TABLE
-- ============================================================================
CREATE TABLE pair_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  session_player_id_1 UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  session_player_id_2 UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  mp INTEGER DEFAULT 0 NOT NULL,
  w INTEGER DEFAULT 0 NOT NULL,
  d INTEGER DEFAULT 0 NOT NULL,
  l INTEGER DEFAULT 0 NOT NULL,
  gf INTEGER DEFAULT 0 NOT NULL,
  ga INTEGER DEFAULT 0 NOT NULL,
  gd INTEGER DEFAULT 0 NOT NULL,
  pts INTEGER DEFAULT 0 NOT NULL,
  CHECK (session_player_id_1 < session_player_id_2),
  UNIQUE(session_id, session_player_id_1, session_player_id_2)
);

-- Index for faster lookups
CREATE INDEX idx_pair_stats_session_id ON pair_stats(session_id);
CREATE INDEX idx_pair_stats_leaderboard ON pair_stats(session_id, pts DESC, gd DESC, gf DESC);

-- RLS Policies for pair_stats
ALTER TABLE pair_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pair stats"
  ON pair_stats FOR SELECT
  USING (true);

CREATE POLICY "System can manage pair stats"
  ON pair_stats FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for matches table
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
