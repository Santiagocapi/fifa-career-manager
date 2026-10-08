// ============================================================
// src/hooks/usePlayers.ts
// Player + SeasonStats operations.
//
// KEY CONCEPT: JOIN QUERIES
// When we fetch players, we also want their stats for the active season.
// In SQL: SELECT players.*, season_stats.*
//         FROM players LEFT JOIN season_stats ON ...
//         WHERE season_stats.season_id = $activeSeason
//
// In Supabase: .select('*, season_stats(*)')
// The "*" inside refers to the related table via foreign key.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Player,
  SeasonStats,
  PlayerWithStats,
  CreatePlayerDto,
  CreateSeasonStatsDto,
} from '../types/database';
import { dollarsToCents } from '../lib/constants';

interface UsePlayersReturn {
  players: PlayerWithStats[];
  loading: boolean;
  error: string | null;
  addPlayer: (playerData: CreatePlayerDto, statsData: Partial<CreateSeasonStatsDto>) => Promise<Player | null>;
  updatePlayer: (id: string, data: Partial<Player>) => Promise<void>;
  updateStats: (playerId: string, seasonId: string, data: Partial<SeasonStats>) => Promise<void>;
  closeSeasonForPlayer: (playerId: string, seasonId: string, ovrEnd: number, valueEnd: number) => Promise<void>;
  toggleInjured: (playerId: string, isInjured: boolean) => Promise<void>;
  deactivatePlayer: (id: string) => Promise<void>;
  refetch: () => void;
}

export const usePlayers = (careerId: string | null, seasonId: string | null): UsePlayersReturn => {
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    if (!careerId) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch all active players for this career
    const { data: playersData, error: playersErr } = await supabase
      .from('players')
      .select('*')
      .eq('career_id', careerId)
      .eq('is_active', true)
      .order('preferred_position');

    if (playersErr) {
      setError(playersErr.message);
      setLoading(false);
      return;
    }

    if (!playersData?.length) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    // season_stats counters are kept in sync by the match functions (see migration 004),
    // so they are read as-is: reading must never write.
    let statsMap: Record<string, SeasonStats> = {};
    if (seasonId) {
      const { data: statsData, error: statsErr } = await supabase
        .from('season_stats')
        .select('*')
        .eq('season_id', seasonId)
        .in('player_id', playersData.map(p => p.id));

      if (statsErr) {
        setError(statsErr.message);
      } else if (statsData) {
        statsMap = Object.fromEntries(statsData.map(s => [s.player_id, s]));
      }
    }

    // Merge: attach stats to each player
    const enriched: PlayerWithStats[] = playersData.map(player => ({
      ...player,
      stats: statsMap[player.id] ?? null,
    }));

    setPlayers(enriched);
    setLoading(false);
  }, [careerId, seasonId]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Add a new player AND create their season_stats row for the current season
  const addPlayer = async (
    playerData: CreatePlayerDto,
    statsData: Partial<CreateSeasonStatsDto>
  ): Promise<Player | null> => {
    // Step 1: Insert the player
    const { data: newPlayer, error: playerErr } = await supabase
      .from('players')
      .insert(playerData)
      .select()
      .single();

    if (playerErr || !newPlayer) {
      setError(playerErr?.message ?? 'Failed to create player');
      return null;
    }

    // Step 2: Create the season_stats row (if we have an active season)
    if (seasonId) {
      const statsRow: CreateSeasonStatsDto = {
        player_id: newPlayer.id,
        season_id: seasonId,
        ovr_start: statsData.ovr_start ?? null,
        market_value_start: statsData.market_value_start
          ? dollarsToCents(statsData.market_value_start)
          : null,
        salary: statsData.salary ? dollarsToCents(statsData.salary) : null,
        ovr_end: null,
        market_value_end: null,
        matches_played: 0,
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        clean_sheets: 0,
        notes: null,
        is_injured: false,
      };

      await supabase.from('season_stats').insert(statsRow);
    }

    await fetchPlayers(); // Refetch to get the full enriched object
    return newPlayer;
  };

  const updatePlayer = async (id: string, data: Partial<Player>) => {
    const { error: err } = await supabase
      .from('players')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) setError(err.message);
    else setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const updateStats = async (playerId: string, seasonId: string, data: Partial<SeasonStats>) => {
    const { error: err } = await supabase
      .from('season_stats')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('player_id', playerId)
      .eq('season_id', seasonId);

    if (err) setError(err.message);
    else setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, stats: p.stats ? { ...p.stats, ...data } : null }
        : p
    ));
  };

  // Called when closing a season: save final OVR and market value
  const closeSeasonForPlayer = async (
    playerId: string,
    seasonId: string,
    ovrEnd: number,
    valueEnd: number
  ) => {
    await updateStats(playerId, seasonId, {
      ovr_end: ovrEnd,
      market_value_end: dollarsToCents(valueEnd),
    });
  };

  const deactivatePlayer = async (id: string) => {
    await updatePlayer(id, { is_active: false });
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  // Toggle the persistent injury status for a player in the active season
  const toggleInjured = async (playerId: string, isInjured: boolean) => {
    if (!seasonId) return;
    const { error: err } = await supabase
      .from('season_stats')
      .update({ is_injured: isInjured, updated_at: new Date().toISOString() })
      .eq('player_id', playerId)
      .eq('season_id', seasonId);

    if (err) setError(err.message);
    else setPlayers(prev => prev.map(p =>
      p.id === playerId && p.stats
        ? { ...p, stats: { ...p.stats, is_injured: isInjured } }
        : p
    ));
  };

  return {
    players,
    loading,
    error,
    addPlayer,
    updatePlayer,
    updateStats,
    closeSeasonForPlayer,
    toggleInjured,
    deactivatePlayer,
    refetch: fetchPlayers,
  };
};
