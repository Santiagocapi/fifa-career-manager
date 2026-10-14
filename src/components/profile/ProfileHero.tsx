// ============================================================
// src/components/profile/ProfileHero.tsx
// Player profile header: identity, current rating and how much
// it has moved this season, plus the edit action.
// ============================================================

import { Cross, LogOut, Pencil, TrendingDown, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { Player, SeasonStats } from '../../types/database';
import { getPositionLabel } from '../../lib/constants';
import PlayerAvatar from '../player/PlayerAvatar';
import PositionBadge from '../player/PositionBadge';
import OvrBadge from '../player/OvrBadge';
import Flag from '../player/Flag';

interface ProfileHeroProps {
  player: Player;
  /** Stats of the season shown on the profile (active one, or the last one) */
  stats: SeasonStats | null;
  onEdit?: () => void;
}

export default function ProfileHero({ player, stats, onEdit }: ProfileHeroProps) {
  const currentOvr = stats ? stats.ovr_end ?? stats.ovr_start : null;
  const growth = stats?.ovr_start != null && currentOvr != null ? currentOvr - stats.ovr_start : 0;
  const injured = player.is_active && (stats?.is_injured ?? false);

  return (
    <section className="card relative overflow-hidden p-4 sm:p-5" aria-labelledby="player-name">
      {/* Soft glow behind the avatar, tinted like the rest of the app */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-neon-400/10 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <PlayerAvatar name={player.full_name} size="xl" />

        <div className="min-w-0 flex-1">
          <h1 id="player-name" className="text-xl font-black leading-tight tracking-tight text-white sm:text-2xl" translate="no">
            {player.full_name}
          </h1>
          <p className="mt-0.5 text-sm text-white/55">{getPositionLabel(player.preferred_position)}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-white/60">
            <PositionBadge position={player.preferred_position} size="md" />
            <Flag nationality={player.nationality} size="md" />
            {player.age != null && <span>{player.age} años</span>}
            {player.joined_year != null && <span className="text-white/45">En el club desde {player.joined_year}</span>}
          </div>

          {(injured || !player.is_active) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {injured && (
                <span className="badge border-red-500/30 bg-red-500/15 text-red-300">
                  <Cross size={10} strokeWidth={3} /> Lesionado
                </span>
              )}
              {!player.is_active && (
                <span className="badge border-pitch-500 bg-pitch-700 text-white/70">
                  <LogOut size={10} strokeWidth={3} /> Ya no está en el club
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-col items-center gap-1">
          <OvrBadge ovr={currentOvr} size="lg" />
          {growth !== 0 && (
            <span
              className={clsx(
                'flex items-center gap-0.5 text-xs font-bold tabular-nums',
                growth > 0 ? 'text-neon-400' : 'text-red-400'
              )}
              title="Evolución esta temporada"
            >
              {growth > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {growth > 0 ? '+' : ''}
              {growth}
            </span>
          )}
        </div>
      </div>

      {onEdit && (
        <div className="relative mt-4 flex justify-end border-t border-pitch-700/70 pt-3">
          <button type="button" onClick={onEdit} className="btn-secondary btn-sm">
            <Pencil size={14} /> Editar jugador
          </button>
        </div>
      )}
    </section>
  );
}
