// ============================================================
// src/components/tactics/SwapTray.tsx
// Phones/tablets: when a pitch player is selected, this tray
// slides up with the substitutes (best fit first), so a change
// takes two taps instead of scrolling down to the bench.
// ============================================================

import { X } from 'lucide-react';
import type { PlayerWithStats } from '../../types/database';
import PlayerAvatar from '../player/PlayerAvatar';
import PositionBadge from '../player/PositionBadge';
import OvrBadge from '../player/OvrBadge';
import { playerOvr, sortByFit } from './lineup';

interface SwapTrayProps {
  role: string;
  currentPlayer: PlayerWithStats | null;
  benchPlayers: PlayerWithStats[];
  onPick: (benchPlayerId: string) => void;
  onCancel: () => void;
}

export default function SwapTray({ role, currentPlayer, benchPlayers, onPick, onCancel }: SwapTrayProps) {
  const candidates = sortByFit(role, benchPlayers.filter((p) => !p.stats?.is_injured));

  return (
    <div
      role="region"
      aria-label={`Cambio para ${role}`}
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-2 pb-2 md:bottom-0 md:pb-4 lg:hidden"
    >
      <div className="mx-auto max-w-xl animate-sheet-up rounded-2xl border border-amber-400/40 bg-pitch-850/95 p-3 shadow-sheet backdrop-blur-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              Cambio: <span translate="no" className="text-amber-300">{role}</span>
              {currentPlayer && (
                <span translate="no" className="font-medium text-white/60">
                  {' '}
                  · sale {currentPlayer.full_name}
                </span>
              )}
            </p>
            <p className="text-xs text-white/50">Elige quién entra o toca otro jugador del campo para intercambiarlos.</p>
          </div>
          <button type="button" onClick={onCancel} className="icon-btn -mr-1 -mt-1" aria-label="Cancelar cambio">
            <X size={20} />
          </button>
        </div>

        {candidates.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/40">No hay suplentes disponibles.</p>
        ) : (
          <ul className="no-scrollbar -mx-3 mt-2.5 flex gap-2 overflow-x-auto px-3 pb-1">
            {candidates.map((player) => (
              <li key={player.id} className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onPick(player.id)}
                  className="flex w-[6.5rem] flex-col items-center gap-1.5 rounded-xl border border-pitch-600 bg-pitch-800 p-2 text-center transition-colors active:scale-95 active:border-amber-400/60"
                >
                  <PlayerAvatar name={player.full_name} size="sm" />
                  <span className="w-full truncate text-xs font-semibold text-white" translate="no">
                    {player.full_name.split(' ').pop()}
                  </span>
                  <span className="flex items-center gap-1">
                    <PositionBadge position={player.preferred_position} />
                    <OvrBadge ovr={playerOvr(player)} size="xs" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
