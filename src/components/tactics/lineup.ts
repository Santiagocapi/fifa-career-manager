// ============================================================
// src/components/tactics/lineup.ts
// Pure helpers for the starting XI: auto-fill, best XI, line
// ratings and bench ordering for a given pitch role.
// ============================================================

import type { FormationScheme, PlayerWithStats } from '../../types/database';
import { getPositionGroup } from '../../lib/constants';
import { FORMATION_SLOTS, type PitchSlotDef } from './formationPositions';

export const getSlots = (scheme: FormationScheme): PitchSlotDef[] =>
  FORMATION_SLOTS[scheme] ?? FORMATION_SLOTS['4-3-3'];

export const playerOvr = (p: PlayerWithStats): number => p.stats?.ovr_end ?? p.stats?.ovr_start ?? 0;

// How well a player fits a pitch role: the right line (+100) matters most,
// so a defender is never picked for a striker slot while a forward is free;
// the exact position (+5) only breaks near-ties, because in EA FC a CDM
// playing CM barely loses rating. The rest is the player's rating.
const fitScore = (role: string, p: PlayerWithStats): number =>
  (getPositionGroup(p.preferred_position) === getPositionGroup(role) ? 100 : 0) +
  (p.preferred_position === role ? 5 : 0) +
  playerOvr(p);

export const sortByFit = (role: string, candidates: PlayerWithStats[]): PlayerWithStats[] =>
  [...candidates].sort((a, b) => fitScore(role, b) - fitScore(role, a));

/**
 * Keeps each stored player in its slot (when still in the squad) and fills
 * the empty slots. Filling is a global greedy pass over every (slot, player)
 * pair, best fit first, so the order of the slots does not decide who plays
 * where. Injured players are never picked automatically, but stay where the
 * user put them.
 */
export function buildStartingXI(
  scheme: FormationScheme,
  storedIds: (string | null)[],
  sortedPlayers: PlayerWithStats[]
): (PlayerWithStats | null)[] {
  const slots = getSlots(scheme);
  const assigned: (PlayerWithStats | null)[] = Array(11).fill(null);
  const used = new Set<string>();

  storedIds.slice(0, 11).forEach((id, idx) => {
    if (!id || used.has(id)) return;
    const found = sortedPlayers.find((p) => p.id === id);
    if (found) {
      assigned[idx] = found;
      used.add(found.id);
    }
  });

  const pool = sortedPlayers.filter((p) => !used.has(p.id) && !p.stats?.is_injured);
  const pairs = slots
    .flatMap((slot, idx) => (assigned[idx] ? [] : pool.map((player) => ({ idx, player, score: fitScore(slot.role, player) }))))
    .sort((a, b) => b.score - a.score);

  for (const { idx, player } of pairs) {
    if (assigned[idx] || used.has(player.id)) continue;
    assigned[idx] = player;
    used.add(player.id);
  }

  return assigned;
}

export const buildBestXI = (scheme: FormationScheme, sortedPlayers: PlayerWithStats[]): (string | null)[] =>
  buildStartingXI(scheme, [], sortedPlayers).map((p) => p?.id ?? null);

export interface LineRatings {
  team: number;
  defense: number;
  midfield: number;
  attack: number;
  value: number;
}

export function computeLineRatings(startingXI: (PlayerWithStats | null)[]): LineRatings {
  const xi = startingXI.filter((p): p is PlayerWithStats => p !== null);
  // Players without a rating count as 75 so an empty field does not sink the average
  const average = (list: PlayerWithStats[]) =>
    list.length > 0
      ? Math.round(list.reduce((sum, p) => sum + (p.stats?.ovr_end ?? p.stats?.ovr_start ?? 75), 0) / list.length)
      : null;

  const team = average(xi) ?? 0;
  const inGroups = (...groups: string[]) => xi.filter((p) => groups.includes(getPositionGroup(p.preferred_position)));

  return {
    team,
    defense: average(inGroups('GK', 'DEF')) ?? team,
    midfield: average(inGroups('MID')) ?? team,
    attack: average(inGroups('FWD')) ?? team,
    value: xi.reduce((sum, p) => sum + (p.stats?.market_value_end ?? p.stats?.market_value_start ?? 0), 0),
  };
}
