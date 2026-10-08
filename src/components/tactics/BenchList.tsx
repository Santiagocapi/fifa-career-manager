// ============================================================
// src/components/tactics/BenchList.tsx
// Substitutes and reserves. Tap one after selecting a pitch
// player to swap them; on desktop they can be dragged too.
// ============================================================

import { ArrowLeftRight, Cross, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlayerWithStats } from '../../types/database';
import { getPositionGroup } from '../../lib/constants';
import PlayerAvatar from '../player/PlayerAvatar';
import PositionBadge from '../player/PositionBadge';
import OvrBadge from '../player/OvrBadge';
import Flag from '../player/Flag';
import { playerOvr } from './lineup';
import type { PitchDragData } from './PitchBoard';

interface BenchListProps {
  benchPlayers: PlayerWithStats[];
  /** Role of the selected pitch slot, if any (e.g. "ST") */
  selectedRole: string | null;
  onPick: (benchPlayerId: string) => void;
}

export default function BenchList({ benchPlayers, selectedRole, onPick }: BenchListProps) {
  const selecting = selectedRole !== null;
  const selectedGroup = selectedRole ? getPositionGroup(selectedRole) : null;

  return (
    <section className="card flex flex-col p-4" aria-labelledby="bench-title">
      <div className="flex items-start justify-between gap-3 border-b border-pitch-700 pb-3">
        <div>
          <h2 id="bench-title" className="font-bold text-white">
            Suplentes <span className="font-normal text-white/40">({benchPlayers.length})</span>
          </h2>
          <p className="mt-0.5 text-xs text-white/50">
            {selecting
              ? 'Elige quién entra en el campo.'
              : 'Toca un jugador del campo y después uno de aquí. En ordenador también puedes arrastrarlos.'}
          </p>
        </div>
        {selecting && (
          <span translate="no" className="badge flex-shrink-0 border-amber-400/40 bg-amber-400/15 text-amber-300">
            Cambio: {selectedRole}
          </span>
        )}
      </div>

      {benchPlayers.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/40">Toda la plantilla está en el once inicial.</p>
      ) : (
        <ul className="-mx-1 mt-2 flex flex-col gap-1 lg:max-h-[560px] lg:overflow-y-auto">
          {benchPlayers.map((player) => {
            const fits = selectedGroup !== null && getPositionGroup(player.preferred_position) === selectedGroup;
            const injured = player.stats?.is_injured ?? false;
            return (
              <li key={player.id}>
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'bench', playerId: player.id } satisfies PitchDragData));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className={clsx(
                    'flex items-center gap-2.5 rounded-xl border px-2 py-2 transition-colors',
                    selecting && fits
                      ? 'border-amber-400/40 bg-amber-400/5'
                      : 'border-transparent hover:bg-white/[0.03]',
                    'cursor-grab active:cursor-grabbing'
                  )}
                >
                  <GripVertical size={16} className="hidden flex-shrink-0 text-white/20 lg:block" />
                  <PlayerAvatar name={player.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white" translate="no">
                        {player.full_name}
                      </span>
                      {injured && <Cross size={12} strokeWidth={3} className="flex-shrink-0 text-red-400" aria-label="Lesionado" />}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50">
                      <PositionBadge position={player.preferred_position} />
                      <Flag nationality={player.nationality} />
                      {player.age && <span>{player.age} años</span>}
                    </p>
                  </div>
                  <OvrBadge ovr={playerOvr(player)} size="sm" />
                  {selecting && (
                    <button
                      type="button"
                      onClick={() => onPick(player.id)}
                      className="btn-primary btn-sm"
                      aria-label={`Meter a ${player.full_name}`}
                    >
                      <ArrowLeftRight size={14} /> Entra
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
