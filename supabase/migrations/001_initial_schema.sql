-- ============================================================
-- FIFA Career Mode Manager — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable UUID extension (available by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: careers
-- Top-level container for a coaching career save.
-- One user can have multiple careers (e.g., Real Madrid save, Boca save).
-- ============================================================
CREATE TABLE careers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_name     TEXT NOT NULL,
  manager_name  TEXT NOT NULL,
  league        TEXT,
  country       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: seasons
-- A single season within a career. Stats are scoped to a season.
-- Only one season per career can be active at a time.
-- Once closed (is_closed = true), it becomes immutable/read-only.
-- ============================================================
CREATE TABLE seasons (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_id      UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  year_label     TEXT NOT NULL,        -- e.g., "2024/2025"
  season_number  INT  NOT NULL,        -- 1, 2, 3...
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  is_closed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: players
-- A player entity that belongs to a career.
-- The player record persists across seasons.
-- Per-season data (stats, OVR, value) lives in season_stats.
-- ============================================================
CREATE TABLE players (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_id          UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  full_name          TEXT NOT NULL,
  nationality        TEXT,
  preferred_position TEXT NOT NULL,   -- e.g., "ST", "CB", "GK"
  age                INT,             -- FIFA age (e.g., 21)
  date_of_birth      DATE,
  photo_url          TEXT,            -- optional: URL to player image
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,  -- false = sold/released
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: season_stats
-- The core join/bridge table: one row per player per season.
-- Tracks OVR, market value, salary, and in-game stats.
-- UNIQUE constraint ensures no duplicate rows.
-- ============================================================
CREATE TABLE season_stats (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id            UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id            UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  -- Snapshot at season start
  ovr_start            INT,
  market_value_start   BIGINT,         -- stored in USD cents (avoid floats)
  salary               BIGINT,         -- annual salary in USD cents
  -- Snapshot at season end (filled when closing the season)
  ovr_end              INT,
  market_value_end     BIGINT,
  -- In-game performance stats
  matches_played       INT NOT NULL DEFAULT 0,
  goals                INT NOT NULL DEFAULT 0,
  assists              INT NOT NULL DEFAULT 0,
  yellow_cards         INT NOT NULL DEFAULT 0,
  red_cards            INT NOT NULL DEFAULT 0,
  clean_sheets         INT NOT NULL DEFAULT 0,  -- for GKs
  -- Free notes
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A player can only have one stats row per season
  UNIQUE(player_id, season_id)
);

-- ============================================================
-- TABLE: scouting_list
-- Players being tracked for potential transfers.
-- list_type separates them into 4 categories/columns.
-- ============================================================
CREATE TABLE scouting_list (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_id        UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  position         TEXT,
  nationality      TEXT,
  current_club     TEXT,
  current_ovr      INT,
  estimated_value  BIGINT,            -- in USD cents
  -- ENUM-like constraint: allowed list types
  list_type        TEXT NOT NULL CHECK (
    list_type IN ('wonderkid', 'sell', 'target', 'free_agent')
  ),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: formations
-- A saved tactical formation for a given season.
-- Multiple formations can exist per season (e.g., "4-3-3 Attack", "5-4-1 Defend")
-- ============================================================
CREATE TABLE formations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id   UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,         -- e.g., "4-3-3 Attack"
  scheme      TEXT NOT NULL,         -- e.g., "4-3-3", "4-4-2", "3-5-2"
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: formation_players
-- Maps players to positions on the pitch for a given formation.
-- x/y coordinates are relative (0.0 to 1.0) so they scale
-- with any screen size.
-- ============================================================
CREATE TABLE formation_players (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formation_id  UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  position_x    FLOAT NOT NULL,      -- 0.0 = left, 1.0 = right
  position_y    FLOAT NOT NULL,      -- 0.0 = top (opponent goal), 1.0 = bottom (own goal)
  slot_label    TEXT,                -- e.g., "LW", "CF", "BEN-1"
  UNIQUE(formation_id, player_id)    -- a player can only appear once per formation
);

-- ============================================================
-- TABLE: trophies
-- Trophies won in a specific season.
-- ============================================================
CREATE TABLE trophies (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id    UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  trophy_name  TEXT NOT NULL,        -- e.g., "Champions League", "La Liga"
  trophy_type  TEXT NOT NULL CHECK (
    trophy_type IN ('league', 'cup', 'international', 'individual', 'other')
  ),
  icon         TEXT,                  -- emoji or icon key, e.g., "🏆"
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES — Speed up common queries
-- ============================================================
CREATE INDEX idx_careers_user_id       ON careers(user_id);
CREATE INDEX idx_seasons_career_id     ON seasons(career_id);
CREATE INDEX idx_players_career_id     ON players(career_id);
CREATE INDEX idx_season_stats_player   ON season_stats(player_id);
CREATE INDEX idx_season_stats_season   ON season_stats(season_id);
CREATE INDEX idx_scouting_career       ON scouting_list(career_id);
CREATE INDEX idx_formations_season     ON formations(season_id);
CREATE INDEX idx_trophies_season       ON trophies(season_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Every user can only see and modify their own data.
-- This runs at the DATABASE level — not in JavaScript.
-- ============================================================

ALTER TABLE careers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE players        ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_stats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_list  ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE trophies       ENABLE ROW LEVEL SECURITY;

-- careers: user owns careers where user_id = their auth ID
CREATE POLICY "Users manage their own careers"
  ON careers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- seasons: accessible if the parent career belongs to the user
CREATE POLICY "Users manage seasons of their careers"
  ON seasons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM careers WHERE careers.id = seasons.career_id
    AND careers.user_id = auth.uid()
  ));

-- players: accessible if the parent career belongs to the user
CREATE POLICY "Users manage players of their careers"
  ON players FOR ALL
  USING (EXISTS (
    SELECT 1 FROM careers WHERE careers.id = players.career_id
    AND careers.user_id = auth.uid()
  ));

-- season_stats: accessible if the parent player's career belongs to the user
CREATE POLICY "Users manage stats of their players"
  ON season_stats FOR ALL
  USING (EXISTS (
    SELECT 1 FROM players
    JOIN careers ON careers.id = players.career_id
    WHERE players.id = season_stats.player_id
    AND careers.user_id = auth.uid()
  ));

-- scouting_list
CREATE POLICY "Users manage their scouting lists"
  ON scouting_list FOR ALL
  USING (EXISTS (
    SELECT 1 FROM careers WHERE careers.id = scouting_list.career_id
    AND careers.user_id = auth.uid()
  ));

-- formations
CREATE POLICY "Users manage their formations"
  ON formations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM seasons
    JOIN careers ON careers.id = seasons.career_id
    WHERE seasons.id = formations.season_id
    AND careers.user_id = auth.uid()
  ));

-- formation_players
CREATE POLICY "Users manage their formation players"
  ON formation_players FOR ALL
  USING (EXISTS (
    SELECT 1 FROM formations
    JOIN seasons ON seasons.id = formations.season_id
    JOIN careers ON careers.id = seasons.career_id
    WHERE formations.id = formation_players.formation_id
    AND careers.user_id = auth.uid()
  ));

-- trophies
CREATE POLICY "Users manage their trophies"
  ON trophies FOR ALL
  USING (EXISTS (
    SELECT 1 FROM seasons
    JOIN careers ON careers.id = seasons.career_id
    WHERE seasons.id = trophies.season_id
    AND careers.user_id = auth.uid()
  ));
