// ============================================================
// src/hooks/useSeasons.ts
// Season management: create, activate, close seasons.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Season } from '../types/database';
import { useAppStore } from '../store/useAppStore';

interface UseSeasonsReturn {
  seasons: Season[];
  loading: boolean;
  error: string | null;
  createSeason: (yearLabel: string) => Promise<Season | null>;
  closeSeason: (seasonId: string) => Promise<void>;
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

  const closeSeason = async (seasonId: string) => {
    const { error: err } = await supabase
      .from('seasons')
      .update({ is_closed: true, is_active: false })
      .eq('id', seasonId);

    if (err) { setError(err.message); return; }

    setSeasons(prev => prev.map(s =>
      s.id === seasonId ? { ...s, is_closed: true, is_active: false } : s
    ));
    setActiveSeason(null);
  };

  return { seasons, loading, error, createSeason, closeSeason, refetch: fetchSeasons };
};
