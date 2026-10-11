-- ============================================================
-- Migration: 008_close_season.sql
-- Closes a season and starts the next one in a single transaction.
--
-- close_season(p_season_id, p_next_year_label, p_players)
--   p_players  JSON array of objects with the keys player_id,
--              ovr_end (1..99), market_value_end (cents, >= 0) and
--              leaves (TRUE when the player does not continue at the
--              club next season). Missing keys keep the column NULL.
--
-- Steps:
--   1. Saves the end-of-season snapshot (ovr_end, market_value_end)
--      and rebuilds the counters from the match events.
--   2. Marks departing players inactive (their history stays).
--   3. Closes the season: from now on it is read-only.
--   4. Creates the next season and carries the squad over: every
--      player still at the club starts it with the OVR and value
--      they ended the closed season with, and the same salary.
--   5. Copies the starting XI, without the players who left.
--
-- Only the latest season of a career can be closed, so seasons stay
-- in order. SECURITY INVOKER, so Row Level Security still applies.
-- Returns the id of the new season.
-- ============================================================

CREATE OR REPLACE FUNCTION public.close_season(
  p_season_id       UUID,
  p_next_year_label TEXT,
  p_players         JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_career_id         UUID;
  v_is_closed         BOOLEAN;
  v_season_number     INT;
  v_next_label        TEXT := NULLIF(trim(p_next_year_label), '');
  v_next_season_id    UUID;
  v_formation_id      UUID;
  v_new_formation_id  UUID;
BEGIN
  IF v_next_label IS NULL THEN
    RAISE EXCEPTION 'The next season needs a name';
  END IF;

  -- Lock the season so two tabs cannot close it at the same time.
  -- RLS hides seasons of other users, so a foreign season looks "not found".
  SELECT career_id, is_closed, season_number
  INTO v_career_id, v_is_closed, v_season_number
  FROM seasons
  WHERE id = p_season_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Season not found';
  END IF;
  IF v_is_closed THEN
    RAISE EXCEPTION 'Season is closed';
  END IF;
  IF EXISTS (
    SELECT 1 FROM seasons
    WHERE career_id = v_career_id AND season_number > v_season_number
  ) THEN
    RAISE EXCEPTION 'Only the latest season can be closed';
  END IF;

  -- Every player must belong to the same career as the season.
  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(COALESCE(p_players, '[]'::jsonb)) AS x(player_id UUID)
    LEFT JOIN players p ON p.id = x.player_id AND p.career_id = v_career_id
    WHERE p.id IS NULL
  ) THEN
    RAISE EXCEPTION 'One or more players do not belong to this career';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(COALESCE(p_players, '[]'::jsonb)) AS x(ovr_end INT, market_value_end BIGINT)
    WHERE x.ovr_end NOT BETWEEN 1 AND 99 OR x.market_value_end < 0
  ) THEN
    RAISE EXCEPTION 'OVR must be between 1 and 99 and values cannot be negative';
  END IF;

  -- 1. End-of-season snapshot. Upsert, so a player without a stats row
  --    in this season (added while no season was open) still gets one.
  INSERT INTO season_stats (player_id, season_id, ovr_end, market_value_end)
  SELECT x.player_id, p_season_id, x.ovr_end, x.market_value_end
  FROM jsonb_to_recordset(COALESCE(p_players, '[]'::jsonb)) AS x(
    player_id        UUID,
    ovr_end          INT,
    market_value_end BIGINT
  )
  ON CONFLICT (player_id, season_id) DO UPDATE
  SET ovr_end          = EXCLUDED.ovr_end,
      market_value_end = EXCLUDED.market_value_end,
      updated_at       = NOW();

  PERFORM recalculate_season_stats(p_season_id);

  -- 2. Departures
  UPDATE players p
  SET is_active = FALSE, updated_at = NOW()
  FROM jsonb_to_recordset(COALESCE(p_players, '[]'::jsonb)) AS x(player_id UUID, leaves BOOLEAN)
  WHERE p.id = x.player_id
    AND p.career_id = v_career_id
    AND COALESCE(x.leaves, FALSE);

  -- 3. Close the season
  UPDATE seasons
  SET is_closed = TRUE, is_active = FALSE
  WHERE id = p_season_id;

  -- 4. Next season, active from now on
  UPDATE seasons
  SET is_active = FALSE
  WHERE career_id = v_career_id AND is_active;

  INSERT INTO seasons (career_id, year_label, season_number, is_active, is_closed)
  VALUES (v_career_id, v_next_label, v_season_number + 1, TRUE, FALSE)
  RETURNING id INTO v_next_season_id;

  -- Injuries are not carried over: the summer break is long enough for
  -- most of them, and the user can mark a player injured again.
  INSERT INTO season_stats (player_id, season_id, ovr_start, market_value_start, salary, is_injured)
  SELECT
    p.id,
    v_next_season_id,
    COALESCE(ss.ovr_end, ss.ovr_start),
    COALESCE(ss.market_value_end, ss.market_value_start),
    ss.salary,
    FALSE
  FROM players p
  LEFT JOIN season_stats ss ON ss.player_id = p.id AND ss.season_id = p_season_id
  WHERE p.career_id = v_career_id
    AND p.is_active;

  -- 5. Starting XI
  SELECT id INTO v_formation_id
  FROM formations
  WHERE season_id = p_season_id AND is_default;

  IF v_formation_id IS NOT NULL THEN
    INSERT INTO formations (season_id, name, scheme, is_default)
    SELECT v_next_season_id, name, scheme, TRUE
    FROM formations
    WHERE id = v_formation_id
    RETURNING id INTO v_new_formation_id;

    INSERT INTO formation_players
      (formation_id, player_id, slot_index, slot_label, position_x, position_y)
    SELECT v_new_formation_id, fp.player_id, fp.slot_index, fp.slot_label, fp.position_x, fp.position_y
    FROM formation_players fp
    JOIN players p ON p.id = fp.player_id AND p.is_active
    WHERE fp.formation_id = v_formation_id;
  END IF;

  RETURN v_next_season_id;
END;
$$;

REVOKE ALL ON FUNCTION public.close_season(UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.close_season(UUID, TEXT, JSONB) TO authenticated;
