-- ============================================================
-- Migration: 006_season_lineups.sql
-- Stores the starting XI of each season in the database so it
-- follows the user across devices (it used to live in the
-- browser's localStorage).
--
-- Reuses the tables created in 001 that the app never wrote to:
--   formations         one default row per season (the chosen scheme)
--   formation_players  the player assigned to each pitch slot
--
-- Adds slot_index to formation_players (0..10, the position in the
-- scheme's slot list) plus the uniqueness rules that make a lineup
-- well formed, and a function that saves a lineup atomically.
-- ============================================================

ALTER TABLE formation_players
  ADD COLUMN IF NOT EXISTS slot_index SMALLINT
  CHECK (slot_index BETWEEN 0 AND 10);

-- One default formation per season
CREATE UNIQUE INDEX IF NOT EXISTS uq_formations_default_per_season
  ON formations (season_id)
  WHERE is_default;

-- A slot holds one player (a player is already unique per formation)
CREATE UNIQUE INDEX IF NOT EXISTS uq_formation_players_slot
  ON formation_players (formation_id, slot_index);

CREATE INDEX IF NOT EXISTS idx_formation_players_formation
  ON formation_players (formation_id);

-- ------------------------------------------------------------
-- save_lineup: replace the default lineup of a season.
--   p_scheme  formation scheme, e.g. '4-3-3 Attack'
--   p_slots   JSON array of objects with the keys slot_index,
--             player_id, slot_label (pitch role), position_x and
--             position_y (0..1). Empty slots are simply omitted.
-- Runs in one transaction. SECURITY INVOKER, so RLS still applies.
-- Returns the formation id.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_lineup(
  p_season_id UUID,
  p_scheme    TEXT,
  p_slots     JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_career_id    UUID;
  v_is_closed    BOOLEAN;
  v_formation_id UUID;
BEGIN
  -- RLS hides seasons of other users, so a foreign season looks "not found".
  SELECT career_id, is_closed INTO v_career_id, v_is_closed
  FROM seasons WHERE id = p_season_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Season not found';
  END IF;
  IF v_is_closed THEN
    RAISE EXCEPTION 'Season is closed';
  END IF;

  -- Every player must belong to the same career as the season.
  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(COALESCE(p_slots, '[]'::jsonb)) AS s(player_id UUID)
    LEFT JOIN players p ON p.id = s.player_id AND p.career_id = v_career_id
    WHERE p.id IS NULL
  ) THEN
    RAISE EXCEPTION 'One or more players do not belong to this career';
  END IF;

  SELECT id INTO v_formation_id
  FROM formations
  WHERE season_id = p_season_id AND is_default;

  IF v_formation_id IS NULL THEN
    INSERT INTO formations (season_id, name, scheme, is_default)
    VALUES (p_season_id, p_scheme, p_scheme, TRUE)
    RETURNING id INTO v_formation_id;
  ELSE
    UPDATE formations
    SET name = p_scheme, scheme = p_scheme
    WHERE id = v_formation_id;
  END IF;

  DELETE FROM formation_players WHERE formation_id = v_formation_id;

  INSERT INTO formation_players
    (formation_id, player_id, slot_index, slot_label, position_x, position_y)
  SELECT
    v_formation_id,
    s.player_id,
    s.slot_index,
    s.slot_label,
    COALESCE(s.position_x, 0.5),
    COALESCE(s.position_y, 0.5)
  FROM jsonb_to_recordset(COALESCE(p_slots, '[]'::jsonb)) AS s(
    slot_index SMALLINT,
    player_id  UUID,
    slot_label TEXT,
    position_x FLOAT,
    position_y FLOAT
  );

  RETURN v_formation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_lineup(UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_lineup(UUID, TEXT, JSONB) TO authenticated;
