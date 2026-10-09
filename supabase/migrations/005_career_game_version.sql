-- ============================================================
-- Migration: 005_career_game_version.sql
-- Adds careers.game_version: which game the save belongs to
-- (e.g. 'FC27', 'FC26', 'FIFA23'). Nullable, because careers
-- created before this migration do not know it; the app lets the
-- user fill it in. Kept as free text (validated by a pattern) so a
-- new yearly release does not need another migration.
-- Non-destructive and safe to re-run. Row Level Security on
-- careers already covers the new column.
-- ============================================================

ALTER TABLE careers
  ADD COLUMN IF NOT EXISTS game_version TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'careers_game_version_format'
  ) THEN
    ALTER TABLE careers
      ADD CONSTRAINT careers_game_version_format
      CHECK (game_version IS NULL OR game_version ~ '^(FIFA|FC)[0-9]{2}$');
  END IF;
END $$;

COMMENT ON COLUMN careers.game_version IS 'Game the career save belongs to, e.g. FC26 or FIFA23';
