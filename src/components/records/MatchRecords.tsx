// ============================================================
// src/components/records/MatchRecords.tsx
// The standout matches of the career: biggest win, heaviest
// defeat, most goals in a match and the best individual game.
// Each card opens the match.
// ============================================================

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Frown, PartyPopper, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import type { CareerRecords, MatchRecord } from './careerRecords';
import { formatShortDate } from '../../lib/constants';
import { BallIcon } from '../icons/FootballIcons';

type Props = Pick<CareerRecords, 'biggestWin' | 'heaviestLoss' | 'highestScoring' | 'bestIndividual'>;

export default function MatchRecords({ biggestWin, heaviestLoss, highestScoring, bestIndividual }: Props) {
  return (
    <section aria-labelledby="match-records-title">
      <h2 id="match-records-title" className="section-title mb-3">
        Partidos para el recuerdo
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <RecordCard
          label="Mayor goleada"
          icon={<PartyPopper size={16} className="text-neon-400" />}
          record={biggestWin}
          empty="Aún no has ganado ningún partido."
          scoreClass="text-neon-300"
        />
        <RecordCard
          label="Peor derrota"
          icon={<Frown size={16} className="text-red-400" />}
          record={heaviestLoss}
          empty="Todavía no has perdido ningún partido."
          scoreClass="text-red-300"
        />
        <RecordCard
          label="Partido con más goles"
          icon={<Sparkles size={16} className="text-amber-300" />}
          record={highestScoring}
          empty="Aún no hay partidos."
          scoreClass="text-white"
        />
        <RecordCard
          label="Mejor actuación individual"
          icon={<BallIcon size={16} className="text-neon-400" />}
          record={bestIndividual}
          empty="Nadie ha marcado todavía un doblete."
          scoreClass="text-white"
          headline={
            bestIndividual && (
              <>
                <span translate="no">{bestIndividual.player.full_name}</span>
                <span className="ml-1.5 text-neon-300">{bestIndividual.goals} goles</span>
              </>
            )
          }
        />
      </div>
    </section>
  );
}

interface RecordCardProps {
  label: string;
  icon: ReactNode;
  record: MatchRecord | null;
  empty: string;
  scoreClass: string;
  /** Replaces the score as the main line (individual record) */
  headline?: ReactNode;
}

function RecordCard({ label, icon, record, empty, scoreClass, headline }: RecordCardProps) {
  const title = (
    <p className="flex items-center gap-1.5 text-xs font-semibold text-white/55">
      <span aria-hidden="true">{icon}</span>
      {label}
    </p>
  );

  if (!record) {
    return (
      <div className="card p-4">
        {title}
        <p className="mt-3 text-sm text-white/40">{empty}</p>
      </div>
    );
  }

  const { match, season } = record;
  return (
    <Link to={`/stats/${match.id}`} className="card-interactive flex items-center gap-3 p-4 hover:border-pitch-600">
      <div className="min-w-0 flex-1">
        {title}
        <p className={clsx('mt-2 truncate font-black', headline ? 'text-base text-white' : clsx('text-2xl tabular-nums', scoreClass))}>
          {headline ?? (
            <>
              {match.team_score}
              <span className="mx-1 text-white/25">-</span>
              {match.opponent_score}
            </>
          )}
        </p>
        <p className="mt-1 truncate text-xs text-white/50">
          {headline && `${match.team_score}-${match.opponent_score} `}
          vs {match.opponent} · {season.year_label} · {formatShortDate(match.match_date)}
        </p>
      </div>
      <ChevronRight size={18} className="flex-shrink-0 text-white/30" />
    </Link>
  );
}
