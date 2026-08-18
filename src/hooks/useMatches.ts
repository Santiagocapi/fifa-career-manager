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

    // 2. Insert match_events for players
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

      await supabase.from('match_events').insert(eventRows);

      // 3. Update season_stats for each player
      for (const e of payload.playerEvents) {
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
              matches_played: (currentStats.matches_played || 0) + (e.injured ? 0 : 1),
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

  // Edit an existing match
  const updateMatch = async (matchId: string, payload: LogMatchPayload): Promise<boolean> => {
    if (!seasonId) return false;

    // 1. Fetch old match events to revert old stats
    const { data: oldEvents } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', matchId);

    if (oldEvents) {
      for (const oldEv of oldEvents) {
        const { data: currentStats } = await supabase
          .from('season_stats')
          .select('*')
          .eq('player_id', oldEv.player_id)
          .eq('season_id', seasonId)
          .maybeSingle();

        if (currentStats) {
          await supabase
            .from('season_stats')
            .update({
              matches_played: Math.max(0, (currentStats.matches_played || 0) - (oldEv.injured ? 0 : 1)),
              goals: Math.max(0, (currentStats.goals || 0) - (oldEv.goals || 0)),
              assists: Math.max(0, (currentStats.assists || 0) - (oldEv.assists || 0)),
              yellow_cards: Math.max(0, (currentStats.yellow_cards || 0) - (oldEv.yellow_card ? 1 : 0)),
              red_cards: Math.max(0, (currentStats.red_cards || 0) - (oldEv.red_card ? 1 : 0)),
              clean_sheets: Math.max(0, (currentStats.clean_sheets || 0) - (oldEv.clean_sheet ? 1 : 0)),
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentStats.id);
        }
      }
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

      await supabase.from('match_events').insert(eventRows);

      for (const e of payload.playerEvents) {
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
              matches_played: (currentStats.matches_played || 0) + (e.injured ? 0 : 1),
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
    if (!seasonId) return;

    // 1. Fetch match events for this match before deleting to revert player stats
    const { data: oldEvents } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', matchId);

    // 2. Revert player statistics from season_stats
    if (oldEvents) {
      for (const oldEv of oldEvents) {
        const { data: currentStats } = await supabase
          .from('season_stats')
          .select('*')
          .eq('player_id', oldEv.player_id)
          .eq('season_id', seasonId)
          .maybeSingle();

        if (currentStats) {
          await supabase
            .from('season_stats')
            .update({
              matches_played: Math.max(0, (currentStats.matches_played || 0) - (oldEv.injured ? 0 : 1)),
              goals: Math.max(0, (currentStats.goals || 0) - (oldEv.goals || 0)),
              assists: Math.max(0, (currentStats.assists || 0) - (oldEv.assists || 0)),
              yellow_cards: Math.max(0, (currentStats.yellow_cards || 0) - (oldEv.yellow_card ? 1 : 0)),
              red_cards: Math.max(0, (currentStats.red_cards || 0) - (oldEv.red_card ? 1 : 0)),
              clean_sheets: Math.max(0, (currentStats.clean_sheets || 0) - (oldEv.clean_sheet ? 1 : 0)),
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentStats.id);
        }
      }
    }

    // 3. Delete match
    const { error: err } = await supabase.from('matches').delete().eq('id', matchId);
    if (err) setError(err.message);
    else await fetchMatches();
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
