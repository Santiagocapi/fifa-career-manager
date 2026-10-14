// ============================================================
// src/hooks/useMatchDetail.ts
// One match with its player events, MVP and season, for the
// match detail page. Editing and deleting go through the same
// atomic functions as the match list (migration 004).
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MatchWithSeason } from '../types/database';
import { deleteMatchRpc, updateMatchRpc, type LogMatchPayload } from './useMatches';

interface UseMatchDetailReturn {
  /** null once loaded means the match does not exist in this career */
  match: MatchWithSeason | null;
  loading: boolean;
  error: string | null;
  updateMatch: (payload: LogMatchPayload) => Promise<boolean>;
  deleteMatch: () => Promise<boolean>;
  refetch: () => void;
}

export const useMatchDetail = (careerId: string | null, matchId: string | null): UseMatchDetailReturn => {
  const [match, setMatch] = useState<MatchWithSeason | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    if (!careerId || !matchId) {
      setMatch(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('matches')
      .select('*, mvp_player:mvp_player_id(*), events:match_events(*, player:player_id(*)), season:season_id(*)')
      .eq('id', matchId)
      .maybeSingle();

    if (err) setError(err.message);

    // RLS already hides other users' matches; this also hides the user's
    // other careers, so the page always matches the career in the top bar.
    const row = data as MatchWithSeason | null;
    setMatch(row && row.season?.career_id === careerId ? row : null);
    setLoading(false);
  }, [careerId, matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const updateMatch = async (payload: LogMatchPayload): Promise<boolean> => {
    if (!match) return false;
    const err = await updateMatchRpc(match.id, payload);
    if (err) {
      setError(err);
      return false;
    }
    await fetchMatch();
    return true;
  };

  const deleteMatch = async (): Promise<boolean> => {
    if (!match) return false;
    const err = await deleteMatchRpc(match.id);
    if (err) {
      setError(err);
      return false;
    }
    return true;
  };

  return { match, loading, error, updateMatch, deleteMatch, refetch: fetchMatch };
};
