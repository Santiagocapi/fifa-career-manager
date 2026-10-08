// ============================================================
// src/components/matches/SeasonRecord.tsx
// Season balance at a glance: wins / draws / losses, goals and
// the form guide. Used on Inicio and Partidos.
// ============================================================

import { useMemo } from 'react';
import { clsx } from 'clsx';
import type { MatchWithDetails } from '../../types/database';
import { summarizeMatches } from './matchStats';
import { FormGuide } from './ResultBadge';

interface SeasonRecordProps {
  matches: MatchWithDetails[];
  loading?: boolean;
  title?: string;
  className?: string;
}

export default function SeasonRecord({ matches, loading = false, title = 'Balance de la temporada', className }: SeasonRecordProps) {
  const summary = useMemo(() => summarizeMatches(matches), [matches]);
  const goalDiff = summary.goalsFor - summary.goalsAgainst;

  if (loading) return <div className={clsx('skeleton h-[188px] rounded-2xl', className)} />;

  return (
    <section className={clsx('card p-4 sm:p-5', className)} aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">{title}</h2>
        <span className="text-xs font-semibold text-white/50">
          {summary.played} {summary.played === 1 ? 'partido' : 'partidos'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <RecordTile value={summary.wins} label="Victorias" className="text-neon-300" />
        <RecordTile value={summary.draws} label="Empates" className="text-amber-300" />
        <RecordTile value={summary.losses} label="Derrotas" className="text-red-300" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-white/50">Goles</dt>
          <dd className="font-bold tabular-nums text-white">
            {summary.goalsFor} <span className="font-normal text-white/40">–</span> {summary.goalsAgainst}
            <span className={clsx('ml-1.5 text-xs font-semibold', goalDiff > 0 ? 'text-neon-400' : goalDiff < 0 ? 'text-red-400' : 'text-white/40')}>
              ({goalDiff > 0 ? '+' : ''}{goalDiff})
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-white/50">% victorias</dt>
          <dd className="font-bold tabular-nums text-white">{summary.winRate}%</dd>
        </div>
        <div>
          <dt className="text-xs text-white/50">Vallas invictas</dt>
          <dd className="font-bold tabular-nums text-white">{summary.cleanSheets}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/50">Racha</dt>
          <dd className="mt-0.5">
            <FormGuide form={summary.form} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

function RecordTile({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className="rounded-xl border border-pitch-700 bg-pitch-900/60 px-3 py-2.5 text-center">
      <p className={clsx('text-3xl font-black tabular-nums leading-none', className)}>{value}</p>
      <p className="mt-1.5 text-2xs font-semibold uppercase tracking-wide text-white/50">{label}</p>
    </div>
  );
}
