// ============================================================
// src/components/profile/RecentMatches.tsx
// Matches the player played, newest first, with what they did
// in each one; each row opens the match. Shows the last 10 and
// expands to all of them.
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Cross, Star } from 'lucide-react';
import type { PlayerMatchEvent } from '../../types/database';
import { formatShortDate, getCompetitionLabel } from '../../lib/constants';
import ResultBadge from '../matches/ResultBadge';
import EventSummary from '../matches/EventSummary';

const INITIAL_COUNT = 10;

interface RecentMatchesProps {
  /** Played matches only, newest first */
  events: PlayerMatchEvent[];
  playerId: string;
}

export default function RecentMatches({ events, playerId }: RecentMatchesProps) {
  const [showAll, setShowAll] = useState(false);

  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-white/40">Todavía no ha jugado ningún partido.</p>;
  }

  const visible = showAll ? events : events.slice(0, INITIAL_COUNT);

  return (
    <>
      <ul className="divide-y divide-pitch-700/60">
        {visible.map(({ id, match, ...event }) => (
          <li key={id}>
            <Link
              to={`/stats/${match.id}`}
              className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03] active:bg-white/5"
            >
              <ResultBadge result={match.result} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  <span className="text-white/40">vs</span> {match.opponent}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/50">
                  {getCompetitionLabel(match.competition)} · {formatShortDate(match.match_date)}
                </p>
              </div>
              <span className="flex flex-shrink-0 items-center gap-1.5">
                {match.mvp_player_id === playerId && (
                  <Star size={13} className="fill-amber-400 text-amber-400" aria-label="MVP del partido" />
                )}
                {event.injured && <Cross size={13} strokeWidth={3} className="text-red-400" aria-label="Se lesionó" />}
                <EventSummary event={event} />
              </span>
              <span className="w-12 flex-shrink-0 text-right font-black tabular-nums text-white">
                {match.team_score}
                <span className="mx-0.5 text-white/30">-</span>
                {match.opponent_score}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {events.length > INITIAL_COUNT && (
        <button type="button" onClick={() => setShowAll(!showAll)} className="btn-ghost btn-sm mx-auto mt-2 flex">
          {showAll ? 'Ver menos' : `Ver los ${events.length} partidos`}
          <ChevronDown size={14} className={showAll ? 'rotate-180' : undefined} />
        </button>
      )}
    </>
  );
}
