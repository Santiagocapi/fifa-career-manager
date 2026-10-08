-- ============================================================
-- Migration: 003_played_flag_and_injured.sql
-- Adds (non-destructive, safe to re-run):
-- 1. season_stats.is_injured  - the app already reads/writes it, but no
--    earlier migration created it.
-- 2. match_events.played      - whether the player actually took part in
--    the match, so bench players no longer count as "played".
--
-- Existing rows are backfilled with an approximate rule, because the
-- old data cannot tell a starter with no stats from an unused substitute:
--   played = goals > 0 OR assists > 0 OR yellow card OR red card
--            OR the player was the match MVP.
-- Players with none of those are marked as not played.
-- The backfill runs only when the column is first created, so
-- re-running this file never overwrites real data.
-- ============================================================

-- 1. Injury flag (idempotent)
ALTER TABLE season_stats
  ADD COLUMN IF NOT EXISTS is_injured BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Played flag + one-time backfill
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'match_events'
      AND column_name  = 'played'
  ) THEN
    ALTER TABLE match_events
      ADD COLUMN played BOOLEAN NOT NULL DEFAULT FALSE;

    UPDATE match_events me
    SET played = TRUE
    WHERE COALESCE(me.goals, 0) > 0
       OR COALESCE(me.assists, 0) > 0
       OR COALESCE(me.yellow_card, FALSE)
       OR COALESCE(me.red_card, FALSE)
       OR EXISTS (
         SELECT 1
         FROM matches m
         WHERE m.id = me.match_id
           AND m.mvp_player_id = me.player_id
       );
  END IF;
END $$;
