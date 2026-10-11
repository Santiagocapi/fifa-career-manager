// ============================================================
// src/components/season/closingDrafts.ts
// Form state of the close-season assistant: the final OVR and
// market value of each player and whether they leave the club.
// ============================================================

import type { PlayerWithStats } from '../../types/database';
import type { ClosingPlayer } from '../../hooks/useSeasons';

export interface ClosingDraft {
  ovr: number;
  /** Market value in millions as typed, e.g. "15,5" */
  value: string;
  leaves: boolean;
}

export type ClosingDrafts = Record<string, ClosingDraft>;

const CENTS_PER_MILLION = 100_000_000;
const FALLBACK_OVR = 70;

export const startOvr = (player: PlayerWithStats): number | null => player.stats?.ovr_start ?? null;

// 1_550_000_000 cents → "15,5"
const centsToMillionsInput = (cents: number): string =>
  String(Math.round((cents / CENTS_PER_MILLION) * 100) / 100).replace('.', ',');

/** "15,5" → cents; empty → null (keep the start value); invalid → undefined */
export const parseMillions = (input: string): number | null | undefined => {
  const text = input.trim().replace(',', '.');
  if (!text) return null;
  const millions = Number(text);
  if (!Number.isFinite(millions) || millions < 0) return undefined;
  return Math.round(millions * CENTS_PER_MILLION);
};

// Each player starts from where they are now: the OVR and value already
// updated during the season, or the ones they started it with.
export const buildInitialDrafts = (players: PlayerWithStats[]): ClosingDrafts =>
  Object.fromEntries(
    players.map((player) => {
      const cents = player.stats?.market_value_end ?? player.stats?.market_value_start;
      return [
        player.id,
        {
          ovr: player.stats?.ovr_end ?? player.stats?.ovr_start ?? FALLBACK_OVR,
          value: cents == null ? '' : centsToMillionsInput(cents),
          leaves: false,
        },
      ];
    })
  );

export const findInvalidValues = (drafts: ClosingDrafts): string[] =>
  Object.entries(drafts)
    .filter(([, draft]) => parseMillions(draft.value) === undefined)
    .map(([playerId]) => playerId);

export const buildClosingPlayers = (drafts: ClosingDrafts): ClosingPlayer[] =>
  Object.entries(drafts).map(([playerId, draft]) => ({
    player_id: playerId,
    ovr_end: draft.ovr,
    market_value_end: parseMillions(draft.value) ?? null,
    leaves: draft.leaves,
  }));
