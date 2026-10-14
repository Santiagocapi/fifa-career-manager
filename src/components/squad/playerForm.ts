// ============================================================
// src/components/squad/playerForm.ts
// Turns PlayerFormSheet values into database fields. Shared by
// the squad list and the player profile.
// ============================================================

import type { Player, SeasonStats } from '../../types/database';
import { dollarsToCents } from '../../lib/constants';
import type { PlayerFormData } from './PlayerFormSheet';

// Empty number inputs come back as NaN from react-hook-form
export const numberOrNull = (value: number) => (Number.isFinite(value) ? value : null);

const dollarsOrNull = (value: number): number | null => {
  const dollars = numberOrNull(value);
  return dollars === null ? null : dollarsToCents(dollars);
};

/** Club-wide player fields (the same in every season) */
export const toPlayerFields = (data: PlayerFormData) =>
  ({
    full_name: data.full_name.trim(),
    preferred_position: data.preferred_position,
    nationality: data.nationality.trim() || null,
    age: numberOrNull(data.age),
    joined_year: numberOrNull(data.joined_year) ?? new Date().getFullYear(),
  }) satisfies Partial<Player>;

/** Fields of the player's season_stats row being edited; money in cents */
export const toSeasonStatsFields = (data: PlayerFormData) =>
  ({
    ovr_start: numberOrNull(data.ovr_start),
    market_value_start: dollarsOrNull(data.market_value_start),
    salary: dollarsOrNull(data.salary),
    is_injured: data.is_injured,
  }) satisfies Partial<SeasonStats>;
