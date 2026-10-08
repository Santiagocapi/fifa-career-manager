// ============================================================
// src/components/dashboard/LeadersCard.tsx
// Season leaders: top scorer, top assister, most MVP awards and
// the longest-serving player.
// ============================================================

import { useMemo, type ReactNode } from 'react';
import { Footprints, ShieldHalf, Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { MatchWithDetails, PlayerWithStats } from '../../types/database';
import { BallIcon } from '../icons/FootballIcons';
import PlayerAvatar from '../player/PlayerAvatar';
import { rankMvps } from '../matches/matchStats';

interface LeadersCardProps {
  players: PlayerWithStats[];
  matches: MatchWithDetails[];
  loading?: boolean;
}

export default function LeadersCard({ players, matches, loading = false }: LeadersCardProps) {
  const leaders = useMemo(() => {
    const byStat = (key: 'goals' | 'assists') =>
      [...players]
        .filter((p) => (p.stats?.[key] ?? 0) > 0)
        .sort((a, b) => (b.stats?.[key] ?? 0) - (a.stats?.[key] ?? 0))[0];

    const veteran = [...players]
      .filter((p) => p.joined_year != null)
      .sort((a, b) => (a.joined_year ?? 9999) - (b.joined_year ?? 9999))[0];

    return {
      scorer: byStat('goals'),
      assister: byStat('assists'),
      mvp: rankMvps(matches, players)[0],
      veteran,
    };
  }, [players, matches]);

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="leaders-title">
      <h2 id="leaders-title" className="section-title">
        Líderes de la temporada
      </h2>

      {loading ? (
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-pitch-700/70">
          <LeaderRow
            icon={<BallIcon size={18} />}
            iconClass="bg-neon-400/10 text-neon-400"
            label="Máximo goleador"
            player={leaders.scorer}
            value={leaders.scorer ? `${leaders.scorer.stats?.goals} goles` : undefined}
            empty="Todavía no hay goles"
          />
          <LeaderRow
            icon={<Footprints size={18} />}
            iconClass="bg-electric-400/10 text-electric-400"
            label="Máximo asistidor"
            player={leaders.assister}
            value={leaders.assister ? `${leaders.assister.stats?.assists} asist.` : undefined}
            empty="Todavía no hay asistencias"
          />
          <LeaderRow
            icon={<Star size={18} />}
            iconClass="bg-amber-400/10 text-amber-400"
            label="Más veces MVP"
            player={leaders.mvp?.player}
            value={leaders.mvp ? `${leaders.mvp.count} MVP` : undefined}
            empty="Ningún MVP elegido"
          />
          <LeaderRow
            icon={<ShieldHalf size={18} />}
            iconClass="bg-purple-400/10 text-purple-300"
            label="Veterano del club"
            player={leaders.veteran}
            value={leaders.veteran ? `desde ${leaders.veteran.joined_year}` : undefined}
            empty="Sin datos de llegada"
          />
        </ul>
      )}
    </section>
  );
}

interface LeaderRowProps {
  icon: ReactNode;
  iconClass: string;
  label: string;
  player?: PlayerWithStats;
  value?: string;
  empty: string;
}

function LeaderRow({ icon, iconClass, label, player, value, empty }: LeaderRowProps) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className={clsx('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', iconClass)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-semibold uppercase tracking-wide text-white/45">{label}</p>
        {player ? (
          <p className="flex min-w-0 items-center gap-2">
            <PlayerAvatar name={player.full_name} size="xs" />
            <span className="truncate text-sm font-semibold text-white" translate="no">
              {player.full_name}
            </span>
          </p>
        ) : (
          <p className="text-sm text-white/40">{empty}</p>
        )}
      </div>
      {value && <span className="flex-shrink-0 text-sm font-bold tabular-nums text-white/80">{value}</span>}
    </li>
  );
}
