-- ============================================================
-- Read-only check, run it BEFORE applying migration 007.
--
-- Lists existing rows whose references point to different careers.
-- Migration 007 only checks rows when they are written, so a row
-- listed here would make the next update to it fail. Every count
-- should be 0.
-- ============================================================

SELECT 'season_stats: player and season of different careers' AS problem, COUNT(*) AS rows
FROM season_stats ss
JOIN players p ON p.id = ss.player_id
JOIN seasons s ON s.id = ss.season_id
WHERE p.career_id <> s.career_id

UNION ALL

SELECT 'match_events: player from another career than the match', COUNT(*)
FROM match_events me
JOIN matches m ON m.id = me.match_id
JOIN seasons s ON s.id = m.season_id
JOIN players p ON p.id = me.player_id
WHERE p.career_id <> s.career_id

UNION ALL

SELECT 'matches: MVP player from another career', COUNT(*)
FROM matches m
JOIN seasons s ON s.id = m.season_id
JOIN players p ON p.id = m.mvp_player_id
WHERE p.career_id <> s.career_id

UNION ALL

SELECT 'formation_players: player from another career', COUNT(*)
FROM formation_players fp
JOIN formations f ON f.id = fp.formation_id
JOIN seasons s ON s.id = f.season_id
JOIN players p ON p.id = fp.player_id
WHERE p.career_id <> s.career_id;
