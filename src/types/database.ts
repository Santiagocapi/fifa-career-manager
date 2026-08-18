// ============================================================
// src/types/database.ts
// TypeScript types that mirror the Supabase database schema.
// These types give us compile-time safety — if you type
// player.goles TypeScript will error. The correct field is player.goals.
// ============================================================

// Position constants — used in dropdowns and validation
export type PlayerPosition =
  | 'GK'
  | 'CB' | 'LB' | 'RB' | 'LWB' | 'RWB'
  | 'CDM' | 'CM' | 'CAM'
  | 'LM' | 'RM'
  | 'LW' | 'RW'
  | 'CF' | 'ST';

export type ScoutingListType = 'wonderkid' | 'sell' | 'target' | 'free_agent';

export type TrophyType = 'league' | 'cup' | 'international' | 'individual' | 'other';

// Formation schemes available in the tactical board
export type FormationScheme =
  | '4-4-2'
  | '4-3-3'
  | '4-2-3-1'
  | '4-5-1'
  | '4-1-4-1'
  | '4-3-2-1'
  | '3-5-2'
  | '3-4-3'
  | '5-3-2'
  | '5-4-1'
  | '4-4-1-1'
  | '4-2-2-2'
  | '4-3-1-2';

// ============================================================
// Database row types (match the SQL schema exactly)
// ============================================================

export interface Career {
  id: string;
  user_id: string;
  club_name: string;
  manager_name: string;
  league: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  career_id: string;
  year_label: string;         // e.g., "2024/2025"
  season_number: number;      // 1, 2, 3...
  is_active: boolean;
  is_closed: boolean;
  created_at: string;
}

export interface Player {
  id: string;
  career_id: string;
  full_name: string;
  nationality: string | null;
  preferred_position: PlayerPosition;
  age: number | null;             // FIFA age (e.g. 21)
  joined_year: number | null;     // Year joined club (e.g. 2024)
  date_of_birth: string | null;   // legacy ISO date string (optional)
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeasonStats {
  id: string;
  player_id: string;
  season_id: string;
  // Snapshot values
  ovr_start: number | null;
  market_value_start: number | null;   // in USD cents
  salary: number | null;               // annual, in USD cents
  ovr_end: number | null;              // filled at season close
  market_value_end: number | null;     // filled at season close
  // Performance stats
  matches_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheets: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MatchResult = 'win' | 'draw' | 'loss';

export interface Match {
  id: string;
  season_id: string;
  opponent: string;
  competition: string | null;
  team_score: number;
  opponent_score: number;
  result: MatchResult;
  mvp_player_id: string | null;
  match_date: string;
  created_at: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  goals: number;
  assists: number;
  yellow_card: boolean;
  red_card: boolean;
  clean_sheet: boolean;
  injured: boolean;
}

export interface H2HRecord {
  opponent: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface ScoutingEntry {
  id: string;
  career_id: string;
  full_name: string;
  position: string | null;
  nationality: string | null;
  current_club: string | null;
  current_ovr: number | null;
  estimated_value: number | null;   // in USD cents
  list_type: ScoutingListType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Formation {
  id: string;
  season_id: string;
  name: string;
  scheme: FormationScheme;
  is_default: boolean;
  created_at: string;
}

export interface FormationPlayer {
  id: string;
  formation_id: string;
  player_id: string;
  position_x: number;   // 0.0 – 1.0 (relative to pitch width)
  position_y: number;   // 0.0 – 1.0 (relative to pitch height)
  slot_label: string | null;
}

export interface Trophy {
  id: string;
  season_id: string;
  trophy_name: string;
  trophy_type: TrophyType;
  icon: string | null;
  created_at: string;
}

// ============================================================
// Enriched / Joined types (used in the UI, combine multiple tables)
// ============================================================

// A player with their current season stats — the most common UI entity
export interface PlayerWithStats extends Player {
  stats: SeasonStats | null;
}

// A match with its events and MVP player details
export interface MatchWithDetails extends Match {
  mvp_player?: Player | null;
  events: (MatchEvent & { player: Player })[];
}

// A season with its list of trophies
export interface SeasonWithTrophies extends Season {
  trophies: Trophy[];
}

// A formation with its positioned players
export interface FormationWithPlayers extends Formation {
  formation_players: (FormationPlayer & { player: Player })[];
}

// ============================================================
// Helper types for forms (Omit database-managed fields)
// ============================================================

export type CreateCareerDto = Omit<Career, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type CreatePlayerDto = Omit<Player, 'id' | 'created_at' | 'updated_at'>;
export type CreateSeasonStatsDto = Omit<SeasonStats, 'id' | 'created_at' | 'updated_at'>;
export type CreateScoutingEntryDto = Omit<ScoutingEntry, 'id' | 'created_at' | 'updated_at'>;
export type CreateTrophyDto = Omit<Trophy, 'id' | 'created_at'>;
export type CreateMatchDto = Omit<Match, 'id' | 'created_at'>;
export type CreateMatchEventDto = Omit<MatchEvent, 'id'>;
