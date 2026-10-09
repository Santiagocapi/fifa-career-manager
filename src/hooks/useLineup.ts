// ============================================================
// src/hooks/useLineup.ts
// Starting XI and formation scheme of a season, stored in the
// database (formations + formation_players) so it follows the
// user across devices. Changes update the screen immediately and
// are saved in order through the save_lineup function.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FORMATION_SLOTS } from '../components/tactics/formationPositions';
import type { FormationScheme } from '../types/database';

export const DEFAULT_SCHEME: FormationScheme = '4-3-3 Attack';
const LINEUP_SIZE = 11;
const emptyLineup = (): (string | null)[] => Array(LINEUP_SIZE).fill(null);

const isScheme = (value: unknown): value is FormationScheme =>
  typeof value === 'string' && value in FORMATION_SLOTS;

// ---- Legacy localStorage lineup (stores used before the database) ----
// Temporary: lets the first device that opens a season upload the lineup
// it already had in the browser. Remove once every user has migrated.
const LEGACY_KEY = 'fifa-tactics-storage';

interface LegacyState {
  formations?: Record<string, unknown>;
  lineups?: Record<string, unknown>;
}

const readLegacy = (): { parsed: { state?: LegacyState } } | null => {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    return raw ? { parsed: JSON.parse(raw) } : null;
  } catch {
    return null;
  }
};

const getLegacyLineup = (seasonId: string): { scheme: FormationScheme; ids: (string | null)[] } | null => {
  const legacy = readLegacy()?.parsed.state;
  const ids = legacy?.lineups?.[seasonId];
  if (!Array.isArray(ids)) return null;
  const scheme = legacy?.formations?.[seasonId];
  return {
    scheme: isScheme(scheme) ? scheme : DEFAULT_SCHEME,
    ids: emptyLineup().map((_, i) => (typeof ids[i] === 'string' ? (ids[i] as string) : null)),
  };
};

const clearLegacyLineup = (seasonId: string) => {
  try {
    const legacy = readLegacy();
    const state = legacy?.parsed.state;
    if (!legacy || !state) return;
    if (state.lineups) delete state.lineups[seasonId];
    if (state.formations) delete state.formations[seasonId];
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy.parsed));
  } catch {
    /* storage unavailable: nothing to clean */
  }
};

// ---- Hook ----

interface LineupState {
  scheme: FormationScheme;
  ids: (string | null)[];
}

interface UseLineupReturn {
  scheme: FormationScheme;
  /** Always 11 entries, one per pitch slot; null for an empty slot */
  lineupIds: (string | null)[];
  /** True until the lineup of the season has been read */
  loading: boolean;
  error: string | null;
  setScheme: (scheme: FormationScheme) => void;
  setLineup: (ids: (string | null)[]) => void;
  swapSlots: (a: number, b: number) => void;
  setSlot: (slotIndex: number, playerId: string | null) => void;
}

interface FormationPlayerRow {
  player_id: string;
  slot_index: number | null;
}

export const useLineup = (seasonId: string | null): UseLineupReturn => {
  const [state, setState] = useState<LineupState>({ scheme: DEFAULT_SCHEME, ids: emptyLineup() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Latest state for handlers, and a queue so saves reach the server in order
  const stateRef = useRef(state);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const apply = useCallback((next: LineupState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const save = useCallback(
    (targetSeasonId: string, next: LineupState): Promise<boolean> => {
      const slots = FORMATION_SLOTS[next.scheme];
      const payload = next.ids.flatMap((playerId, index) =>
        playerId
          ? [{
              slot_index: index,
              player_id: playerId,
              slot_label: slots[index]?.role ?? null,
              position_x: (slots[index]?.x ?? 50) / 100,
              position_y: (slots[index]?.y ?? 50) / 100,
            }]
          : []
      );

      const run = async () => {
        const { error: err } = await supabase.rpc('save_lineup', {
          p_season_id: targetSeasonId,
          p_scheme: next.scheme,
          p_slots: payload,
        });
        if (err) setError(err.message);
        return !err;
      };

      const result = saveQueue.current.then(run);
      saveQueue.current = result.then(() => undefined);
      return result;
    },
    []
  );

  // Load the saved lineup whenever the season changes
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!seasonId) {
        apply({ scheme: DEFAULT_SCHEME, ids: emptyLineup() });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('formations')
        .select('scheme, formation_players(player_id, slot_index)')
        .eq('season_id', seasonId)
        .eq('is_default', true)
        .maybeSingle();

      if (cancelled) return;

      if (err) {
        setError(err.message);
        apply({ scheme: DEFAULT_SCHEME, ids: emptyLineup() });
        setLoading(false);
        return;
      }

      if (data) {
        const ids = emptyLineup();
        (data.formation_players as FormationPlayerRow[] | null)?.forEach((row) => {
          if (row.slot_index !== null && row.slot_index >= 0 && row.slot_index < LINEUP_SIZE) {
            ids[row.slot_index] = row.player_id;
          }
        });
        apply({ scheme: isScheme(data.scheme) ? data.scheme : DEFAULT_SCHEME, ids });
        setLoading(false);
        return;
      }

      // Nothing saved yet: upload the lineup this browser had, if any
      const legacy = getLegacyLineup(seasonId);
      if (legacy) {
        apply(legacy);
        setLoading(false);
        // Only drop the browser copy once the server has it
        save(seasonId, legacy).then((saved) => {
          if (saved) clearLegacyLineup(seasonId);
        });
        return;
      }

      apply({ scheme: DEFAULT_SCHEME, ids: emptyLineup() });
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [seasonId, apply, save]);

  const commit = useCallback(
    (next: LineupState) => {
      apply(next);
      if (seasonId) void save(seasonId, next);
    },
    [seasonId, apply, save]
  );

  const setScheme = useCallback(
    (scheme: FormationScheme) => commit({ ...stateRef.current, scheme }),
    [commit]
  );

  const setLineup = useCallback(
    (ids: (string | null)[]) =>
      commit({ ...stateRef.current, ids: emptyLineup().map((_, i) => ids[i] ?? null) }),
    [commit]
  );

  const swapSlots = useCallback(
    (a: number, b: number) => {
      const ids = [...stateRef.current.ids];
      [ids[a], ids[b]] = [ids[b], ids[a]];
      commit({ ...stateRef.current, ids });
    },
    [commit]
  );

  const setSlot = useCallback(
    (slotIndex: number, playerId: string | null) => {
      const ids = [...stateRef.current.ids];
      ids[slotIndex] = playerId;
      commit({ ...stateRef.current, ids });
    },
    [commit]
  );

  return {
    scheme: state.scheme,
    lineupIds: state.ids,
    loading,
    error,
    setScheme,
    setLineup,
    swapSlots,
    setSlot,
  };
};
