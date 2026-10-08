// ============================================================
// src/components/matches/matchStats.ts
// Pure helpers that summarize a season's matches for the UI.
// Matches arrive newest first (see useMatches).
// ============================================================

import type { MatchResult, MatchWithDetails, PlayerWithStats } from '../../types/database';

export interface SeasonSummaryData {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  winRate: number;
  /** Last five results, oldest first so it reads left to right */
  form: MatchResult[];
}

export function summarizeMatches(matches: MatchWithDetails[]): SeasonSummaryData {
  const wins = matches.filter((m) => m.result === 'win').length;
  const draws = matches.filter((m) => m.result === 'draw').length;
  const losses = matches.filter((m) => m.result === 'loss').length;

  return {
    played: matches.length,
    wins,
    draws,
    losses,
    goalsFor: matches.reduce((sum, m) => sum + m.team_score, 0),
    goalsAgainst: matches.reduce((sum, m) => sum + m.opponent_score, 0),
    cleanSheets: matches.filter((m) => m.opponent_score === 0).length,
    winRate: matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0,
    form: matches.slice(0, 5).map((m) => m.result).reverse(),
  };
}

export interface MvpRanking {
  player: PlayerWithStats;
  count: number;
}

export function rankMvps(matches: MatchWithDetails[], players: PlayerWithStats[]): MvpRanking[] {
  const counts = new Map<string, number>();
  matches.forEach((m) => {
    if (m.mvp_player_id) counts.set(m.mvp_player_id, (counts.get(m.mvp_player_id) ?? 0) + 1);
  });

  return players
    .filter((p) => counts.has(p.id))
    .map((player) => ({ player, count: counts.get(player.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}
