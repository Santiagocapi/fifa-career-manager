// ============================================================
// src/components/history/SeasonRosterTable.tsx
// Squad snapshot of a season: rating, growth, goals, assists and
// value. The player column stays pinned while scrolling sideways.
// ============================================================

import { clsx } from 'clsx';
import type { PlayerWithStats } from '../../types/database';
import { formatValue, sortPlayersByPosition } from '../../lib/constants';
import PositionBadge from '../player/PositionBadge';
import OvrBadge from '../player/OvrBadge';

export default function SeasonRosterTable({ players }: { players: PlayerWithStats[] }) {
  if (players.length === 0) {
    return <p className="py-6 text-center text-sm text-white/40">No hay jugadores registrados en esta temporada.</p>;
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <caption className="sr-only">Rendimiento y evolución de la plantilla</caption>
          <thead>
            <tr className="border-b border-pitch-700 text-xs text-white/50">
              <th scope="col" className="sticky left-0 z-10 bg-pitch-800 px-3 py-2 text-left font-semibold">Jugador</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold">Media</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold" title="Diferencia entre la media inicial y la final">Evolución</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold text-neon-300">Goles</th>
              <th scope="col" className="px-2 py-2 text-center font-semibold text-electric-300">Asist.</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pitch-700/60">
            {sortPlayersByPosition(players).map((player) => {
              const ovrStart = player.stats?.ovr_start ?? null;
              const ovrEnd = player.stats?.ovr_end ?? ovrStart;
              const growth = ovrStart != null && ovrEnd != null ? ovrEnd - ovrStart : 0;
              return (
                <tr key={player.id}>
                  <th scope="row" className="sticky left-0 z-10 bg-pitch-800 px-3 py-2 text-left font-medium">
                    <span className="flex max-w-[11rem] items-center gap-2 sm:max-w-none">
                      <PositionBadge position={player.preferred_position} />
                      <span className="truncate text-white" translate="no">
                        {player.full_name}
                      </span>
                    </span>
                  </th>
                  <td className="px-2 py-2 text-center">
                    <OvrBadge ovr={ovrEnd} size="sm" />
                  </td>
                  <td
                    className={clsx(
                      'px-2 py-2 text-center font-bold tabular-nums',
                      growth > 0 ? 'text-neon-400' : growth < 0 ? 'text-red-400' : 'text-white/30'
                    )}
                  >
                    {growth > 0 ? `+${growth}` : growth < 0 ? growth : '–'}
                  </td>
                  <td className="px-2 py-2 text-center font-bold tabular-nums text-neon-300">{player.stats?.goals ?? 0}</td>
                  <td className="px-2 py-2 text-center font-bold tabular-nums text-electric-300">{player.stats?.assists ?? 0}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-white/70">
                    {formatValue(player.stats?.market_value_end ?? player.stats?.market_value_start)}
                  </td>
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
