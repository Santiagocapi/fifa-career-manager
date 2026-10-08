// ============================================================
// src/components/tactics/PitchBoard.tsx
// Tactical pitch with the starting XI. Tap a player, then tap
// another one (or a substitute) to swap them; on desktop players
// can also be dragged. Tokens are sized so that even 5-at-the-back
// formations fit on a 360px wide phone without overlapping.
// ============================================================

import { useState } from 'react';
import { Cross, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import type { FormationScheme, PlayerWithStats } from '../../types/database';
import { getPlayerAvatarGradient, getPlayerInitials, getPositionGroup, POSITION_COLORS } from '../../lib/constants';
import OvrBadge from '../player/OvrBadge';
import { getSlots, playerOvr } from './lineup';

export type PitchDragData = { type: 'pitch'; index: number } | { type: 'bench'; playerId: string };

interface PitchBoardProps {
  scheme: FormationScheme;
  startingXI: (PlayerWithStats | null)[];
  selectedSlotIndex: number | null;
  onSelectSlot: (index: number | null) => void;
  onSwapSlots: (indexA: number, indexB: number) => void;
  onDropBenchPlayer: (pitchSlotIndex: number, benchPlayerId: string) => void;
}

const parseDragData = (raw: string): PitchDragData | null => {
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || !('type' in data)) return null;
    return data as PitchDragData;
  } catch {
    return null;
  }
};

export default function PitchBoard({
  scheme,
  startingXI,
  selectedSlotIndex,
  onSelectSlot,
  onSwapSlots,
  onDropBenchPlayer,
}: PitchBoardProps) {
  const slots = getSlots(scheme);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleSlotTap = (index: number) => {
    if (selectedSlotIndex === null) onSelectSlot(index);
    else if (selectedSlotIndex === index) onSelectSlot(null);
    else {
      onSwapSlots(selectedSlotIndex, index);
      onSelectSlot(null);
    }
  };

  const handleDrop = (event: React.DragEvent, targetIndex: number) => {
    event.preventDefault();
    setDragOverIndex(null);
    setDraggedIndex(null);
    const data = parseDragData(event.dataTransfer.getData('text/plain'));
    if (data?.type === 'pitch' && data.index !== targetIndex) onSwapSlots(data.index, targetIndex);
    if (data?.type === 'bench') onDropBenchPlayer(targetIndex, data.playerId);
  };

  return (
    <div className="relative mx-auto aspect-[7/10] w-full max-w-[560px] overflow-hidden rounded-3xl border border-emerald-400/25 bg-emerald-950 shadow-card sm:aspect-[4/5]">
      {/* Mowing stripes */}
      <div aria-hidden="true" className="absolute inset-0 flex flex-col">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={clsx('flex-1', i % 2 === 0 ? 'bg-white/[0.035]' : 'bg-transparent')} />
        ))}
      </div>

      {/* Field markings */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full stroke-white/25"
        fill="none"
        strokeWidth="1.5"
        viewBox="0 0 300 440"
        preserveAspectRatio="none"
      >
        <rect x="10" y="10" width="280" height="420" rx="6" />
        <line x1="10" y1="220" x2="290" y2="220" />
        <circle cx="150" cy="220" r="36" />
        <rect x="70" y="10" width="160" height="66" />
        <rect x="108" y="10" width="84" height="26" />
        <rect x="70" y="364" width="160" height="66" />
        <rect x="108" y="404" width="84" height="26" />
      </svg>

      {/* Starting XI */}
      {slots.map((slot, index) => {
        const player = startingXI[index];
        const isSelected = selectedSlotIndex === index;
        const isDragOver = dragOverIndex === index;
        const group = getPositionGroup(slot.role);
        const [from, to] = player ? getPlayerAvatarGradient(player.full_name) : ['', ''];
        const lastName = player ? player.full_name.trim().split(' ').pop() : null;

        return (
          <div
            key={index}
            className={clsx('absolute -translate-x-1/2 -translate-y-1/2', isSelected || isDragOver ? 'z-20' : 'z-10')}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <button
              type="button"
              draggable
              onDragStart={(e) => {
                setDraggedIndex(index);
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'pitch', index } satisfies PitchDragData));
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => setDraggedIndex(null)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverIndex !== index) setDragOverIndex(index);
              }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => handleSlotTap(index)}
              aria-pressed={isSelected}
              aria-label={
                player
                  ? `${slot.role}: ${player.full_name}, media ${playerOvr(player)}${player.stats?.is_injured ? ', lesionado' : ''}`
                  : `${slot.role}: posición vacía`
              }
              className={clsx(
                'flex w-14 select-none flex-col items-center transition-transform duration-150 sm:w-[84px]',
                isSelected || isDragOver ? 'scale-110' : 'active:scale-95',
                draggedIndex === index && 'opacity-40'
              )}
            >
              <span className="relative">
                <span
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 text-[11px] font-black text-white shadow-lg [text-shadow:0_1px_2px_rgb(0_0_0/0.4)] sm:h-14 sm:w-14 sm:text-sm',
                    isSelected || isDragOver
                      ? 'border-amber-300 ring-4 ring-amber-400/40'
                      : player?.stats?.is_injured
                        ? 'border-red-400'
                        : 'border-white/70',
                    !player && 'border-dashed border-white/40 bg-pitch-900/60'
                  )}
                  style={player ? { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` } : undefined}
                  translate="no"
                >
                  {player ? getPlayerInitials(player.full_name) : <Plus size={16} className="text-white/60" />}
                </span>

                {player && (
                  <OvrBadge ovr={playerOvr(player)} size="xs" className="absolute -right-3 -top-1.5 shadow-md" />
                )}
                {player?.stats?.is_injured && (
                  <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow">
                    <Cross size={9} strokeWidth={3} />
                  </span>
                )}
                <span
                  translate="no"
                  className={clsx(
                    POSITION_COLORS[group].badge,
                    'absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pitch-950/90 px-1 py-px text-[9px] sm:text-[10px]'
                  )}
                >
                  {slot.role}
                </span>
              </span>

              <span
                translate="no"
                className="mt-2.5 max-w-full truncate rounded-md bg-pitch-950/75 px-1.5 py-0.5 text-[10px] font-bold leading-tight text-white sm:text-xs"
              >
                {lastName ?? 'Vacío'}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
