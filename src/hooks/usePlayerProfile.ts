// ============================================================
// src/hooks/usePlayerProfile.ts
// One player across the whole career: their season_stats rows
// (one per season they were at the club) and every match event,
// for the player profile page.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Player, PlayerMatchEvent, PlayerSeasonStats, SeasonStats } from '../types/database';
import { updatePlayerRow, updateSeasonStatsRow } from './usePlayers';

interface UsePlayerProfileReturn {
  /** null once loaded means the player does not exist in this career */
  player: Player | null;
  /** Oldest season first */
  seasons: PlayerSeasonStats[];
  /** Most recent match first */
  events: PlayerMatchEvent[];
  loading: boolean;
  error: string | null;
  updatePlayer: (data: Partial<Player>) => Promise<boolean>;
  updateStats: (seasonId: string, data: Partial<SeasonStats>) => Promise<boolean>;
  refetch: () => void;
}

export const usePlayerProfile = (careerId: string | null, playerId: string | null): UsePlayerProfileReturn => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [seasons, setSeasons] = useState<PlayerSeasonStats[]>([]);
  const [events, setEvents] = useState<PlayerMatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!careerId || !playerId) {
      setPlayer(null);
      setSeasons([]);
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [playerRes, statsRes, eventsRes] = await Promise.all([
      supabase.from('players').select('*').eq('id', playerId).eq('career_id', careerId).maybeSingle(),
      supabase.from('season_stats').select('*, season:season_id(*)').eq('player_id', playerId),
      supabase.from('match_events').select('*, match:match_id(*)').eq('player_id', playerId),
    ]);

    const err = playerRes.error ?? statsRes.error ?? eventsRes.error;
    if (err) setError(err.message);

    setPlayer((playerRes.data as Player | null) ?? null);
    setSeasons(
      ((statsRes.data as PlayerSeasonStats[] | null) ?? [])
        .filter((row) => row.season)
        .sort((a, b) => a.season.season_number - b.season.season_number)
    );
    // Ordering by an embedded table in PostgREST only sorts the embedded rows,
    // so matches are sorted here (same-day matches by when they were logged).
    setEvents(
      ((eventsRes.data as PlayerMatchEvent[] | null) ?? [])
        .filter((row) => row.match)
        .sort(
          (a, b) =>
            b.match.match_date.localeCompare(a.match.match_date) ||
            b.match.created_at.localeCompare(a.match.created_at)
        )
    );
    setLoading(false);
  }, [careerId, playerId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updatePlayer = async (data: Partial<Player>): Promise<boolean> => {
    if (!player) return false;
    const err = await updatePlayerRow(player.id, data);
    if (err) {
      setError(err);
      return false;
    }
    setPlayer((prev) => (prev ? { ...prev, ...data } : prev));
    return true;
  };

  const updateStats = async (seasonId: string, data: Partial<SeasonStats>): Promise<boolean> => {
    if (!player) return false;
    const err = await updateSeasonStatsRow(player.id, seasonId, data);
    if (err) {
      setError(err);
      return false;
    }
    setSeasons((prev) => prev.map((row) => (row.season_id === seasonId ? { ...row, ...data } : row)));
    return true;
  };

  return { player, seasons, events, loading, error, updatePlayer, updateStats, refetch: fetchProfile };
};
