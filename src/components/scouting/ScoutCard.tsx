// ============================================================
// src/components/scouting/ScoutCard.tsx
// Scouted player card. Actions are always visible (no hover):
// sign to the squad, move to another list, remove.
// ============================================================

import { Building2, NotebookPen, Trash2, UserPlus } from 'lucide-react';
import type { ScoutingEntry, ScoutingListType } from '../../types/database';
import { SCOUTING_LIST_TYPES, formatValue } from '../../lib/constants';
import PlayerAvatar from '../player/PlayerAvatar';
import PositionBadge from '../player/PositionBadge';
import OvrBadge from '../player/OvrBadge';
import Flag from '../player/Flag';

interface ScoutCardProps {
  entry: ScoutingEntry;
  onMove: (id: string, newListType: ScoutingListType) => void;
  onDelete: (entry: ScoutingEntry) => void;
  /** Omitted when signing is not possible (e.g. no active season) */
  onSignPlayer?: (entry: ScoutingEntry) => void;
}

export default function ScoutCard({ entry, onMove, onDelete, onSignPlayer }: ScoutCardProps) {
  // Players on the sell list are already in the squad
  const signPlayer = entry.list_type !== 'sell' ? onSignPlayer : undefined;

  return (
    <article className="card flex flex-col gap-3 p-3.5">
      <div className="flex items-start gap-3">
        <PlayerAvatar name={entry.full_name} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-white" translate="no">
            {entry.full_name}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
            {entry.position && <PositionBadge position={entry.position} />}
            <Flag nationality={entry.nationality} />
            {entry.current_club ? (
              <span className="flex min-w-0 items-center gap-1">
                <Building2 size={12} className="flex-shrink-0" />
                <span className="truncate">{entry.current_club}</span>
              </span>
            ) : (
              <span className="text-white/40">Sin club</span>
            )}
          </p>
        </div>
        <OvrBadge ovr={entry.current_ovr} />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-pitch-900/60 px-3 py-2 text-xs">
        <span className="text-white/50">Valor estimado</span>
        <span className="font-bold tabular-nums text-emerald-300">
          {entry.estimated_value ? formatValue(entry.estimated_value) : 'Sin dato'}
        </span>
      </div>

      {entry.notes && (
        <p className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/70">
          <NotebookPen size={14} className="mt-px flex-shrink-0 text-amber-300/80" />
          <span className="line-clamp-3">{entry.notes}</span>
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 border-t border-pitch-700 pt-3">
        {signPlayer && (
          <button type="button" onClick={() => signPlayer(entry)} className="btn-primary btn-sm h-10 flex-1">
            <UserPlus size={16} /> Fichar
          </button>
        )}
        <select
          value=""
          onChange={(e) => e.target.value && onMove(entry.id, e.target.value as ScoutingListType)}
          aria-label={`Mover a ${entry.full_name} a otra lista`}
          className="min-h-[2.5rem] min-w-0 flex-1 py-1 text-sm"
        >
          <option value="" disabled>
            Mover a…
          </option>
          {SCOUTING_LIST_TYPES.filter((t) => t.value !== entry.list_type).map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onDelete(entry)}
          aria-label={`Quitar a ${entry.full_name} del seguimiento`}
          className="icon-btn text-white/35 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </article>
  );
}
