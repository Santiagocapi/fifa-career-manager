// ============================================================
// src/components/matches/H2HTable.tsx
// Head-to-head record against every rival of the season.
// ============================================================

import { clsx } from 'clsx';
import type { H2HRecord } from '../../types/database';

export default function H2HTable({ records }: { records: H2HRecord[] }) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Historial contra cada rival</caption>
      <thead>
        <tr className="border-b border-pitch-700 text-xs text-white/50">
          <th scope="col" className="py-2 pl-1 text-left font-semibold">Rival</th>
          <th scope="col" className="px-1 py-2 text-center font-semibold" title="Partidos jugados">PJ</th>
          <th scope="col" className="px-1 py-2 text-center font-semibold text-neon-300" title="Victorias">V</th>
          <th scope="col" className="px-1 py-2 text-center font-semibold text-amber-300" title="Empates">E</th>
          <th scope="col" className="px-1 py-2 text-center font-semibold text-red-300" title="Derrotas">D</th>
          <th scope="col" className="py-2 pr-1 text-right font-semibold" title="Goles a favor y en contra">Goles</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-pitch-700/60">
        {records.map((record) => {
          const diff = record.goalsFor - record.goalsAgainst;
          return (
            <tr key={record.opponent}>
              <th scope="row" className="max-w-[9rem] truncate py-2.5 pl-1 text-left font-semibold text-white sm:max-w-none">
                {record.opponent}
              </th>
              <td className="px-1 py-2.5 text-center tabular-nums text-white/70">{record.matchesPlayed}</td>
              <td className="px-1 py-2.5 text-center font-bold tabular-nums text-neon-300">{record.wins}</td>
              <td className="px-1 py-2.5 text-center tabular-nums text-amber-300">{record.draws}</td>
              <td className="px-1 py-2.5 text-center tabular-nums text-red-300">{record.losses}</td>
              <td className="whitespace-nowrap py-2.5 pr-1 text-right tabular-nums text-white/80">
                {record.goalsFor}–{record.goalsAgainst}
                <span className={clsx('ml-1 text-xs', diff > 0 ? 'text-neon-400' : diff < 0 ? 'text-red-400' : 'text-white/40')}>
                  ({diff > 0 ? '+' : ''}
                  {diff})
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
