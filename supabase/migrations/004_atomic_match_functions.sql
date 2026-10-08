-- ============================================================
-- Migration: 004_atomic_match_functions.sql
-- Makes match logging atomic and fixes the season_stats counters.
--
-- Before: the client inserted the match, inserted the events and then
-- incremented season_stats by hand in several separate calls. A network
-- failure in the middle left matches and counters out of sync, and the
-- players hook silently rewrote the counters on every read.
--
-- Now: match_events is the single source of truth. Each function below
-- runs in one transaction and recomputes the counters from the events.
-- All functions are SECURITY INVOKER, so Row Level Security still applies.
--
-- Counter rules (recalculate_season_stats):
--   matches_played = events with played = TRUE and not injured
--   goals, assists = sums of the events
--   yellow_cards, red_cards, clean_sheets = events with the flag set
-- ============================================================

-- ------------------------------------------------------------
-- recalculate_season_stats: rebuild the counters of a season from
-- its match events. Players without events are reset to zero.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_season_stats(p_season_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  WITH agg AS (
    SELECT
      me.player_id,
      COUNT(*) FILTER (WHERE me.played AND NOT COALESCE(me.injured, FALSE)) AS matches_played,
      COALESCE(SUM(me.goals), 0)                                            AS goals,
      COALESCE(SUM(me.assists), 0)                                          AS assists,
      COUNT(*) FILTER (WHERE COALESCE(me.yellow_card, FALSE))               AS yellow_cards,
      COUNT(*) FILTER (WHERE COALESCE(me.red_card, FALSE))                  AS red_cards,
      COUNT(*) FILTER (WHERE COALESCE(me.clean_sheet, FALSE))               AS clean_sheets
    FROM match_events me
    JOIN matches m ON m.id = me.match_id
    WHERE m.season_id = p_season_id
    GROUP BY me.player_id
  )
  UPDATE season_stats ss
  SET matches_played = COALESCE((SELECT a.matches_played FROM agg a WHERE a.player_id = ss.player_id), 0),
      goals          = COALESCE((SELECT a.goals          FROM agg a WHERE a.player_id = ss.player_id), 0),
      assists        = COALESCE((SELECT a.assists        FROM agg a WHERE a.player_id = ss.player_id), 0),
      yellow_cards   = COALESCE((SELECT a.yellow_cards   FROM agg a WHERE a.player_id = ss.player_id), 0),
      red_cards      = COALESCE((SELECT a.red_cards      FROM agg a WHERE a.player_id = ss.player_id), 0),
      clean_sheets   = COALESCE((SELECT a.clean_sheets   FROM agg a WHERE a.player_id = ss.player_id), 0),
      updated_at     = NOW()
  WHERE ss.season_id = p_season_id;
$$;

-- ------------------------------------------------------------
-- Internal helper: validates the season and inserts the events of a
-- match. p_events is a JSON array of objects with the keys
-- player_id, played, goals, assists, yellow_card, red_card,
-- clean_sheet and injured (everything except player_id is optional).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._insert_match_events(
  p_match_id  UUID,
  p_career_id UUID,
  p_events    JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Every player must belong to the same career as the season.
  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(COALESCE(p_events, '[]'::jsonb)) AS e(player_id UUID)
    LEFT JOIN players p ON p.id = e.player_id AND p.career_id = p_career_id
    WHERE p.id IS NULL
  ) THEN
    RAISE EXCEPTION 'One or more players do not belong to this career';
  END IF;

  INSERT INTO match_events
    (match_id, player_id, played, goals, assists, yellow_card, red_card, clean_sheet, injured)
  SELECT
    p_match_id,
    e.player_id,
    COALESCE(e.played, FALSE),
    COALESCE(e.goals, 0),
    COALESCE(e.assists, 0),
    COALESCE(e.yellow_card, FALSE),
    COALESCE(e.red_card, FALSE),
    COALESCE(e.clean_sheet, FALSE),
    COALESCE(e.injured, FALSE)
  FROM jsonb_to_recordset(COALESCE(p_events, '[]'::jsonb)) AS e(
    player_id   UUID,
    played      BOOLEAN,
    goals       INT,
    assists     INT,
    yellow_card BOOLEAN,
    red_card    BOOLEAN,
    clean_sheet BOOLEAN,
    injured     BOOLEAN
  );
END;
$$;

-- ------------------------------------------------------------
-- log_match: create a match with its events and refresh the counters.
-- Returns the new match id.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_match(
  p_season_id      UUID,
  p_opponent       TEXT,
  p_competition    TEXT,
  p_team_score     INT,
  p_opponent_score INT,
  p_mvp_player_id  UUID,
  p_match_date     DATE,
  p_events         JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_career_id UUID;
  v_is_closed BOOLEAN;
  v_match_id  UUID;
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

  INSERT INTO matches
    (season_id, opponent, competition, team_score, opponent_score, result, mvp_player_id, match_date)
  VALUES (
    p_season_id,
    p_opponent,
    COALESCE(NULLIF(p_competition, ''), 'League'),
    p_team_score,
    p_opponent_score,
    CASE
      WHEN p_team_score > p_opponent_score THEN 'win'
      WHEN p_team_score < p_opponent_score THEN 'loss'
      ELSE 'draw'
    END,
    p_mvp_player_id,
    COALESCE(p_match_date, CURRENT_DATE)
  )
  RETURNING id INTO v_match_id;

  PERFORM _insert_match_events(v_match_id, v_career_id, p_events);
  PERFORM recalculate_season_stats(p_season_id);

  RETURN v_match_id;
END;
$$;

-- ------------------------------------------------------------
-- update_match: replace the details and events of a match.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_match(
  p_match_id       UUID,
  p_opponent       TEXT,
  p_competition    TEXT,
  p_team_score     INT,
  p_opponent_score INT,
  p_mvp_player_id  UUID,
  p_events         JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
  v_career_id UUID;
  v_is_closed BOOLEAN;
BEGIN
  SELECT m.season_id, s.career_id, s.is_closed INTO v_season_id, v_career_id, v_is_closed
  FROM matches m
  JOIN seasons s ON s.id = m.season_id
  WHERE m.id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  IF v_is_closed THEN
    RAISE EXCEPTION 'Season is closed';
  END IF;

  UPDATE matches
  SET opponent       = p_opponent,
      competition    = COALESCE(NULLIF(p_competition, ''), 'League'),
      team_score     = p_team_score,
      opponent_score = p_opponent_score,
      result         = CASE
                         WHEN p_team_score > p_opponent_score THEN 'win'
                         WHEN p_team_score < p_opponent_score THEN 'loss'
                         ELSE 'draw'
                       END,
      mvp_player_id  = p_mvp_player_id
  WHERE id = p_match_id;

  DELETE FROM match_events WHERE match_id = p_match_id;
  PERFORM _insert_match_events(p_match_id, v_career_id, p_events);
  PERFORM recalculate_season_stats(v_season_id);
END;
$$;

-- ------------------------------------------------------------
-- delete_match: remove a match (events cascade) and refresh counters.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_match(p_match_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_season_id UUID;
  v_is_closed BOOLEAN;
BEGIN
  SELECT m.season_id, s.is_closed INTO v_season_id, v_is_closed
  FROM matches m
  JOIN seasons s ON s.id = m.season_id
  WHERE m.id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  IF v_is_closed THEN
    RAISE EXCEPTION 'Season is closed';
  END IF;

  DELETE FROM matches WHERE id = p_match_id;
  PERFORM recalculate_season_stats(v_season_id);
END;
$$;

-- ------------------------------------------------------------
-- Permissions: only signed-in users can call these functions.
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.recalculate_season_stats(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._insert_match_events(UUID, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_match(UUID, TEXT, TEXT, INT, INT, UUID, DATE, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_match(UUID, TEXT, TEXT, INT, INT, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_match(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.recalculate_season_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public._insert_match_events(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_match(UUID, TEXT, TEXT, INT, INT, UUID, DATE, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_match(UUID, TEXT, TEXT, INT, INT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_match(UUID) TO authenticated;

-- ------------------------------------------------------------
-- One-time correction of existing data: rebuild the counters of every
-- season that has logged matches. Seasons without matches are left
-- alone so manually entered stats are not wiped. Safe to re-run: the
-- result only depends on match_events.
-- ------------------------------------------------------------
DO $$
DECLARE
  s RECORD;
BEGIN
  FOR s IN SELECT DISTINCT season_id FROM matches LOOP
    PERFORM recalculate_season_stats(s.season_id);
  END LOOP;
END $$;
