// ============================================================
// src/components/profile/SeasonTotals.tsx
// The player's numbers in one season: appearances, goals,
// assists, MVP awards, cards (and clean sheets for keepers and
// defenders), plus rating, value and wage.
// ============================================================

import type { ReactNode } from 'react';
import { Footprints, Lock, Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlayerPosition, PlayerSeasonStats } from '../../types/database';
import { formatValue, formatWage, getPositionGroup } from '../../lib/constants';
import { BallIcon, CardIcon, GloveIcon } from '../icons/FootballIcons';

interface SeasonTotalsProps {
  stats: PlayerSeasonStats;
  mvps: number;
  position: PlayerPosition;
}

export default function SeasonTotals({ stats, mvps, position }: SeasonTotalsProps) {
  // Clean sheets only mean something for the back line
  const group = getPositionGroup(position);
  const showCleanSheets = group === 'GK' || group === 'DEF';
  const ovrEnd = stats.ovr_end ?? stats.ovr_start;

  const tiles: { label: string; value: number; icon?: ReactNode; valueClass: string }[] = [
    { label: 'Partidos', value: stats.matches_played, valueClass: 'text-white' },
    { label: 'Goles', value: stats.goals, icon: <BallIcon size={13} />, valueClass: 'text-neon-300' },
    { label: 'Asist.', value: stats.assists, icon: <Footprints size={13} />, valueClass: 'text-electric-300' },
    { label: 'MVP', value: mvps, icon: <Star size={13} />, valueClass: 'text-amber-300' },
    { label: 'Amarillas', value: stats.yellow_cards, icon: <CardIcon size={13} filled />, valueClass: 'text-amber-400' },
    { label: 'Rojas', value: stats.red_cards, icon: <CardIcon size={13} filled />, valueClass: 'text-red-400' },
  ];
  if (showCleanSheets) {
    tiles.push({ label: 'Invicto', value: stats.clean_sheets, icon: <GloveIcon size={13} />, valueClass: 'text-emerald-300' });
  }

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="season-totals-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="season-totals-title" className="section-title">
          Temporada {stats.season.year_label}
        </h2>
        {stats.season.is_closed && (
          <span className="badge border-pitch-500 bg-pitch-700 text-white/60">
            <Lock size={10} /> Cerrada
          </span>
        )}
      </div>

      <dl className={clsx('mt-3 grid gap-2', showCleanSheets ? 'grid-cols-4 sm:grid-cols-7 lg:grid-cols-4' : 'grid-cols-3 sm:grid-cols-6 lg:grid-cols-3')}>
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col-reverse items-center rounded-xl bg-pitch-900/60 px-1 py-2.5 text-center">
            <dt className="mt-0.5 flex items-center gap-1 text-2xs text-white/45">
              {tile.icon && <span aria-hidden="true" className={tile.valueClass}>{tile.icon}</span>}
              {tile.label}
            </dt>
            <dd className={clsx('text-lg font-black tabular-nums', tile.value > 0 ? tile.valueClass : 'text-white/30')}>
              {tile.value}
            </dd>
          </div>
        ))}
      </dl>

      <dl className="mt-3 grid grid-cols-3 divide-x divide-pitch-700/70 rounded-xl border border-pitch-700/70 text-center">
        <SummaryStat label="Media">
          {stats.ovr_start ?? '—'}
          {stats.ovr_end != null && stats.ovr_end !== stats.ovr_start && (
            <span className="text-white/45"> → {ovrEnd}</span>
          )}
        </SummaryStat>
        <SummaryStat label="Valor">{formatValue(stats.market_value_end ?? stats.market_value_start)}</SummaryStat>
        <SummaryStat label="Salario" valueClass="text-neon-300">
          {formatWage(stats.salary)}
        </SummaryStat>
      </dl>

      {stats.notes && <p className="mt-3 rounded-xl bg-pitch-900/60 px-3 py-2.5 text-sm text-white/70">{stats.notes}</p>}
    </section>
  );
}

function SummaryStat({ label, valueClass = 'text-white', children }: { label: string; valueClass?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse px-2 py-2.5">
      <dt className="text-2xs text-white/45">{label}</dt>
      <dd className={clsx('truncate text-sm font-bold tabular-nums', valueClass)}>{children}</dd>
    </div>
  );
}
