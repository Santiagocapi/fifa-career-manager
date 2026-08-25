// ============================================================
// src/hooks/useScouting.ts
// Scouting list CRUD: wonderkids, targets, sell list, free agents.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ScoutingEntry, CreateScoutingEntryDto, ScoutingListType } from '../types/database';

interface UseScoutingReturn {
  entries: ScoutingEntry[];
  byList: Record<ScoutingListType, ScoutingEntry[]>;
  loading: boolean;
  error: string | null;
  addEntry: (data: CreateScoutingEntryDto) => Promise<ScoutingEntry | null>;
  updateEntry: (id: string, data: Partial<ScoutingEntry>) => Promise<void>;
  moveEntry: (id: string, newListType: ScoutingListType) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  signToSquad: (scoutEntry: ScoutingEntry, seasonId: string, wageCents?: number) => Promise<boolean>;
}

export const useScouting = (careerId: string | null): UseScoutingReturn => {
  const [entries, setEntries] = useState<ScoutingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!careerId) { setEntries([]); setLoading(false); return; }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('scouting_list')
      .select('*')
      .eq('career_id', careerId)
      .order('created_at', { ascending: true });

    if (err) setError(err.message);
    else setEntries(data ?? []);
    setLoading(false);
  }, [careerId]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Group entries by list type — used by the Kanban board
  const byList: Record<ScoutingListType, ScoutingEntry[]> = {
    wonderkid:  entries.filter(e => e.list_type === 'wonderkid'),
    target:     entries.filter(e => e.list_type === 'target'),
    free_agent: entries.filter(e => e.list_type === 'free_agent'),
    sell:       entries.filter(e => e.list_type === 'sell'),
  };

  const addEntry = async (data: CreateScoutingEntryDto): Promise<ScoutingEntry | null> => {
    const { data: newEntry, error: err } = await supabase
      .from('scouting_list')
      .insert(data)
      .select()
      .single();

    if (err) { setError(err.message); return null; }
    setEntries(prev => [...prev, newEntry]);
    return newEntry;
  };

  const updateEntry = async (id: string, data: Partial<ScoutingEntry>) => {
    const { error: err } = await supabase
      .from('scouting_list')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) setError(err.message);
    else setEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const moveEntry = (id: string, newListType: ScoutingListType) =>
    updateEntry(id, { list_type: newListType });

  const deleteEntry = async (id: string) => {
    const { error: err } = await supabase.from('scouting_list').delete().eq('id', id);
    if (err) setError(err.message);
    else setEntries(prev => prev.filter(e => e.id !== id));
  };

  const signToSquad = async (
    scoutEntry: ScoutingEntry,
    seasonId: string,
    wageCents?: number
  ): Promise<boolean> => {
    if (!careerId || !seasonId) return false;

    // 1. Insert into players table
    const { data: newPlayer, error: playerErr } = await supabase
      .from('players')
      .insert({
        career_id: careerId,
        full_name: scoutEntry.full_name,
        preferred_position: scoutEntry.position || 'CM',
        nationality: scoutEntry.nationality || null,
        joined_year: new Date().getFullYear(),
      })
      .select()
      .single();

    if (playerErr || !newPlayer) {
      setError(playerErr?.message ?? 'Failed to sign player to squad');
      return false;
    }

    // 2. Insert into season_stats table
    const ovr = scoutEntry.current_ovr || 75;
    const value = scoutEntry.estimated_value || 500000000;
    const wage = wageCents || 1000000;

    await supabase.from('season_stats').insert({
      season_id: seasonId,
      player_id: newPlayer.id,
      ovr_start: ovr,
      ovr_end: ovr,
      market_value_start: value,
      market_value_end: value,
      wage: wage,
      matches_played: 0,
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      clean_sheets: 0,
      is_injured: false,
    });

    // 3. Remove from scouting list
    await deleteEntry(scoutEntry.id);
    return true;
  };

  return { entries, byList, loading, error, addEntry, updateEntry, moveEntry, deleteEntry, signToSquad };
};
