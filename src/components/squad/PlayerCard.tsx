// ============================================================
// src/components/squad/PlayerCard.tsx
// Squad card. The whole card is a button that opens the editor.
// ============================================================

import { Cross, TrendingDown, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlayerWithStats } from '../../types/database';
import { formatValue, formatWage } from '../../lib/constants';
import PlayerAvatar from '../player/PlayerAvatar';
import PositionBadge from '../player/PositionBadge';
import OvrBadge from '../player/OvrBadge';
import Flag from '../player/Flag';

interface PlayerCardProps {
  player: PlayerWithStats;
  onEdit: (player: PlayerWithStats) => void;
}

export default function PlayerCard({ player, onEdit }: PlayerCardProps) {
  const { stats } = player;
  const currentOvr = stats ? stats.ovr_end ?? stats.ovr_start : null;
  const growth = stats?.ovr_start != null && currentOvr != null ? currentOvr - stats.ovr_start : 0;
  const value = stats?.market_value_end ?? stats?.market_value_start;
  const injured = stats?.is_injured ?? false;

  return (
    <article className={clsx('card-interactive relative flex flex-col gap-3 p-3.5', injured && 'border-red-500/30')}>
      {/* The whole card opens the editor */}
      <button
        type="button"
        onClick={() => onEdit(player)}
        aria-label={`Editar a ${player.full_name}`}
        className="absolute inset-0 rounded-2xl"
      />

      <div className="pointer-events-none flex items-center gap-3">
        <PlayerAvatar name={player.full_name} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate font-bold text-white" translate="no">
              {player.full_name}
            </h3>
            {injured && (
              <span className="badge flex-shrink-0 border-red-500/30 bg-red-500/15 text-red-300">
                <Cross size={10} strokeWidth={3} /> Lesionado
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
            <PositionBadge position={player.preferred_position} />
            <Flag nationality={player.nationality} />
            {player.age && <span>{player.age} años</span>}
            {player.joined_year && <span className="text-white/40">· desde {player.joined_year}</span>}
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-center gap-0.5">
          <OvrBadge ovr={currentOvr} />
          {growth !== 0 && (
            <span
              className={clsx(
                'flex items-center gap-0.5 text-2xs font-bold tabular-nums',
                growth > 0 ? 'text-neon-400' : 'text-red-400'
              )}
            >
              {growth > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {growth > 0 ? '+' : ''}
              {growth}
            </span>
          )}
        </div>
      </div>

      {stats && (
        <div className="pointer-events-none flex flex-col gap-2 rounded-xl bg-pitch-900/60 px-3 py-2">
          <dl className="grid grid-cols-4 text-center">
            <MiniStat label="PJ" value={stats.matches_played} />
            <MiniStat label="Goles" value={stats.goals} />
            <MiniStat label="Asist." value={stats.assists} />
            <MiniStat label="Amarillas" value={stats.yellow_cards} />
          </dl>
          {(value != null || stats.salary != null) && (
            <div className="flex items-center justify-between gap-2 border-t border-pitch-700/70 pt-2 text-xs">
              <span className="text-white/45">
                Valor <span className="font-semibold text-white/85">{formatValue(value)}</span>
              </span>
              <span className="text-white/45">
                Salario <span className="font-semibold text-neon-300">{formatWage(stats.salary)}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-2xs text-white/40">{label}</dt>
      <dd className={clsx('text-sm font-bold tabular-nums', value > 0 ? 'text-white' : 'text-white/35')}>{value}</dd>
    </div>
  );
}
