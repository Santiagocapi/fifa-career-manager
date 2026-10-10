-- ============================================================
-- Migration: 007_rls_hardening_and_account_deletion.sql
--
-- 1. Cross-career references. The original policies check that the
--    *parent* row belongs to the signed-in user, but not that the
--    other foreign keys of the row point to the same career. A user
--    who knew another user's UUID could attach their own rows to it.
--    The policies below add an explicit WITH CHECK that every
--    reference of a row stays inside one career:
--      season_stats       player and season of the same career
--      match_events       player of the same career as the match
--      matches            MVP player of the same career as the season
--      formation_players  player of the same career as the formation
--    The USING part (what a user can read, update or delete) is
--    unchanged, so existing data keeps working.
--
-- 2. delete_my_account(p_email): lets a signed-in user delete their
--    own account and, through ON DELETE CASCADE, all their data.
--
-- Safe to re-run: policies are dropped and recreated.
-- Before applying, check that no existing row would violate the new
-- checks (queries in supabase/scripts/check_career_references.sql).
-- ============================================================

-- ------------------------------------------------------------
-- season_stats
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage stats of their players" ON season_stats;

CREATE POLICY "Users manage stats of their players"
  ON season_stats FOR ALL
  USING (EXISTS (
    SELECT 1
    FROM players p
    JOIN careers c ON c.id = p.career_id
    WHERE p.id = season_stats.player_id
      AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM players p
    JOIN seasons s ON s.career_id = p.career_id
    JOIN careers c ON c.id = p.career_id
    WHERE p.id = season_stats.player_id
      AND s.id = season_stats.season_id
      AND c.user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- matches
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage matches" ON matches;

CREATE POLICY "Users manage matches"
  ON matches FOR ALL
  USING (EXISTS (
    SELECT 1
    FROM seasons s
    JOIN careers c ON c.id = s.career_id
    WHERE s.id = matches.season_id
      AND c.user_id = auth.uid()
  ))
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM seasons s
      JOIN careers c ON c.id = s.career_id
      WHERE s.id = matches.season_id
        AND c.user_id = auth.uid()
    )
    AND (
      matches.mvp_player_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM seasons s
        JOIN players p ON p.career_id = s.career_id
        WHERE s.id = matches.season_id
          AND p.id = matches.mvp_player_id
      )
    )
  );

-- ------------------------------------------------------------
-- match_events
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage match events" ON match_events;

CREATE POLICY "Users manage match events"
  ON match_events FOR ALL
  USING (EXISTS (
    SELECT 1
    FROM matches m
    JOIN seasons s ON s.id = m.season_id
    JOIN careers c ON c.id = s.career_id
    WHERE m.id = match_events.match_id
      AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM matches m
    JOIN seasons s ON s.id = m.season_id
    JOIN careers c ON c.id = s.career_id
    JOIN players p ON p.career_id = s.career_id
    WHERE m.id = match_events.match_id
      AND p.id = match_events.player_id
      AND c.user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- formation_players
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users manage their formation players" ON formation_players;

CREATE POLICY "Users manage their formation players"
  ON formation_players FOR ALL
  USING (EXISTS (
    SELECT 1
    FROM formations f
    JOIN seasons s ON s.id = f.season_id
    JOIN careers c ON c.id = s.career_id
    WHERE f.id = formation_players.formation_id
      AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM formations f
    JOIN seasons s ON s.id = f.season_id
    JOIN careers c ON c.id = s.career_id
    JOIN players p ON p.career_id = s.career_id
    WHERE f.id = formation_players.formation_id
      AND p.id = formation_players.player_id
      AND c.user_id = auth.uid()
  ));

-- ------------------------------------------------------------
-- delete_my_account: removes the signed-in user. Every table of
-- the app hangs from careers.user_id with ON DELETE CASCADE, so
-- their careers, seasons, players, matches and lineups go too.
--
-- SECURITY DEFINER is required because regular users cannot write
-- to auth.users. It can only ever delete auth.uid(), and the caller
-- must pass their own email as a guard against accidental calls.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_my_account(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email   TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  IF v_email IS NULL OR lower(trim(p_email)) <> lower(v_email) THEN
    RAISE EXCEPTION 'The email does not match this account';
  END IF;

  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_my_account(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account(TEXT) TO authenticated;
