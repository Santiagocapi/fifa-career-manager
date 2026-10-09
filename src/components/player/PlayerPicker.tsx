// ============================================================
// src/components/player/PlayerPicker.tsx
// Field-like button that opens a sheet to pick a player (MVP,
// substitute, award winner…). Replaces native selects, whose
// option lists can't be styled and are hard to scan on desktop.
// ============================================================

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, UserRoundX } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlayerWithStats } from '../../types/database';
import Sheet from '../ui/Sheet';
import PlayerAvatar from './PlayerAvatar';
import PositionBadge from './PositionBadge';
import OvrBadge from './OvrBadge';

export interface PlayerPickerGroup {
  label?: string;
  players: PlayerWithStats[];
}

interface PlayerPickerProps {
  /** Sheet title and accessible name of the trigger */
  label: string;
  value: string;
  onChange: (playerId: string) => void;
  groups: PlayerPickerGroup[];
  /** Text for the "nobody" option (value '') */
  emptyLabel: string;
  disabled?: boolean;
  className?: string;
}

const SEARCH_THRESHOLD = 8;

export default function PlayerPicker({
  label,
  value,
  onChange,
  groups,
  emptyLabel,
  disabled = false,
  className,
}: PlayerPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const allPlayers = useMemo(() => groups.flatMap((g) => g.players), [groups]);
  const selected = allPlayers.find((p) => p.id === value) ?? null;

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, players: g.players.filter((p) => p.full_name.toLowerCase().includes(q)) }))
      .filter((g) => g.players.length > 0);
  }, [groups, query]);

  const pick = (playerId: string) => {
    onChange(playerId);
    setOpen(false);
  };

  const openSheet = () => {
    setQuery('');
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-label={`${label}: ${selected ? selected.full_name : emptyLabel}`}
        className={clsx(
          'flex min-h-[2.75rem] w-full min-w-0 items-center gap-2.5 rounded-xl border border-pitch-600 bg-pitch-900 px-3 py-1.5 text-left transition-colors hover:border-pitch-500 disabled:opacity-50',
          className
        )}
      >
        {selected ? (
          <>
            <PlayerAvatar name={selected.full_name} size="xs" />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white" translate="no">
              {selected.full_name}
            </span>
            <PositionBadge position={selected.preferred_position} />
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm text-white/50">{emptyLabel}</span>
        )}
        <ChevronDown size={16} className="flex-shrink-0 text-white/40" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={label} size="sm">
        <div className="flex flex-col gap-3">
          {allPlayers.length > SEARCH_THRESHOLD && (
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                data-autofocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar jugador"
                aria-label="Buscar jugador"
                className="pl-11"
              />
            </div>
          )}

          {!query && (
            <OptionRow selected={value === ''} onClick={() => pick('')}>
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-pitch-700 text-white/50">
                <UserRoundX size={14} />
              </span>
              <span className="flex-1 text-sm font-semibold text-white/70">{emptyLabel}</span>
            </OptionRow>
          )}

          {filteredGroups.map((group, index) => (
            <div key={group.label ?? index} role="group" aria-label={group.label}>
              {group.label && (
                <p className="mb-1.5 px-1 text-2xs font-bold uppercase tracking-wider text-white/40">{group.label}</p>
              )}
              <ul className="flex flex-col gap-1">
                {group.players.map((player) => (
                  <li key={player.id}>
                    <OptionRow selected={player.id === value} onClick={() => pick(player.id)}>
                      <PlayerAvatar name={player.full_name} size="xs" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white" translate="no">
                        {player.full_name}
                      </span>
                      <PositionBadge position={player.preferred_position} />
                      <OvrBadge ovr={player.stats?.ovr_end ?? player.stats?.ovr_start} size="xs" />
                    </OptionRow>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {query && filteredGroups.length === 0 && (
            <p className="py-6 text-center text-sm text-white/40">Ningún jugador coincide.</p>
          )}
        </div>
      </Sheet>
    </>
  );
}

function OptionRow({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        'flex min-h-[2.75rem] w-full items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-left transition-colors',
        selected ? 'border-neon-400/50 bg-neon-400/10' : 'border-transparent hover:bg-white/5'
      )}
    >
      {children}
      <Check size={16} className={clsx('flex-shrink-0', selected ? 'text-neon-400' : 'invisible')} />
    </button>
  );
}
