// ============================================================
// src/hooks/useMatches.ts
// Hook for fetching match history, logging new matches,
// and calculating Head-to-Head (H2H) records against opponents.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Match, MatchEvent, MatchWithDetails, CreateMatchDto, CreateMatchEventDto, H2HRecord, MatchResult } from '../types/database';

interface LogMatchPayload {
  opponent: string;
  team_score: number;
  opponent_score: number;
  mvp_player_id: string | null;
  match_date?: string;
  playerEvents: {
    player_id: string;
    goals: number;
    assists: number;
    yellow_card: boolean;
    red_card: boolean;
    clean_sheet: boolean;
  }[];
}

interface UseMatchesReturn {
  matches: MatchWithDetails[];
  h2hRecords: H2HRecord[];
  loading: boolean;
  error: string | null;
  logMatch: (payload: LogMatchPayload) => Promise<boolean>;
  deleteMatch: (matchId: string) => Promise<void>;
  refetch: () => void;
}

export const useMatches = (seasonId: string | null, careerId: string | null): UseMatchesReturn => {
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

  // Log a complete match and update involved players' season stats
  const logMatch = async (payload: LogMatchPayload): Promise<boolean> => {
    if (!seasonId) return false;

    // Calculate result
    let result: MatchResult = 'draw';
    if (payload.team_score > payload.opponent_score) result = 'win';
    else if (payload.team_score < payload.opponent_score) result = 'loss';

    // 1. Insert into matches table
    const matchDto: CreateMatchDto = {
      season_id: seasonId,
      opponent: payload.opponent,
      team_score: payload.team_score,
      opponent_score: payload.opponent_score,
      result,
      mvp_player_id: payload.mvp_player_id || null,
      match_date: payload.match_date || new Date().toISOString().split('T')[0],
    };

    const { data: newMatch, error: matchErr } = await supabase
      .from('matches')
      .insert(matchDto)
      .select()
      .single();

    if (matchErr || !newMatch) {
      setError(matchErr?.message ?? 'Failed to log match');
      return false;
    }

    // 2. Insert match_events for players who participated
    if (payload.playerEvents.length > 0) {
      const eventRows = payload.playerEvents.map(e => ({
        match_id: newMatch.id,
        player_id: e.player_id,
        goals: e.goals,
        assists: e.assists,
        yellow_card: e.yellow_card,
        red_card: e.red_card,
        clean_sheet: e.clean_sheet,
      }));

      await supabase.from('match_events').insert(eventRows);

      // 3. Update (increment) season_stats for each player in season_stats table
      for (const e of payload.playerEvents) {
        // Fetch current season_stats row for player in this season
        const { data: currentStats } = await supabase
          .from('season_stats')
          .select('*')
          .eq('player_id', e.player_id)
          .eq('season_id', seasonId)
          .maybeSingle();

        if (currentStats) {
          await supabase
            .from('season_stats')
            .update({
              matches_played: (currentStats.matches_played || 0) + 1,
              goals: (currentStats.goals || 0) + e.goals,
              assists: (currentStats.assists || 0) + e.assists,
              yellow_cards: (currentStats.yellow_cards || 0) + (e.yellow_card ? 1 : 0),
              red_cards: (currentStats.red_cards || 0) + (e.red_card ? 1 : 0),
              clean_sheets: (currentStats.clean_sheets || 0) + (e.clean_sheet ? 1 : 0),
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentStats.id);
        }
      }
    }

    await fetchMatches();
    return true;
  };

  const deleteMatch = async (matchId: string) => {
    const { error: err } = await supabase.from('matches').delete().eq('id', matchId);
    if (err) setError(err.message);
    else fetchMatches();
  };

  return {
    matches,
    h2hRecords,
    loading,
    error,
    logMatch,
    deleteMatch,
    refetch: fetchMatches,
  };
};
