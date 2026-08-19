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

const COMMON_FIFA_CODES: Record<string, string> = {
  ARG: 'AR', ESP: 'ES', BRA: 'BR', FRA: 'FR', GER: 'DE', ITA: 'IT',
  ENG: 'GB', GBR: 'GB', POR: 'PT', NED: 'NL', URU: 'UY', COL: 'CO',
  CHI: 'CL', MEX: 'MX', USA: 'US', CRO: 'HR', SEN: 'SN', MAR: 'MA',
  BEL: 'BE', JPN: 'JP', KOR: 'KR', SRB: 'RS', NGA: 'NG', CMR: 'CM',
  PAR: 'PY', PER: 'PE', ECU: 'EC', VEN: 'VE', BOL: 'BO', CAN: 'CA',
  AUS: 'AU', NOR: 'NO', SWE: 'SE', DEN: 'DK', POL: 'PL', SUI: 'CH',
  AUT: 'AT', SCO: 'GB', WAL: 'GB', NIR: 'GB', ALG: 'DZ', EGY: 'EG',
  CIV: 'CI', GHA: 'GH', RSA: 'ZA', TUR: 'TR', UKR: 'UA', CZE: 'CZ',
  GRE: 'GR', ROU: 'RO', SVK: 'SK', SVN: 'SI', HUN: 'HU', FIN: 'FI',
  IRL: 'IE', NZL: 'NZ', TUN: 'TN',
};

const SPANISH_AND_COMMON_COUNTRIES: Record<string, string> = {
  'españa': 'es', 'argentin': 'ar', 'argentina': 'ar', 'brasil': 'br', 'brazil': 'br',
  'francia': 'fr', 'alemania': 'de', 'italia': 'it', 'inglaterra': 'gb',
  'reino unido': 'gb', 'portugal': 'pt', 'holanda': 'nl', 'países bajos': 'nl',
  'paises bajos': 'nl', 'uruguay': 'uy', 'colombia': 'co', 'chile': 'cl',
  'méxico': 'mx', 'mexico': 'mx', 'estados unidos': 'us', 'eeuu': 'us',
  'croacia': 'hr', 'senegal': 'sn', 'marruecos': 'ma', 'bélgica': 'be',
  'belgica': 'be', 'japón': 'jp', 'japon': 'jp', 'corea': 'kr', 'corea del sur': 'kr',
  'serbia': 'rs', 'nigeria': 'ng', 'camerún': 'cm', 'camerun': 'cm', 'paraguay': 'py',
  'perú': 'pe', 'peru': 'pe', 'ecuador': 'ec', 'venezuela': 've', 'bolivia': 'bo',
  'canadá': 'ca', 'canada': 'ca', 'australia': 'au', 'noruega': 'no', 'suecia': 'se',
  'dinamarca': 'dk', 'polonia': 'pl', 'suiza': 'ch', 'austria': 'at', 'escocia': 'gb',
  'gales': 'gb', 'irlanda': 'ie', 'argelia': 'dz', 'egipto': 'eg', 'costa de marfil': 'ci',
  'ghana': 'gh', 'sudáfrica': 'za', 'sudafrica': 'za', 'turquía': 'tr', 'turquia': 'tr',
  'ucrania': 'ua', 'chequia': 'cz', 'república checa': 'cz', 'grecia': 'gr',
  'rumanía': 'ro', 'rumania': 'ro', 'eslovaquia': 'sk', 'eslovenia': 'si',
  'hungría': 'hu', 'hungria': 'hu', 'finlandia': 'fi', 'nueva zelanda': 'nz', 'túnez': 'tn', 'tunez': 'tn',
};

export const getCountryCode = (nationality: string | null | undefined): string | null => {
  if (!nationality) return null;
  const trimmed = nationality.trim().toLowerCase();

  // 1. Spanish and common dictionary check
  if (trimmed in SPANISH_AND_COMMON_COUNTRIES) {
    return SPANISH_AND_COMMON_COUNTRIES[trimmed];
  }

  const upper = trimmed.toUpperCase();

  // 2. Direct 2-letter ISO code (e.g. "AR", "ES", "SN", "US", "DE")
  if (upper.length === 2 && upper in countries) {
    return upper.toLowerCase();
  }

  // 3. 3-letter FIFA code (e.g. "ARG", "ESP", "BRA", "ENG")
  if (upper in COMMON_FIFA_CODES) {
    return COMMON_FIFA_CODES[upper].toLowerCase();
  }

  // 4. Full country name or alias in countries-list
  const code = _countryNameToCode[trimmed];
  return code ? code.toLowerCase() : null;
};

export const getCountryFlag = (nationality: string | null | undefined): string => {
  if (!nationality) return '';
  const trimmed = nationality.trim();
  const upper = trimmed.toUpperCase();

  // 1. Direct 2-letter ISO code (e.g. "AR", "ES", "SN", "US", "DE")
  if (upper.length === 2 && upper in countries) {
    return upper.split('').map(char => String.fromCodePoint(0x1F1E6 - 65 + char.charCodeAt(0))).join('');
  }

  // 2. 3-letter FIFA code (e.g. "ARG", "ESP", "BRA", "ENG")
  if (upper in COMMON_FIFA_CODES) {
    const code = COMMON_FIFA_CODES[upper];
    return code.split('').map(char => String.fromCodePoint(0x1F1E6 - 65 + char.charCodeAt(0))).join('');
  }

  // 3. Full country name or alias (e.g. "Argentina", "Spain")
  const code = _countryNameToCode[trimmed.toLowerCase()];
  if (!code) return '';
  return code.toUpperCase().split('').map(char => String.fromCodePoint(0x1F1E6 - 65 + char.charCodeAt(0))).join('');
};

export const GROUP_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

export const sortPlayersByPosition = <T extends { preferred_position: PlayerPosition; full_name: string }>(playersList: T[]): T[] => {
  return [...playersList].sort((a, b) => {
    const ga = GROUP_ORDER[getPositionGroup(a.preferred_position)] ?? 9;
    const gb = GROUP_ORDER[getPositionGroup(b.preferred_position)] ?? 9;
    if (ga !== gb) return ga - gb;
    return a.preferred_position.localeCompare(b.preferred_position) || a.full_name.localeCompare(b.full_name);
  });
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
