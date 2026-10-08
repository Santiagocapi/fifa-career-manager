// ============================================================
// src/components/matches/MatchListItem.tsx
// One match row: result, rival, competition, MVP and score.
// Interactive (opens the editor) when onClick is given.
// ============================================================

import { ChevronRight, Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { MatchWithDetails } from '../../types/database';
import { getCompetitionLabel } from '../../lib/constants';
import ResultBadge from './ResultBadge';

interface MatchListItemProps {
  match: MatchWithDetails;
  onClick?: () => void;
  compact?: boolean;
}

export default function MatchListItem({ match, onClick, compact = false }: MatchListItemProps) {
  const content = (
    <>
      <ResultBadge result={match.result} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">
          <span className="text-white/40">vs</span> {match.opponent}
        </p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-white/50">
          <span className="truncate">{getCompetitionLabel(match.competition)}</span>
          {!compact && match.mvp_player && (
            <>
              <span aria-hidden="true">·</span>
              <Star size={11} className="flex-shrink-0 fill-amber-400 text-amber-400" />
              <span className="truncate text-amber-300/90" translate="no">
                {match.mvp_player.full_name}
              </span>
            </>
          )}
        </p>
      </div>
      <span className="flex-shrink-0 text-lg font-black tabular-nums text-white">
        {match.team_score}
        <span className="mx-1 text-white/30">-</span>
        {match.opponent_score}
      </span>
      {onClick && <ChevronRight size={18} className="flex-shrink-0 text-white/30" />}
    </>
  );

  const classes = clsx('flex w-full items-center gap-3 text-left', compact ? 'py-2.5' : 'p-3.5');

  if (!onClick) return <div className={classes}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Editar partido contra ${match.opponent}, ${match.team_score} a ${match.opponent_score}`}
      className={clsx(classes, 'rounded-2xl transition-colors active:bg-white/5 hover:bg-white/[0.03]')}
    >
      {content}
    </button>
  );
}
