// ============================================================
// src/components/tactics/TeamRatings.tsx
// Starting XI averages per line plus its total market value.
// ============================================================

import { clsx } from 'clsx';
import { formatValue } from '../../lib/constants';
import type { LineRatings } from './lineup';

export default function TeamRatings({ ratings }: { ratings: LineRatings }) {
  return (
    <section className="card grid grid-cols-4 gap-2 p-3 sm:grid-cols-5 sm:gap-3 sm:p-4" aria-label="Medias del once inicial">
      <RatingTile label="Media XI" value={ratings.team} className="border-amber-400/40 bg-amber-400/10 text-amber-300" />
      <RatingTile label="Defensa" value={ratings.defense} className="text-blue-300" />
      <RatingTile label="Medio" value={ratings.midfield} className="text-emerald-300" />
      <RatingTile label="Ataque" value={ratings.attack} className="text-red-300" />
      <div className="col-span-4 flex items-center justify-between rounded-xl border border-pitch-700 bg-pitch-900/60 px-3 py-2 sm:col-span-1 sm:flex-col sm:items-start sm:justify-center">
        <span className="text-2xs font-semibold uppercase tracking-wide text-white/50">Valor del XI</span>
        <span className="text-sm font-black tabular-nums text-white sm:text-lg">{formatValue(ratings.value)}</span>
      </div>
    </section>
  );
}

function RatingTile({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={clsx('rounded-xl border border-pitch-700 bg-pitch-900/60 px-2 py-2 text-center', className)}>
      <p className="text-2xl font-black tabular-nums leading-none">{value || '–'}</p>
      <p className="mt-1 text-2xs font-semibold uppercase tracking-wide text-white/50">{label}</p>
    </div>
  );
}
