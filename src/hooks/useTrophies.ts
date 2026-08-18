// ============================================================
// src/hooks/useTrophies.ts
// Trophy management per season.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Trophy, CreateTrophyDto } from '../types/database';

interface UseTrophiesReturn {
  trophies: Trophy[];
  loading: boolean;
  error: string | null;
  addTrophy: (data: CreateTrophyDto) => Promise<Trophy | null>;
  deleteTrophy: (id: string) => Promise<void>;
}

export const useTrophies = (seasonId: string | null): UseTrophiesReturn => {
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrophies = useCallback(async () => {
    if (!seasonId) { setTrophies([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('trophies')
      .select('*')
      .eq('season_id', seasonId)
      .order('created_at');

    if (err) setError(err.message);
    else setTrophies(data ?? []);
    setLoading(false);
  }, [seasonId]);

  useEffect(() => { fetchTrophies(); }, [fetchTrophies]);

  const addTrophy = async (data: CreateTrophyDto): Promise<Trophy | null> => {
    const { data: trophy, error: err } = await supabase
      .from('trophies').insert(data).select().single();

    if (err) { setError(err.message); return null; }
    setTrophies(prev => [...prev, trophy]);
    return trophy;
  };

  const deleteTrophy = async (id: string) => {
    const { error: err } = await supabase.from('trophies').delete().eq('id', id);
    if (err) setError(err.message);
    else setTrophies(prev => prev.filter(t => t.id !== id));
  };

  return { trophies, loading, error, addTrophy, deleteTrophy };
};
