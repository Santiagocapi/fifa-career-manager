// ============================================================
// src/hooks/useMatches.ts
// Hook for fetching match history, logging new matches,
// editing past matches, and calculating Head-to-Head (H2H) records.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Match, MatchEvent, MatchWithDetails, CreateMatchDto, CreateMatchEventDto, H2HRecord, MatchResult } from '../types/database';

interface LogMatchPayload {
  opponent: string;
  competition?: string;
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
    injured: boolean;
  }[];
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
      competition: payload.competition || 'League',
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

    // 2. Insert match_events for players and apply stats concurrently
    if (payload.playerEvents.length > 0) {
      const eventRows = payload.playerEvents.map(e => ({
        match_id: newMatch.id,
        player_id: e.player_id,
        goals: e.goals,
        assists: e.assists,
        yellow_card: e.yellow_card,
        red_card: e.red_card,
        clean_sheet: e.clean_sheet,
        injured: e.injured,
      }));

      await Promise.all([
        supabase.from('match_events').insert(eventRows),
        applyMatchEventsToSeasonStats(payload.playerEvents, 1),
      ]);
    }

    await fetchMatches();
    return true;
  };

  // Helper for batch updating season_stats concurrently
  const applyMatchEventsToSeasonStats = async (
    events: { player_id: string; goals: number; assists: number; yellow_card: boolean; red_card: boolean; clean_sheet: boolean; injured: boolean }[],
    multiplier: 1 | -1
  ) => {
    if (!seasonId || events.length === 0) return;

    const playerIds = events.map(e => e.player_id);
    const { data: statsData } = await supabase
      .from('season_stats')
      .select('*')
      .eq('season_id', seasonId)
      .in('player_id', playerIds);

    if (!statsData || statsData.length === 0) return;

    const statsMap = Object.fromEntries(statsData.map(s => [s.player_id, s]));

    const updates = events.map(e => {
      const current = statsMap[e.player_id];
      if (!current) return Promise.resolve();

      const mpDelta = (e.injured ? 0 : 1) * multiplier;
      const gDelta = (e.goals || 0) * multiplier;
      const aDelta = (e.assists || 0) * multiplier;
      const ycDelta = (e.yellow_card ? 1 : 0) * multiplier;
      const rcDelta = (e.red_card ? 1 : 0) * multiplier;
      const csDelta = (e.clean_sheet ? 1 : 0) * multiplier;

      return supabase
        .from('season_stats')
        .update({
          matches_played: Math.max(0, (current.matches_played || 0) + mpDelta),
          goals: Math.max(0, (current.goals || 0) + gDelta),
          assists: Math.max(0, (current.assists || 0) + aDelta),
          yellow_cards: Math.max(0, (current.yellow_cards || 0) + ycDelta),
          red_cards: Math.max(0, (current.red_cards || 0) + rcDelta),
          clean_sheets: Math.max(0, (current.clean_sheets || 0) + csDelta),
          updated_at: new Date().toISOString(),
        })
        .eq('id', current.id);
    });

    await Promise.all(updates);
  };

  // Edit an existing match
  const updateMatch = async (matchId: string, payload: LogMatchPayload): Promise<boolean> => {
    if (!seasonId) return false;

    // 1. Fetch old match events to revert old stats
    const { data: oldEvents } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', matchId);

    if (oldEvents && oldEvents.length > 0) {
      await applyMatchEventsToSeasonStats(oldEvents, -1);
    }

    // 2. Delete old events
    await supabase.from('match_events').delete().eq('match_id', matchId);

    // 3. Update match details
    let result: MatchResult = 'draw';
    if (payload.team_score > payload.opponent_score) result = 'win';
    else if (payload.team_score < payload.opponent_score) result = 'loss';

    const { error: matchErr } = await supabase
      .from('matches')
      .update({
        opponent: payload.opponent,
        competition: payload.competition || 'League',
        team_score: payload.team_score,
        opponent_score: payload.opponent_score,
        result,
        mvp_player_id: payload.mvp_player_id || null,
      })
      .eq('id', matchId);

    if (matchErr) {
      setError(matchErr.message);
      return false;
    }

    // 4. Insert new events and apply new stats
    if (payload.playerEvents.length > 0) {
      const eventRows = payload.playerEvents.map(e => ({
        match_id: matchId,
        player_id: e.player_id,
        goals: e.goals,
        assists: e.assists,
        yellow_card: e.yellow_card,
        red_card: e.red_card,
        clean_sheet: e.clean_sheet,
        injured: e.injured,
      }));

      await Promise.all([
        supabase.from('match_events').insert(eventRows),
        applyMatchEventsToSeasonStats(payload.playerEvents, 1),
      ]);
    }

    await fetchMatches();
    return true;
  };

  const deleteMatch = async (matchId: string) => {
    if (!seasonId) return;

    // Optimistically update local matches state for instant UI response
    setMatches(prev => prev.filter(m => m.id !== matchId));

    // 1. Fetch match events for this match before deleting to revert player stats
    const { data: oldEvents } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', matchId);

    // 2. Revert player statistics from season_stats concurrently
    if (oldEvents && oldEvents.length > 0) {
      await applyMatchEventsToSeasonStats(oldEvents, -1);
    }

    // 3. Delete match_events and match row
    await supabase.from('match_events').delete().eq('match_id', matchId);
    const { error: err } = await supabase.from('matches').delete().eq('id', matchId);

    if (err) {
      setError(err.message);
      console.error('Error deleting match:', err);
    }
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
