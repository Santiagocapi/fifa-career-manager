// ============================================================
// src/components/records/careerRecords.ts
// Pure helpers that turn a whole career (every season's
// matches, events and season_stats) into its records: totals,
// all-time leaders, standout matches, streaks and breakdowns
// by season and by competition.
// ============================================================

import type { CareerMatch, Player, Season } from '../../types/database';
import type { CareerData } from '../../hooks/useCareerRecords';
import { summarizeMatches, type SeasonSummaryData } from '../matches/matchStats';

export type LeaderCategory = 'goals' | 'assists' | 'matches' | 'mvps' | 'clean_sheets';

export interface LeaderEntry {
  player: Player;
  value: number;
}

export interface MatchRecord {
  match: CareerMatch;
  season: Season;
}

export interface IndividualRecord extends MatchRecord {
  player: Player;
  goals: number;
}

export interface Streak {
  length: number;
  /** First and last match of the run */
  from: MatchRecord;
  to: MatchRecord;
}

export interface SeasonRow {
  season: Season;
  summary: SeasonSummaryData;
  trophies: number;
  topScorer: LeaderEntry | null;
}

export interface CompetitionRow {
  competition: string;
  summary: SeasonSummaryData;
}

export interface CareerRecords {
  matchesNewestFirst: CareerMatch[];
  summary: SeasonSummaryData;
  trophies: number;
  leaders: Record<LeaderCategory, LeaderEntry[]>;
  biggestWin: MatchRecord | null;
  heaviestLoss: MatchRecord | null;
  highestScoring: MatchRecord | null;
  /** Most goals by one player in one match (only from two goals up) */
  bestIndividual: IndividualRecord | null;
  streaks: {
    wins: Streak | null;
    unbeaten: Streak | null;
    cleanSheets: Streak | null;
    scoring: Streak | null;
  };
  bySeason: SeasonRow[];
  byCompetition: CompetitionRow[];
}

const LEADERS_SHOWN = 5;

/** Picks the best item by `score`; ties go to the earliest one in `items` */
function best<T>(items: T[], score: (item: T) => number): T | null {
  let winner: T | null = null;
  let top = -Infinity;
  items.forEach((item) => {
    const value = score(item);
    if (value > top) {
      top = value;
      winner = item;
    }
  });
  return winner;
}

/** Longest run of consecutive matches that meet `predicate`; ties keep the earliest */
function longestStreak(ordered: MatchRecord[], predicate: (m: CareerMatch) => boolean): Streak | null {
  let bestRun: Streak | null = null;
  let start = -1;
  ordered.forEach((record, i) => {
    if (!predicate(record.match)) {
      start = -1;
      return;
    }
    if (start === -1) start = i;
    const length = i - start + 1;
    if (!bestRun || length > bestRun.length) bestRun = { length, from: ordered[start], to: record };
  });
  return bestRun;
}

export function computeCareerRecords({ seasons, matches, stats, players, trophies }: CareerData): CareerRecords {
  const seasonById = new Map(seasons.map((s) => [s.id, s]));
  const playerById = new Map(players.map((p) => [p.id, p]));

  // Oldest first across the whole career: season order, then date, then when it was logged
  const ordered: MatchRecord[] = matches
    .filter((match) => seasonById.has(match.season_id))
    .map((match) => ({ match, season: seasonById.get(match.season_id) as Season }))
    .sort(
      (a, b) =>
        a.season.season_number - b.season.season_number ||
        a.match.match_date.localeCompare(b.match.match_date) ||
        a.match.created_at.localeCompare(b.match.created_at)
    );
  const newestFirst = ordered.map((r) => r.match).reverse();

  // ---- All-time leaders. Counters come from season_stats, which the match
  // functions keep in sync with match_events (migration 004).
  const totals = new Map<string, Record<LeaderCategory, number>>();
  const totalsFor = (playerId: string) => {
    let entry = totals.get(playerId);
    if (!entry) {
      entry = { goals: 0, assists: 0, matches: 0, mvps: 0, clean_sheets: 0 };
      totals.set(playerId, entry);
    }
    return entry;
  };
  stats.forEach((row) => {
    const entry = totalsFor(row.player_id);
    entry.goals += row.goals;
    entry.assists += row.assists;
    entry.matches += row.matches_played;
    entry.clean_sheets += row.clean_sheets;
  });
  ordered.forEach(({ match }) => {
    if (match.mvp_player_id) totalsFor(match.mvp_player_id).mvps += 1;
  });

  const rank = (category: LeaderCategory): LeaderEntry[] =>
    [...totals.entries()]
      .filter(([playerId, entry]) => entry[category] > 0 && playerById.has(playerId))
      .map(([playerId, entry]) => ({ player: playerById.get(playerId) as Player, value: entry[category] }))
      .sort((a, b) => b.value - a.value || a.player.full_name.localeCompare(b.player.full_name))
      .slice(0, LEADERS_SHOWN);

  // ---- Standout matches
  const wins = ordered.filter((r) => r.match.result === 'win');
  const losses = ordered.filter((r) => r.match.result === 'loss');
  // Margin first; with the same margin, the one with more goals is more memorable
  const biggestWin = best(wins, (r) => (r.match.team_score - r.match.opponent_score) * 100 + r.match.team_score);
  const heaviestLoss = best(losses, (r) => (r.match.opponent_score - r.match.team_score) * 100 + r.match.opponent_score);
  const highestScoring = best(ordered, (r) => r.match.team_score + r.match.opponent_score);

  const individual = best(
    ordered.flatMap((record) =>
      record.match.events
        .filter((e) => e.goals >= 2 && playerById.has(e.player_id))
        .map((e) => ({ ...record, player: playerById.get(e.player_id) as Player, goals: e.goals }))
    ),
    (r) => r.goals
  );

  // ---- By season and by competition
  const bySeason: SeasonRow[] = seasons.map((season) => {
    const seasonMatches = newestFirst.filter((m) => m.season_id === season.id);
    const scorer = best(
      stats.filter((row) => row.season_id === season.id && row.goals > 0 && playerById.has(row.player_id)),
      (row) => row.goals
    );
    return {
      season,
      summary: summarizeMatches(seasonMatches),
      trophies: trophies.filter((t) => t.season_id === season.id).length,
      topScorer: scorer ? { player: playerById.get(scorer.player_id) as Player, value: scorer.goals } : null,
    };
  });

  const competitions = new Map<string, CareerMatch[]>();
  newestFirst.forEach((match) => {
    const key = match.competition || 'League';
    competitions.set(key, [...(competitions.get(key) ?? []), match]);
  });
  const byCompetition: CompetitionRow[] = [...competitions.entries()]
    .map(([competition, list]) => ({ competition, summary: summarizeMatches(list) }))
    .sort((a, b) => b.summary.played - a.summary.played);

  return {
    matchesNewestFirst: newestFirst,
    summary: summarizeMatches(newestFirst),
    trophies: trophies.length,
    leaders: {
      goals: rank('goals'),
      assists: rank('assists'),
      matches: rank('matches'),
      mvps: rank('mvps'),
      clean_sheets: rank('clean_sheets'),
    },
    biggestWin,
    heaviestLoss,
    highestScoring,
    bestIndividual: individual,
    streaks: {
      wins: longestStreak(ordered, (m) => m.result === 'win'),
      unbeaten: longestStreak(ordered, (m) => m.result !== 'loss'),
      cleanSheets: longestStreak(ordered, (m) => m.opponent_score === 0),
      scoring: longestStreak(ordered, (m) => m.team_score > 0),
    },
    bySeason,
    byCompetition,
  };
}
