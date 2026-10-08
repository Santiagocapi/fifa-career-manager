// ============================================================
// src/components/matches/matchEvents.ts
// Pure helpers for the match logger form: per-player events,
// substitutions and the automatic clean sheet rule. Every helper
// returns a new object (React state is never mutated).
// ============================================================

import type { MatchWithDetails, PlayerWithStats } from '../../types/database';
import { getPositionGroup } from '../../lib/constants';

export interface PlayerMatchPerformance {
  player_id: string;
  played: boolean;
  is_starter: boolean;
  substituted_off: boolean;
  substituted_in: boolean;
  replaced_player_id: string | null;
  goals: number;
  assists: number;
  yellow_card: boolean;
  red_card: boolean;
  clean_sheet: boolean;
  injured: boolean;
}

export type MatchEvents = Record<string, PlayerMatchPerformance>;

export const emptyPerformance = (playerId: string): PlayerMatchPerformance => ({
  player_id: playerId,
  played: false,
  is_starter: false,
  substituted_off: false,
  substituted_in: false,
  replaced_player_id: null,
  goals: 0,
  assists: 0,
  yellow_card: false,
  red_card: false,
  clean_sheet: false,
  injured: false,
});

/**
 * Clean sheet rule: when the rival does not score, goalkeepers and defenders
 * who finished the match on the pitch (played and were not subbed off) or
 * who came on as substitutes get a clean sheet. Conceding removes them all.
 * It is applied automatically and can still be toggled by hand per player.
 */
const earnsCleanSheet = (event: PlayerMatchPerformance, player: PlayerWithStats, opponentScore: number): boolean => {
  const group = getPositionGroup(player.preferred_position);
  if (opponentScore !== 0 || (group !== 'GK' && group !== 'DEF')) return false;
  return (event.played && !event.substituted_off) || event.substituted_in;
};

export function applyCleanSheets(events: MatchEvents, players: PlayerWithStats[], opponentScore: number): MatchEvents {
  const next: MatchEvents = {};
  for (const [id, event] of Object.entries(events)) {
    const player = players.find((p) => p.id === id);
    next[id] = player ? { ...event, clean_sheet: earnsCleanSheet(event, player, opponentScore) } : event;
  }
  return next;
}

/** New match: the starting XI from Tácticas has played, everyone else has not */
export function buildNewMatchEvents(players: PlayerWithStats[], starterIds: Set<string>): MatchEvents {
  const events: MatchEvents = {};
  players.forEach((p) => {
    const isStarter = starterIds.has(p.id);
    events[p.id] = {
      ...emptyPerformance(p.id),
      played: isStarter,
      is_starter: isStarter,
      injured: p.stats?.is_injured ?? false,
    };
  });
  return applyCleanSheets(events, players, 0);
}

/** Existing match: stored events win; the current XI only groups the list */
export function buildEditMatchEvents(
  players: PlayerWithStats[],
  match: MatchWithDetails,
  starterIds: Set<string>
): MatchEvents {
  const events: MatchEvents = {};
  players.forEach((p) => {
    const stored = match.events.find((e) => e.player_id === p.id);
    const isStarter = starterIds.has(p.id);
    events[p.id] = {
      ...emptyPerformance(p.id),
      // Every squad player gets an event row (played true or false), so the stored flag wins
      played: stored ? stored.played : isStarter,
      is_starter: isStarter,
      goals: stored?.goals ?? 0,
      assists: stored?.assists ?? 0,
      yellow_card: stored?.yellow_card ?? false,
      red_card: stored?.red_card ?? false,
      clean_sheet: stored?.clean_sheet ?? false,
      injured: stored?.injured ?? false,
    };
  });
  return events;
}

/** Links a starter with the substitute who replaced them ('' clears it) */
export function applySubstitution(
  events: MatchEvents,
  players: PlayerWithStats[],
  opponentScore: number,
  starterId: string,
  substituteId: string
): MatchEvents {
  const starter = events[starterId];
  if (!starter) return events;
  const next = { ...events };

  // Undo the previous substitute of this starter
  const previousId = starter.replaced_player_id;
  if (previousId && next[previousId]) {
    next[previousId] = { ...next[previousId], played: false, substituted_in: false, replaced_player_id: null };
  }

  if (!substituteId) {
    next[starterId] = { ...starter, substituted_off: false, replaced_player_id: null };
  } else {
    next[starterId] = { ...starter, substituted_off: true, replaced_player_id: substituteId };
    if (next[substituteId]) {
      next[substituteId] = { ...next[substituteId], played: true, substituted_in: true, replaced_player_id: starterId };
    }
  }

  return applyCleanSheets(next, players, opponentScore);
}

/**
 * Marks whether a player took part. A player who did not play keeps no goals,
 * assists or cards (they would still be summed into the season stats), and any
 * substitution involving them is undone.
 */
export function setPlayed(
  events: MatchEvents,
  players: PlayerWithStats[],
  opponentScore: number,
  playerId: string,
  played: boolean
): MatchEvents {
  const event = events[playerId];
  const player = players.find((p) => p.id === playerId);
  if (!event || !player) return events;

  let next = events;
  if (!played && event.substituted_off) {
    next = applySubstitution(next, players, opponentScore, playerId, '');
  }
  if (!played && event.substituted_in && event.replaced_player_id) {
    next = applySubstitution(next, players, opponentScore, event.replaced_player_id, '');
  }

  const current = next[playerId];
  const updated: PlayerMatchPerformance = played
    ? { ...current, played: true }
    : { ...emptyPerformance(playerId), is_starter: current.is_starter, injured: current.injured };

  return { ...next, [playerId]: { ...updated, clean_sheet: earnsCleanSheet(updated, player, opponentScore) } };
}

// Same sum the database makes for the season stats (every event counts)
export const countAssignedGoals = (events: MatchEvents): number =>
  Object.values(events).reduce((sum, e) => sum + e.goals, 0);
