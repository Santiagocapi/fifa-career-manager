// ============================================================
// src/components/profile/SeasonHistoryTable.tsx
// One row per season the player spent at the club, plus career
// totals. The season column stays pinned while scrolling.
// ============================================================

import { clsx } from 'clsx';
import type { PlayerSeasonStats } from '../../types/database';
import { formatValue } from '../../lib/constants';
import OvrBadge from '../player/OvrBadge';

interface SeasonHistoryTableProps {
  seasons: PlayerSeasonStats[];
  /** MVP awards per season id */
  mvpsBySeason: Record<string, number>;
}

export default function SeasonHistoryTable({ seasons, mvpsBySeason }: SeasonHistoryTableProps) {
  if (seasons.length === 0) {
    return <p className="py-6 text-center text-sm text-white/40">Este jugador no tiene temporadas registradas.</p>;
  }

  const first = seasons[0];
  const last = seasons[seasons.length - 1];
  const totals = {
    matches: seasons.reduce((sum, row) => sum + row.matches_played, 0),
    goals: seasons.reduce((sum, row) => sum + row.goals, 0),
    assists: seasons.reduce((sum, row) => sum + row.assists, 0),
    mvps: seasons.reduce((sum, row) => sum + (mvpsBySeason[row.season_id] ?? 0), 0),
  };
  const careerOvrStart = first.ovr_start;
  const careerOvrEnd = last.ovr_end ?? last.ovr_start;

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">Rendimiento del jugador en cada temporada</caption>
          <thead>
            <tr className="border-b border-pitch-700 text-xs text-white/50">
              <th scope="col" className="sticky left-0 z-10 bg-pitch-800 px-3 py-2 text-left font-semibold">Temporada</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold">Media</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold" title="Diferencia entre la media inicial y la final">Evol.</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold" title="Partidos jugados">PJ</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold text-neon-300">Goles</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold text-electric-300">Asist.</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold text-amber-300">MVP</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pitch-700/60">
            {seasons.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="sticky left-0 z-10 bg-pitch-800 px-3 py-2 text-left font-medium text-white">
                  {row.season.year_label}
                  {!row.season.is_closed && <span className="ml-1.5 text-2xs font-semibold text-neon-300">en curso</span>}
                </th>
                <td className="px-2 py-2 text-center">
                  <OvrBadge ovr={row.ovr_end ?? row.ovr_start} size="sm" />
                </td>
                <GrowthCell from={row.ovr_start} to={row.ovr_end ?? row.ovr_start} />
                <td className="px-2 py-2 text-center tabular-nums text-white/80">{row.matches_played}</td>
                <td className="px-2 py-2 text-center font-bold tabular-nums text-neon-300">{row.goals}</td>
                <td className="px-2 py-2 text-center font-bold tabular-nums text-electric-300">{row.assists}</td>
                <td className="px-2 py-2 text-center font-bold tabular-nums text-amber-300">{mvpsBySeason[row.season_id] ?? 0}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-white/70">
                  {formatValue(row.market_value_end ?? row.market_value_start)}
                </td>
              </tr>
            ))}
          </tbody>
          {seasons.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-pitch-600 font-bold">
                <th scope="row" className="sticky left-0 z-10 bg-pitch-800 px-3 py-2 text-left text-white">Carrera</th>
                <td className="px-2 py-2 text-center">
                  <OvrBadge ovr={careerOvrEnd} size="sm" />
                </td>
                <GrowthCell from={careerOvrStart} to={careerOvrEnd} />
                <td className="px-2 py-2 text-center tabular-nums text-white">{totals.matches}</td>
                <td className="px-2 py-2 text-center tabular-nums text-neon-300">{totals.goals}</td>
                <td className="px-2 py-2 text-center tabular-nums text-electric-300">{totals.assists}</td>
                <td className="px-2 py-2 text-center tabular-nums text-amber-300">{totals.mvps}</td>
                <td className="px-3 py-2" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-pitch-800 to-transparent sm:hidden" />
    </div>
  );
}

function GrowthCell({ from, to }: { from: number | null; to: number | null }) {
  const growth = from != null && to != null ? to - from : 0;
  return (
    <td
      className={clsx(
        'px-2 py-2 text-center font-bold tabular-nums',
        growth > 0 ? 'text-neon-400' : growth < 0 ? 'text-red-400' : 'text-white/30'
      )}
    >
      {growth > 0 ? `+${growth}` : growth < 0 ? growth : '–'}
    </td>
  );
}
