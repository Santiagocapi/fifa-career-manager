// ============================================================
// src/components/matches/MvpRanking.tsx
// Top players by match MVP awards this season.
// ============================================================

import { Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { MvpRanking as MvpRankingRow } from './matchStats';
import PlayerAvatar from '../player/PlayerAvatar';
import PositionBadge from '../player/PositionBadge';
import Flag from '../player/Flag';

export default function MvpRanking({ ranking }: { ranking: MvpRankingRow[] }) {
  if (ranking.length === 0) {
    return <p className="py-4 text-center text-sm text-white/40">Todavía no has elegido ningún MVP.</p>;
  }

  return (
    <ol className="flex flex-col gap-2">
      {ranking.slice(0, 5).map(({ player, count }, index) => (
        <li key={player.id} className="flex items-center gap-3 rounded-xl border border-pitch-700 bg-pitch-900/50 px-3 py-2">
          <span
            className={clsx(
              'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black tabular-nums',
              index === 0 ? 'bg-amber-400 text-pitch-950' : 'bg-pitch-700 text-white/70'
            )}
          >
            {index + 1}
          </span>
          <PlayerAvatar name={player.full_name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white" translate="no">
              {player.full_name}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5">
              <PositionBadge position={player.preferred_position} />
              <Flag nationality={player.nationality} />
            </p>
          </div>
          <span className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-xs font-bold tabular-nums text-amber-300">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {count}
          </span>
        </li>
      ))}
    </ol>
  );
}
