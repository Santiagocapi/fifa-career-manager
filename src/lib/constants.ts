// ============================================================
// src/lib/constants.ts
// Application-wide constants: positions, formations, colors, etc.
// Centralizing these here means changing one value updates the
// entire app — no hunting through components.
// ============================================================

import type { PlayerPosition, FormationScheme, ScoutingListType, TrophyType } from '../types/database';
import { countries } from 'countries-list';

// ============================================================
// COUNTRY FLAG HELPER
// Converts a country name string (e.g. "Argentina") to an
// emoji flag (e.g. "🇦🇷") using the countries-list package
// for the ISO 3166-1 alpha-2 code lookup.
// Returns empty string if country not found (graceful fallback).
// ============================================================
const _countryNameToCode: Record<string, string> = {};
for (const [code, data] of Object.entries(countries)) {
  _countryNameToCode[data.name.toLowerCase()] = code;
  if ('alias' in data && Array.isArray((data as any).alias)) {
    for (const alias of (data as any).alias as string[]) {
      _countryNameToCode[alias.toLowerCase()] = code;
    }
  }
}

export const getCountryFlag = (nationality: string | null | undefined): string => {
  if (!nationality) return '';
  const code = _countryNameToCode[nationality.trim().toLowerCase()];
  if (!code) return '';
  // Convert ISO 3166-1 alpha-2 to emoji: each letter → regional indicator symbol
  return code.toUpperCase().split('').map(
    char => String.fromCodePoint(0x1F1E6 - 65 + char.charCodeAt(0))
  ).join('');
};


// ============================================================
// POSITIONS
// ============================================================

export const POSITIONS: { value: PlayerPosition; label: string; group: 'GK' | 'DEF' | 'MID' | 'FWD' }[] = [
  // Goalkeeper
  { value: 'GK',  label: 'Goalkeeper',        group: 'GK' },
  // Defenders
  { value: 'CB',  label: 'Centre-Back',        group: 'DEF' },
  { value: 'LB',  label: 'Left Back',          group: 'DEF' },
  { value: 'RB',  label: 'Right Back',         group: 'DEF' },
  { value: 'LWB', label: 'Left Wing-Back',     group: 'DEF' },
  { value: 'RWB', label: 'Right Wing-Back',    group: 'DEF' },
  // Midfielders
  { value: 'CDM', label: 'Defensive Mid',      group: 'MID' },
  { value: 'CM',  label: 'Central Mid',        group: 'MID' },
  { value: 'CAM', label: 'Attacking Mid',      group: 'MID' },
  { value: 'LM',  label: 'Left Mid',           group: 'MID' },
  { value: 'RM',  label: 'Right Mid',          group: 'MID' },
  // Forwards
  { value: 'LW',  label: 'Left Winger',        group: 'FWD' },
  { value: 'RW',  label: 'Right Winger',       group: 'FWD' },
  { value: 'CF',  label: 'Centre Forward',     group: 'FWD' },
  { value: 'ST',  label: 'Striker',            group: 'FWD' },
];

// Color classes by position group (Tailwind classes)
export const POSITION_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  GK:  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   badge: 'badge-gk'  },
  DEF: { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/30',    badge: 'badge-def' },
  MID: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', badge: 'badge-mid' },
  FWD: { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30',     badge: 'badge-fwd' },
};

// Get the group for a given position value
export const getPositionGroup = (position: PlayerPosition): 'GK' | 'DEF' | 'MID' | 'FWD' => {
  return POSITIONS.find(p => p.value === position)?.group ?? 'MID';
};

// Get display label for a position
export const getPositionLabel = (position: PlayerPosition): string => {
  return POSITIONS.find(p => p.value === position)?.label ?? position;
};

// ============================================================
// FORMATIONS
// Each formation defines the number of players per line
// (back → front), which the tactical board uses to place tokens.
// ============================================================
export const FORMATIONS: {
  scheme: FormationScheme;
  label: string;
  lines: number[];
}[] = [
  // 4-back systems
  { scheme: '4-4-2',    label: '4-4-2 Classic',          lines: [4, 4, 2] },
  { scheme: '4-3-3',    label: '4-3-3 Attack',            lines: [4, 3, 3] },
  { scheme: '4-2-3-1',  label: '4-2-3-1 Modern',         lines: [4, 2, 3, 1] },
  { scheme: '4-5-1',    label: '4-5-1 Defensive',         lines: [4, 5, 1] },
  { scheme: '4-1-4-1',  label: '4-1-4-1 Counter',        lines: [4, 1, 4, 1] },
  { scheme: '4-3-2-1',  label: '4-3-2-1 Christmas Tree', lines: [4, 3, 2, 1] },
  { scheme: '4-4-1-1',  label: '4-4-1-1 Compact',        lines: [4, 4, 1, 1] },
  { scheme: '4-2-2-2',  label: '4-2-2-2 Box',            lines: [4, 2, 2, 2] },
  { scheme: '4-3-1-2',  label: '4-3-1-2 Diamond',        lines: [4, 3, 1, 2] },
  // 3-back systems
  { scheme: '3-5-2',    label: '3-5-2 Wing-Backs',       lines: [3, 5, 2] },
  { scheme: '3-4-3',    label: '3-4-3 Attack',            lines: [3, 4, 3] },
  // 5-back systems
  { scheme: '5-3-2',    label: '5-3-2 Defensive',         lines: [5, 3, 2] },
  { scheme: '5-4-1',    label: '5-4-1 Fortress',          lines: [5, 4, 1] },
];

// ============================================================
// SCOUTING LIST TYPES
// ============================================================
export const SCOUTING_LIST_TYPES: {
  value: ScoutingListType;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { value: 'wonderkid', label: 'Wonderkids',      emoji: '⭐', color: 'text-amber-400' },
  { value: 'target',    label: 'Transfer Targets', emoji: '🎯', color: 'text-blue-400' },
  { value: 'free_agent',label: 'Free Agents',      emoji: '🆓', color: 'text-emerald-400' },
  { value: 'sell',      label: 'Players to Sell',  emoji: '💰', color: 'text-red-400' },
];

// ============================================================
// TROPHY TYPES
// ============================================================
export const TROPHY_TYPES: { value: TrophyType; label: string; emoji: string }[] = [
  { value: 'league',        label: 'League Title',       emoji: '🥇' },
  { value: 'cup',           label: 'Domestic Cup',       emoji: '🏆' },
  { value: 'international', label: 'International Cup',  emoji: '🌍' },
  { value: 'individual',    label: 'Individual Award',   emoji: '⚽' },
  { value: 'other',         label: 'Other',              emoji: '🎖️' },
];

// ============================================================
// HELPERS: Money formatting
// Values are stored in USD cents in the DB to avoid floats.
// These helpers convert for display.
// ============================================================

// Convert cents to display string: 15000000 → "$15M"
export const formatValue = (cents: number | null | undefined): string => {
  if (cents == null) return '—';
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000)     return `$${(dollars / 1_000).toFixed(0)}K`;
  return `$${dollars.toFixed(0)}`;
};

// Convert wage cents to display string: 500000 -> "$5K/wk"
export const formatWage = (cents: number | null | undefined): string => {
  if (cents == null || cents === 0) return '—';
  const dollars = cents / 100;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(0)}K/wk`;
  return `$${dollars.toFixed(0)}/wk`;
};

// Convert dollar string input to cents: "15000000" → 1500000000
export const dollarsToCents = (dollars: number): number => Math.round(dollars * 100);

// Convert cents to dollars for form inputs
export const centsToDollars = (cents: number | null | undefined): number => {
  if (cents == null) return 0;
  return cents / 100;
};

// ============================================================
// AVATAR GENERATION
// Generates a consistent color for a player avatar based on
// their name (not random — same name = same color every time)
// ============================================================
const AVATAR_GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
];

export const getPlayerAvatarGradient = (name: string): [string, string] => {
  // Hash the name to get a consistent index
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index] as [string, string];
};

export const getPlayerInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ============================================================
// OVR GROWTH COLOR
// Returns a color class based on growth direction
// ============================================================
export const getGrowthColor = (start: number | null, end: number | null): string => {
  if (start == null || end == null) return 'text-white/50';
  const diff = end - start;
  if (diff > 0) return 'text-neon-400';
  if (diff < 0) return 'text-red-400';
  return 'text-white/50';
};
