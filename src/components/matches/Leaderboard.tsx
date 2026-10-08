// ============================================================
// src/components/matches/Leaderboard.tsx
// Season player stats table. Tap a column to rank by it; the
// player column stays pinned while the numbers scroll sideways.
// The last column marks a player as injured.
// ============================================================

import { useMemo, useState, type ReactNode } from 'react';
import { Cross, Footprints } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlayerWithStats, SeasonStats } from '../../types/database';
import { sortPlayersByPosition } from '../../lib/constants';
import { BallIcon, CardIcon, GloveIcon } from '../icons/FootballIcons';
import PositionBadge from '../player/PositionBadge';

type StatKey = keyof Pick<SeasonStats, 'matches_played' | 'goals' | 'assists' | 'yellow_cards' | 'red_cards' | 'clean_sheets'>;

const COLUMNS: { key: StatKey; label: ReactNode; title: string; valueClass: string }[] = [
  { key: 'matches_played', label: 'PJ', title: 'Partidos jugados', valueClass: 'text-white/80' },
  { key: 'goals', label: <BallIcon size={15} />, title: 'Goles', valueClass: 'text-neon-300 font-bold' },
  { key: 'assists', label: <Footprints size={15} />, title: 'Asistencias', valueClass: 'text-electric-300 font-bold' },
  { key: 'yellow_cards', label: <CardIcon size={15} filled className="text-amber-400" />, title: 'Tarjetas amarillas', valueClass: 'text-amber-300' },
  { key: 'red_cards', label: <CardIcon size={15} filled className="text-red-500" />, title: 'Tarjetas rojas', valueClass: 'text-red-300' },
  { key: 'clean_sheets', label: <GloveIcon size={15} />, title: 'Vallas invictas', valueClass: 'text-emerald-300' },
];

interface LeaderboardProps {
  players: PlayerWithStats[];
  onToggleInjured: (playerId: string, injured: boolean) => void;
}

export default function Leaderboard({ players, onToggleInjured }: LeaderboardProps) {
  const [sortKey, setSortKey] = useState<StatKey | null>(null);

  const rows = useMemo(() => {
    const byPosition = sortPlayersByPosition(players);
    if (!sortKey) return byPosition;
    return [...byPosition].sort((a, b) => (b.stats?.[sortKey] ?? 0) - (a.stats?.[sortKey] ?? 0));
  }, [players, sortKey]);

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">Estadísticas de los jugadores en la temporada</caption>
          <thead>
            <tr className="border-b border-pitch-700 text-white/50">
              <th scope="col" className="sticky left-0 z-10 bg-pitch-800 px-3 py-2 text-left text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSortKey(null)}
                  className={clsx('rounded-md py-1', sortKey === null && 'text-neon-300')}
                >
                  Jugador
                </button>
              </th>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={sortKey === column.key ? 'descending' : 'none'}
                  className="px-1 py-2 text-center text-xs font-semibold"
                >
                  <button
                    type="button"
                    onClick={() => setSortKey(sortKey === column.key ? null : column.key)}
                    title={`Ordenar por ${column.title.toLowerCase()}`}
                    aria-label={column.title}
                    className={clsx(
                      'mx-auto flex h-9 min-w-[2.5rem] items-center justify-center rounded-lg px-2 transition-colors',
                      sortKey === column.key ? 'bg-neon-400/15 text-neon-300' : 'hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {column.label}
                  </button>
                </th>
              ))}
              <th scope="col" className="px-2 py-2 text-center text-xs font-semibold">
                Lesión
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pitch-700/60">
            {rows.map((player) => {
              const injured = player.stats?.is_injured ?? false;
              return (
                <tr key={player.id} className={clsx(injured && 'bg-red-500/[0.04]')}>
                  <th scope="row" className="sticky left-0 z-10 bg-pitch-800 px-3 py-2 text-left font-medium">
                    <span className="flex max-w-[11rem] items-center gap-2 sm:max-w-none">
                      <PositionBadge position={player.preferred_position} />
                      <span className={clsx('truncate', injured ? 'text-white/50' : 'text-white')} translate="no">
                        {player.full_name}
                      </span>
                    </span>
                  </th>
                  {COLUMNS.map((column) => {
                    const value = player.stats?.[column.key] ?? 0;
                    return (
                      <td key={column.key} className={clsx('px-1 py-2 text-center tabular-nums', value > 0 ? column.valueClass : 'text-white/25')}>
                        {value}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleInjured(player.id, !injured)}
                      disabled={!player.stats}
                      aria-pressed={injured}
                      aria-label={injured ? `Marcar a ${player.full_name} como disponible` : `Marcar a ${player.full_name} como lesionado`}
                      title={injured ? 'Lesionado: tocar para darle el alta' : 'Marcar como lesionado'}
                      className={clsx(
                        'mx-auto flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-30',
                        injured
                          ? 'border-red-500/50 bg-red-500/20 text-red-300'
                          : 'border-pitch-600 bg-pitch-900 text-white/25 hover:border-red-500/40 hover:text-red-300'
                      )}
                    >
                      <Cross size={15} strokeWidth={2.5} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Hint that more columns are hidden to the right on narrow screens */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-pitch-800 to-transparent sm:hidden" />
    </div>
  );
}
