// ============================================================
// src/components/match/Scoreboard.tsx
// Match detail header: both teams, the score, the result and
// where and when it was played, plus the MVP.
// ============================================================

import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Star, Trophy } from 'lucide-react';
import { clsx } from 'clsx';
import type { MatchResult, MatchWithSeason } from '../../types/database';
import { getCompetitionLabel } from '../../lib/constants';
import ClubCrest from '../ui/ClubCrest';
import PlayerAvatar from '../player/PlayerAvatar';
import PositionBadge from '../player/PositionBadge';

const RESULT_LABEL: Record<MatchResult, { label: string; classes: string }> = {
  win: { label: 'Victoria', classes: 'border-neon-400/40 bg-neon-400/15 text-neon-300' },
  draw: { label: 'Empate', classes: 'border-amber-400/40 bg-amber-400/15 text-amber-300' },
  loss: { label: 'Derrota', classes: 'border-red-400/40 bg-red-400/15 text-red-300' },
};

const formatMatchDate = (isoDate: string) => {
  // Noon avoids the date shifting a day in time zones west of UTC
  const date = new Date(`${isoDate}T12:00:00`).toLocaleDateString('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return date.charAt(0).toUpperCase() + date.slice(1);
};

interface ScoreboardProps {
  match: MatchWithSeason;
  teamName: string;
}

export default function Scoreboard({ match, teamName }: ScoreboardProps) {
  const result = RESULT_LABEL[match.result];
  const mvp = match.mvp_player;

  return (
    <section className="card relative overflow-hidden" aria-label={`${teamName} ${match.team_score}, ${match.opponent} ${match.opponent_score}`}>
      {/* Glow tinted by the result */}
      <div
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl',
          match.result === 'win' ? 'bg-neon-400/15' : match.result === 'draw' ? 'bg-amber-400/10' : 'bg-red-500/10'
        )}
      />

      <div className="relative flex flex-col items-center gap-1 px-4 pt-4 text-center text-xs text-white/55">
        <span className="flex items-center gap-1.5 font-semibold text-white/75">
          <Trophy size={13} aria-hidden="true" /> {getCompetitionLabel(match.competition)}
          <span className="font-normal text-white/45">· Temporada {match.season.year_label}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays size={13} aria-hidden="true" /> {formatMatchDate(match.match_date)}
        </span>
      </div>

      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pb-5 pt-4 sm:gap-6 sm:px-6">
        <TeamSide name={teamName} tone="neon" />
        <div className="flex flex-col items-center gap-2">
          <p className="text-5xl font-black tabular-nums leading-none text-white sm:text-6xl">
            {match.team_score}
            <span className="mx-1.5 text-white/25 sm:mx-2.5">-</span>
            {match.opponent_score}
          </p>
          <span className={clsx('badge', result.classes)}>{result.label}</span>
        </div>
        <TeamSide name={match.opponent} tone="muted" />
      </div>

      {mvp && (
        <Link
          to={`/squad/${mvp.id}`}
          className="relative flex items-center gap-3 border-t border-pitch-700/70 bg-amber-400/[0.04] px-4 py-3 transition-colors hover:bg-amber-400/[0.08] sm:px-5"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
            <Star size={18} className="fill-amber-400" />
          </span>
          <PlayerAvatar name={mvp.full_name} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block text-2xs font-semibold uppercase tracking-wide text-amber-300/80">MVP del partido</span>
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-bold text-white" translate="no">
                {mvp.full_name}
              </span>
              <PositionBadge position={mvp.preferred_position} />
            </span>
          </span>
          <ChevronRight size={18} className="flex-shrink-0 text-white/30" />
        </Link>
      )}
    </section>
  );
}

function TeamSide({ name, tone }: { name: string; tone: 'neon' | 'muted' }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <ClubCrest name={name} size={44} tone={tone} />
      <span className={clsx('line-clamp-2 text-sm font-bold leading-tight', tone === 'neon' ? 'text-white' : 'text-white/80')}>
        {name}
      </span>
    </div>
  );
}
