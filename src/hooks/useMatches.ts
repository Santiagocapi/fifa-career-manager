// ============================================================
// src/hooks/useMatches.ts
// Hook for fetching match history, logging new matches,
// editing past matches, and calculating Head-to-Head (H2H) records.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MatchWithDetails, H2HRecord } from '../types/database';

interface LogMatchPlayerEvent {
  player_id: string;
  played?: boolean;
  substituted_off?: boolean;
  substituted_in?: boolean;
  replaced_player_id?: string | null;
  goals: number;
  assists: number;
  yellow_card: boolean;
  red_card: boolean;
  clean_sheet: boolean;
  injured: boolean;
}

interface LogMatchPayload {
  opponent: string;
  competition?: string;
  team_score: number;
  opponent_score: number;
  mvp_player_id: string | null;
  match_date?: string;
  playerEvents: LogMatchPlayerEvent[];
}

interface UseMatchesReturn {
  matches: MatchWithDetails[];
  h2hRecords: H2HRecord[];
  loading: boolean;
  error: string | null;
  logMatch: (payload: LogMatchPayload) => Promise<boolean>;
  updateMatch: (matchId: string, payload: LogMatchPayload) => Promise<boolean>;
  deleteMatch: (matchId: string) => Promise<void>;
  refetch: () => void;
}

// Fallback when the UI does not send `played`: same approximation used to backfill legacy
// rows in migration 003 (a player counts as having played only if they left a trace).
const didPlay = (e: { goals: number; assists: number; yellow_card: boolean; red_card: boolean }) =>
  e.goals > 0 || e.assists > 0 || e.yellow_card || e.red_card;

export const useMatches = (seasonId: string | null): UseMatchesReturn => {
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!seasonId) {
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch matches for the current season along with MVP player info and player events
    const { data: matchesData, error: matchesErr } = await supabase
      .from('matches')
      .select('*, mvp_player:mvp_player_id(*), events:match_events(*, player:player_id(*))')
      .eq('season_id', seasonId)
      .order('created_at', { ascending: false });

    if (matchesErr) {
      setError(matchesErr.message);
    } else {
      setMatches((matchesData as MatchWithDetails[]) ?? []);
    }

    setLoading(false);
  }, [seasonId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Compute Head-to-Head (H2H) record against each opponent
  const h2hMap: Record<string, H2HRecord> = {};
  matches.forEach(m => {
    const opp = m.opponent.trim();
    if (!h2hMap[opp]) {
      h2hMap[opp] = {
        opponent: opp,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      };
    }
    const rec = h2hMap[opp];
    rec.matchesPlayed += 1;
    rec.goalsFor += m.team_score;
    rec.goalsAgainst += m.opponent_score;
    if (m.result === 'win') rec.wins += 1;
    else if (m.result === 'draw') rec.draws += 1;
    else if (m.result === 'loss') rec.losses += 1;
  });

  const h2hRecords = Object.values(h2hMap).sort((a, b) => b.matchesPlayed - a.matchesPlayed);

  // Map UI player events to the JSON shape expected by the match functions.
  // The functions run in a single transaction and recompute season_stats from the events.
  const toEventsJson = (events: LogMatchPlayerEvent[]) =>
    events.map(e => ({
      player_id: e.player_id,
      played: e.played ?? didPlay(e),
      goals: e.goals,
      assists: e.assists,
      yellow_card: e.yellow_card,
      red_card: e.red_card,
      clean_sheet: e.clean_sheet,
      injured: e.injured,
    }));

  const logMatch = async (payload: LogMatchPayload): Promise<boolean> => {
    if (!seasonId) return false;

    const { error: err } = await supabase.rpc('log_match', {
      p_season_id: seasonId,
      p_opponent: payload.opponent,
      p_competition: payload.competition || 'League',
      p_team_score: payload.team_score,
      p_opponent_score: payload.opponent_score,
      p_mvp_player_id: payload.mvp_player_id || null,
      p_match_date: payload.match_date || new Date().toISOString().split('T')[0],
      p_events: toEventsJson(payload.playerEvents),
    });

    if (err) {
      setError(err.message);
      return false;
    }

    await fetchMatches();
    return true;
  };

  const updateMatch = async (matchId: string, payload: LogMatchPayload): Promise<boolean> => {
    if (!seasonId) return false;

    const { error: err } = await supabase.rpc('update_match', {
      p_match_id: matchId,
      p_opponent: payload.opponent,
      p_competition: payload.competition || 'League',
      p_team_score: payload.team_score,
      p_opponent_score: payload.opponent_score,
      p_mvp_player_id: payload.mvp_player_id || null,
      p_events: toEventsJson(payload.playerEvents),
    });

    if (err) {
      setError(err.message);
      return false;
    }

    await fetchMatches();
    return true;
  };

  const deleteMatch = async (matchId: string) => {
    if (!seasonId) return;

    const { error: err } = await supabase.rpc('delete_match', { p_match_id: matchId });
    if (err) setError(err.message);

    await fetchMatches();
  };

  return {
    matches,
    h2hRecords,
    loading,
    error,
    logMatch,
    updateMatch,
    deleteMatch,
    refetch: fetchMatches,
  };
};
