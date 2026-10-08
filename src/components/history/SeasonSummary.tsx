// ============================================================
// src/components/history/SeasonSummary.tsx
// Season balance plus the podium of its three most influential
// players (goals, assists and MVP awards).
// ============================================================

import { useMemo } from 'react';
import { Crown } from 'lucide-react';
import { clsx } from 'clsx';
import type { MatchWithDetails, PlayerWithStats, Season } from '../../types/database';
import SeasonRecord from '../matches/SeasonRecord';
import PlayerAvatar from '../player/PlayerAvatar';
import PositionBadge from '../player/PositionBadge';
import OvrBadge from '../player/OvrBadge';
import Flag from '../player/Flag';

interface SeasonSummaryProps {
  season: Season;
  players: PlayerWithStats[];
  matches: MatchWithDetails[];
  loading?: boolean;
}

interface PodiumEntry {
  player: PlayerWithStats;
  goals: number;
  assists: number;
  mvps: number;
}

const PODIUM_STYLES = [
  { label: '1.º', ring: 'border-amber-300 bg-amber-400/10', badge: 'bg-amber-400 text-pitch-950' },
  { label: '2.º', ring: 'border-slate-300/60 bg-slate-300/5', badge: 'bg-slate-300 text-pitch-950' },
  { label: '3.º', ring: 'border-amber-700/70 bg-amber-700/10', badge: 'bg-amber-700 text-white' },
];

export default function SeasonSummary({ season, players, matches, loading = false }: SeasonSummaryProps) {
  // Impact score: a goal weighs 1.5, an assist 1 and an MVP award 2
  const podium = useMemo<PodiumEntry[]>(
    () =>
      players
        .map((player) => ({
          player,
          goals: player.stats?.goals ?? 0,
          assists: player.stats?.assists ?? 0,
          mvps: matches.filter((m) => m.mvp_player_id === player.id).length,
        }))
        .filter((e) => e.goals + e.assists > 0 || e.mvps > 0)
        .sort((a, b) => b.goals * 1.5 + b.assists + b.mvps * 2 - (a.goals * 1.5 + a.assists + a.mvps * 2))
        .slice(0, 3),
    [players, matches]
  );

  // Podium order on screen: 2nd, 1st, 3rd
  const displayOrder = [1, 0, 2].filter((i) => i < podium.length);

  return (
    <div className="flex flex-col gap-5">
      <SeasonRecord matches={matches} loading={loading} title={`Balance ${season.year_label}`} />

      <section className="card p-4 sm:p-5" aria-labelledby="podium-title">
        <h2 id="podium-title" className="section-title">
          <Crown size={15} className="text-amber-400" />
          Jugadores más influyentes
        </h2>
        <p className="mt-1 text-xs text-white/45">Por goles, asistencias y premios MVP.</p>

        {podium.length === 0 ? (
          <p className="py-6 text-center text-sm text-white/40">Todavía no hay goles, asistencias ni MVP esta temporada.</p>
        ) : (
          <ol className="mt-5 grid grid-cols-3 items-end gap-2 sm:gap-4">
            {displayOrder.map((rank) => {
              const { player, goals, assists, mvps } = podium[rank];
              const style = PODIUM_STYLES[rank];
              return (
                <li
                  key={player.id}
                  className={clsx(
                    'relative flex min-w-0 flex-col items-center rounded-2xl border px-1.5 pb-3 pt-5 text-center sm:px-3',
                    style.ring,
                    rank === 0 && 'pb-5 pt-7'
                  )}
                  aria-label={`${style.label} puesto: ${player.full_name}`}
                >
                  <span className={clsx('absolute -top-3 rounded-full px-2.5 py-0.5 text-xs font-black shadow', style.badge)}>
                    {style.label}
                  </span>
                  <div className="relative">
                    <PlayerAvatar name={player.full_name} size={rank === 0 ? 'lg' : 'md'} />
                    <OvrBadge
                      ovr={player.stats?.ovr_end ?? player.stats?.ovr_start}
                      size="xs"
                      className="absolute -bottom-1.5 -right-2.5"
                    />
                  </div>
                  <p className="mt-2.5 w-full truncate text-sm font-bold text-white" translate="no">
                    {player.full_name.split(' ').pop()}
                  </p>
                  <p className="mt-1 flex items-center gap-1">
                    <PositionBadge position={player.preferred_position} />
                    <Flag nationality={player.nationality} />
                  </p>
                  <p className="mt-2 text-2xs font-semibold tabular-nums text-white/60">
                    {goals} G · {assists} A{mvps > 0 && ` · ${mvps} MVP`}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
