// ============================================================
// src/components/records/BreakdownTables.tsx
// The career split by season (with trophies and top scorer)
// and by competition. The first column stays pinned while the
// numbers scroll sideways on phones.
// ============================================================

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import type { SeasonSummaryData } from '../matches/matchStats';
import type { CompetitionRow, SeasonRow } from './careerRecords';
import { getCompetitionLabel } from '../../lib/constants';

export function SeasonsTable({ rows }: { rows: SeasonRow[] }) {
  return (
    <BreakdownTable
      caption="Balance de cada temporada"
      firstColumn="Temporada"
      extraColumns={['Trofeos', 'Máx. goleador']}
      rows={rows.map(({ season, summary, trophies, topScorer }) => ({
        key: season.id,
        label: (
          <>
            {season.year_label}
            {!season.is_closed && <span className="ml-1.5 text-2xs font-semibold text-neon-300">en curso</span>}
          </>
        ),
        summary,
        extra: [
          <span key="t" className={trophies > 0 ? 'font-bold text-amber-300' : 'text-white/30'}>
            {trophies}
          </span>,
          topScorer ? (
            <Link key="s" to={`/squad/${topScorer.player.id}`} className="whitespace-nowrap text-white hover:underline" translate="no">
              {topScorer.player.full_name} <span className="text-neon-300">({topScorer.value})</span>
            </Link>
          ) : (
            <span key="s" className="text-white/30">–</span>
          ),
        ],
      }))}
    />
  );
}

export function CompetitionsTable({ rows }: { rows: CompetitionRow[] }) {
  return (
    <BreakdownTable
      caption="Balance en cada competición"
      firstColumn="Competición"
      rows={rows.map(({ competition, summary }) => ({
        key: competition,
        label: getCompetitionLabel(competition),
        summary,
      }))}
    />
  );
}

interface BreakdownRow {
  key: string;
  label: ReactNode;
  summary: SeasonSummaryData;
  extra?: ReactNode[];
}

interface BreakdownTableProps {
  caption: string;
  firstColumn: string;
  extraColumns?: string[];
  rows: BreakdownRow[];
}

function BreakdownTable({ caption, firstColumn, extraColumns = [], rows }: BreakdownTableProps) {
  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className={clsx('w-full text-sm', extraColumns.length > 0 ? 'min-w-[640px]' : 'min-w-[440px]')}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-pitch-700 text-xs text-white/50">
              <th scope="col" className="sticky left-0 z-10 bg-pitch-800 px-3 py-2 text-left font-semibold">{firstColumn}</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold" title="Partidos jugados">PJ</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold text-neon-300" title="Victorias">V</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold text-amber-300" title="Empates">E</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold text-red-300" title="Derrotas">D</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold" title="Goles a favor y en contra">Goles</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold" title="Porcentaje de victorias">% V</th>
              {extraColumns.map((column) => (
                <th key={column} scope="col" className="px-3 py-2 text-left font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-pitch-700/60">
            {rows.map(({ key, label, summary, extra = [] }) => {
              const diff = summary.goalsFor - summary.goalsAgainst;
              return (
                <tr key={key}>
                  <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-pitch-800 px-3 py-2.5 text-left font-medium text-white">
                    {label}
                  </th>
                  <td className="px-2 py-2.5 text-center tabular-nums text-white/80">{summary.played}</td>
                  <td className="px-2 py-2.5 text-center font-bold tabular-nums text-neon-300">{summary.wins}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-amber-300">{summary.draws}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-red-300">{summary.losses}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-center tabular-nums text-white/80">
                    {summary.goalsFor}–{summary.goalsAgainst}
                    <span className={clsx('ml-1 text-xs', diff > 0 ? 'text-neon-400' : diff < 0 ? 'text-red-400' : 'text-white/40')}>
                      ({diff > 0 ? '+' : ''}
                      {diff})
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums text-white/80">{summary.played > 0 ? `${summary.winRate}%` : '–'}</td>
                  {extra.map((cell, i) => (
                    <td key={i} className="px-3 py-2.5 text-left tabular-nums">
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-pitch-800 to-transparent sm:hidden" />
    </div>
  );
}
