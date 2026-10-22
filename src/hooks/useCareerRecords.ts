// ============================================================
// src/hooks/useCareerRecords.ts
// Everything the career records page needs, across every
// season of the active career: matches with their events,
// season_stats, players (including those who left) and trophies.
// The records themselves are computed in careerRecords.ts.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { CareerMatch, Player, Season, SeasonStats, Trophy } from '../types/database';

export interface CareerData {
  /** Oldest first */
  seasons: Season[];
  matches: CareerMatch[];
  stats: SeasonStats[];
  /** Current and former players */
  players: Player[];
  trophies: Trophy[];
}

const EMPTY: CareerData = { seasons: [], matches: [], stats: [], players: [], trophies: [] };

interface UseCareerRecordsReturn {
  data: CareerData;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCareerRecords = (careerId: string | null): UseCareerRecordsReturn => {
  const [data, setData] = useState<CareerData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!careerId) {
      setData(EMPTY);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data: seasons, error: seasonsErr } = await supabase
      .from('seasons')
      .select('*')
      .eq('career_id', careerId)
      .order('season_number');

    if (seasonsErr) {
      setError(seasonsErr.message);
      setLoading(false);
      return;
    }

    const seasonIds = (seasons ?? []).map((s: Season) => s.id);
    if (seasonIds.length === 0) {
      setData(EMPTY);
      setLoading(false);
      return;
    }

    const [matchesRes, statsRes, playersRes, trophiesRes] = await Promise.all([
      supabase.from('matches').select('*, events:match_events(*)').in('season_id', seasonIds),
      supabase.from('season_stats').select('*').in('season_id', seasonIds),
      supabase.from('players').select('*').eq('career_id', careerId),
      supabase.from('trophies').select('*').in('season_id', seasonIds),
    ]);

    const err = matchesRes.error ?? statsRes.error ?? playersRes.error ?? trophiesRes.error;
    if (err) setError(err.message);

    setData({
      seasons: seasons ?? [],
      matches: (matchesRes.data as CareerMatch[] | null) ?? [],
      stats: statsRes.data ?? [],
      players: playersRes.data ?? [],
      trophies: trophiesRes.data ?? [],
    });
    setLoading(false);
  }, [careerId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { data, loading, error, refetch: fetchRecords };
};
