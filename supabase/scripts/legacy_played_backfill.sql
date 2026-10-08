-- ============================================================
-- One-time data fix (NOT a migration): legacy "played" backfill.
--
-- Why: before match_events.played existed, the app did not record who
-- started a match. Migration 003 backfilled played with a weak rule
-- (goals, assists, cards or MVP), which leaves regular starters with no
-- stats as "not played". This script improves that for ONE season using
-- the Starting XI saved in the Tactics page of the owner's browser.
--
-- What it does for the season below:
--   1. Marks played = TRUE for rows of players in the Starting XI, in
--      addition to players with stats or MVP (it only turns FALSE to TRUE).
--   2. Early matches only stored rows for players with stats. For every
--      Starting XI player with NO row in a match, and who already existed
--      in the squad when the match was logged, it creates a row with
--      played = TRUE and everything else at zero.
--   3. Recalculates season_stats for the season.
--
-- It is an APPROXIMATION: it assumes the Starting XI played every legacy
-- match. Matches logged from now on are exact.
--
-- Requirements: migrations 003 and 004 must already be applied.
-- Run it ONCE. Re-running after you edited matches by hand could set
-- players back to played = TRUE.
--
-- HOW TO RUN: keep v_dry_run = TRUE first. The script then rolls back
-- and shows, as an error message, how many rows would change and the
-- resulting matches played per player. When it looks right, set
-- v_dry_run := FALSE and run it again.
-- ============================================================

DO $$
DECLARE
  v_dry_run   BOOLEAN := TRUE;   -- set to FALSE to really apply the changes
  v_season_id UUID    := 'bd0893f5-3198-4c7b-81b6-1fb5e153d9c0';
  v_starters  UUID[]  := ARRAY[
    'f6bf270e-f260-4c89-b83d-6ac035c2c7a6',
    'db8b4664-d2d1-4b2b-9e55-914f6efc9c06',
    '71e80b14-fba9-4d33-9c3c-1dab129a397a',
    '5f5209f6-f67c-43f7-b590-b027d15e1f35',
    '10196721-94e7-42ea-aed9-fe8fcb4ead63',
    'ea2f691f-5249-4b63-9bb8-0835059372b8',
    '162228de-8b0d-44ad-9432-e5998506c01f',
    '227168fe-ffdc-436a-851b-702d3a41bda0',
    'c1e5d007-aedb-4578-ac74-95bcb177eac3',
    '9fbfde93-9977-4caf-9a3c-e971c5ff8ed0',
    '6b09c69f-ff52-478b-a924-028ec72bff2e'
  ]::UUID[];
  v_updated   INT;
  v_inserted  INT;
  v_report    TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM seasons WHERE id = v_season_id) THEN
    RAISE NOTICE 'Season % not found, nothing to do', v_season_id;
    RETURN;
  END IF;

  -- 1. Starting XI (or players with stats / MVP) count as having played.
  UPDATE match_events me
  SET played = TRUE
  FROM matches m
  WHERE m.id = me.match_id
    AND m.season_id = v_season_id
    AND me.played = FALSE
    AND (
      me.player_id = ANY(v_starters)
      OR COALESCE(me.goals, 0) > 0
      OR COALESCE(me.assists, 0) > 0
      OR COALESCE(me.yellow_card, FALSE)
      OR COALESCE(me.red_card, FALSE)
      OR m.mvp_player_id = me.player_id
    );
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- 2. Create the missing rows of starters in matches that stored none.
  INSERT INTO match_events
    (match_id, player_id, played, goals, assists, yellow_card, red_card, clean_sheet, injured)
  SELECT m.id, p.id, TRUE, 0, 0, FALSE, FALSE, FALSE, FALSE
  FROM matches m
  JOIN seasons s ON s.id = m.season_id
  JOIN players p ON p.id = ANY(v_starters) AND p.career_id = s.career_id
  WHERE m.season_id = v_season_id
    AND p.created_at <= m.created_at
    AND NOT EXISTS (
      SELECT 1 FROM match_events x
      WHERE x.match_id = m.id AND x.player_id = p.id
    );
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- 3. Rebuild the counters from the corrected events.
  PERFORM recalculate_season_stats(v_season_id);

  IF v_dry_run THEN
    SELECT string_agg(
             p.full_name || ': ' || ss.matches_played,
             E'\n' ORDER BY ss.matches_played DESC, p.full_name
           )
    INTO v_report
    FROM season_stats ss
    JOIN players p ON p.id = ss.player_id
    WHERE ss.season_id = v_season_id;

    RAISE EXCEPTION E'DRY RUN - nothing was saved.\nRows set to played: %\nRows created: %\nMatches played per player:\n%',
      v_updated, v_inserted, v_report;
  END IF;

  RAISE NOTICE 'Rows set to played: %, rows created: %', v_updated, v_inserted;
END $$;
