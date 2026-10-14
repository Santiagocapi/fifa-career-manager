// ============================================================
// src/components/match/MatchSummary.tsx
// What happened in the match at a glance: scorers, assists,
// cards and injuries, each with the players involved.
// ============================================================

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Cross, Footprints } from 'lucide-react';
import type { MatchWithSeason, Player } from '../../types/database';
import { BallIcon, CardIcon } from '../icons/FootballIcons';

interface Entry {
  player: Player;
  count: number;
}

export default function MatchSummary({ match }: { match: MatchWithSeason }) {
  const collect = (count: (e: MatchWithSeason['events'][number]) => number): Entry[] =>
    match.events
      .map((e) => ({ player: e.player, count: count(e) }))
      .filter((entry) => entry.player && entry.count > 0)
      .sort((a, b) => b.count - a.count);

  const scorers = collect((e) => e.goals);
  const assisters = collect((e) => e.assists);
  const yellows = collect((e) => (e.yellow_card ? 1 : 0));
  const reds = collect((e) => (e.red_card ? 1 : 0));
  const injured = collect((e) => (e.injured ? 1 : 0));

  // Goals nobody was credited with (own goals, or simply not filled in)
  const unassigned = match.team_score - scorers.reduce((sum, e) => sum + e.count, 0);

  const rows: { key: string; label: string; icon: ReactNode; entries: Entry[]; extra?: string }[] = [
    {
      key: 'goals',
      label: 'Goles',
      icon: <BallIcon size={16} className="text-neon-400" />,
      entries: scorers,
      extra: unassigned > 0 ? `${unassigned} sin asignar` : undefined,
    },
    { key: 'assists', label: 'Asistencias', icon: <Footprints size={16} className="text-electric-400" />, entries: assisters },
    { key: 'yellow', label: 'Amarillas', icon: <CardIcon size={16} filled className="text-amber-400" />, entries: yellows },
    { key: 'red', label: 'Rojas', icon: <CardIcon size={16} filled className="text-red-500" />, entries: reds },
    { key: 'injured', label: 'Lesiones', icon: <Cross size={16} strokeWidth={2.5} className="text-red-400" />, entries: injured },
  ].filter((row) => row.entries.length > 0 || row.extra);

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="summary-title">
      <h2 id="summary-title" className="section-title">
        Resumen
      </h2>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/40">No se anotaron goles, tarjetas ni lesiones.</p>
      ) : (
        <dl className="mt-3 flex flex-col divide-y divide-pitch-700/60">
          {rows.map((row) => (
            <div key={row.key} className="flex gap-3 py-2.5">
              <dt className="flex w-28 flex-shrink-0 items-center gap-2 self-start text-xs font-semibold text-white/55">
                <span aria-hidden="true">{row.icon}</span>
                {row.label}
              </dt>
              <dd className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1 text-sm">
                {row.entries.map(({ player, count }) => (
                  <Link key={player.id} to={`/squad/${player.id}`} className="text-white hover:underline" translate="no">
                    {player.full_name}
                    {count > 1 && <span className="ml-1 font-bold tabular-nums text-white/50">×{count}</span>}
                  </Link>
                ))}
                {row.extra && <span className="text-white/40">{row.extra}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
