// ============================================================
// src/hooks/useSeasons.ts
// Season management: create a career's first season, and close
// a season, which atomically starts the next one (close_season,
// migration 008).
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Season } from '../types/database';
import { useAppStore } from '../store/useAppStore';

/** End-of-season snapshot of one player, sent to close_season */
export interface ClosingPlayer {
  player_id: string;
  ovr_end: number | null;
  /** In cents */
  market_value_end: number | null;
  /** The player does not continue at the club next season */
  leaves: boolean;
}

interface UseSeasonsReturn {
  seasons: Season[];
  loading: boolean;
  error: string | null;
  createSeason: (yearLabel: string) => Promise<Season | null>;
  /** Returns the new season, or null if it failed (see `error`) */
  closeSeason: (seasonId: string, nextYearLabel: string, players: ClosingPlayer[]) => Promise<Season | null>;
  refetch: () => void;
}

export const useSeasons = (careerId: string | null): UseSeasonsReturn => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setActiveSeason } = useAppStore();

  const fetchSeasons = useCallback(async () => {
    if (!careerId) { setSeasons([]); setLoading(false); return; }

    setLoading(true);
    const { data, error: err } = await supabase
      .from('seasons')
      .select('*')
      .eq('career_id', careerId)
      .order('season_number', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setSeasons(data ?? []);
      // Auto-set the active season to the most recent open one
      const activeSeason = data?.find(s => s.is_active && !s.is_closed);
      if (activeSeason) setActiveSeason(activeSeason);
    }
    setLoading(false);
  }, [careerId, setActiveSeason]);

  useEffect(() => { fetchSeasons(); }, [fetchSeasons]);

  const createSeason = async (yearLabel: string): Promise<Season | null> => {
    if (!careerId) return null;

    // First, mark all current active seasons as inactive
    await supabase
      .from('seasons')
      .update({ is_active: false })
      .eq('career_id', careerId);

    const seasonNumber = seasons.length + 1;
    const { data, error: err } = await supabase
      .from('seasons')
      .insert({
        career_id: careerId,
        year_label: yearLabel,
        season_number: seasonNumber,
        is_active: true,
        is_closed: false,
      })
      .select()
      .single();

    if (err) { setError(err.message); return null; }

    setSeasons(prev => [...prev, data]);
    setActiveSeason(data);
    return data;
  };

  const closeSeason = async (
    seasonId: string,
    nextYearLabel: string,
    players: ClosingPlayer[]
  ): Promise<Season | null> => {
    if (!careerId) return null;
    setError(null);
    const { data: nextSeasonId, error: err } = await supabase.rpc('close_season', {
      p_season_id: seasonId,
      p_next_year_label: nextYearLabel,
      p_players: players,
    });

    if (err) { setError(err.message); return null; }

    const { data, error: fetchErr } = await supabase
      .from('seasons')
      .select('*')
      .eq('career_id', careerId)
      .order('season_number', { ascending: true });

    if (fetchErr) { setError(fetchErr.message); return null; }

    const nextSeason = data?.find(s => s.id === nextSeasonId) ?? null;
    setSeasons(data ?? []);
    setActiveSeason(nextSeason);
    return nextSeason;
  };

  return { seasons, loading, error, createSeason, closeSeason, refetch: fetchSeasons };
};
