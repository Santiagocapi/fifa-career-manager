-- ============================================================
-- Migration: 002_match_logging_and_legends.sql
-- Adds:
-- 1. joined_year column to players table
-- 2. matches table (stores opponent, score, result, MVP)
-- 3. match_events table (per-player stats per match)
-- ============================================================

-- Add joined_year to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS joined_year INT;

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id      UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  opponent       TEXT NOT NULL,
  competition    TEXT DEFAULT 'League',
  team_score     INT NOT NULL DEFAULT 0,
  opponent_score INT NOT NULL DEFAULT 0,
  result         TEXT NOT NULL CHECK (result IN ('win', 'draw', 'loss')),
  mvp_player_id  UUID REFERENCES players(id) ON DELETE SET NULL,
  match_date     DATE DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Create match_events table
CREATE TABLE IF NOT EXISTS match_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  goals       INT DEFAULT 0,
  assists     INT DEFAULT 0,
  yellow_card BOOLEAN DEFAULT FALSE,
  red_card    BOOLEAN DEFAULT FALSE,
  clean_sheet BOOLEAN DEFAULT FALSE,
  injured     BOOLEAN DEFAULT FALSE,
  UNIQUE(match_id, player_id)
);
ALTER TABLE match_events ADD COLUMN IF NOT EXISTS injured BOOLEAN DEFAULT FALSE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_season_id ON matches(season_id);
CREATE INDEX IF NOT EXISTS idx_matches_opponent  ON matches(opponent);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player ON match_events(player_id);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage matches" ON matches FOR ALL
  USING (EXISTS (
    SELECT 1 FROM seasons
    JOIN careers ON careers.id = seasons.career_id
    WHERE seasons.id = matches.season_id
    AND careers.user_id = auth.uid()
  ));

CREATE POLICY "Users manage match events" ON match_events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM matches
    JOIN seasons ON seasons.id = matches.season_id
    JOIN careers ON careers.id = seasons.career_id
    WHERE matches.id = match_events.match_id
    AND careers.user_id = auth.uid()
  ));
