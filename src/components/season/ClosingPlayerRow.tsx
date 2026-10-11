// ============================================================
// src/components/season/ClosingPlayerRow.tsx
// One player in the close-season assistant. The final OVR is
// always at hand (most players change it) and turns green or red
// against the starting OVR; tap the name to set the final market
// value or mark that the player leaves.
// ============================================================

import { ChevronDown, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlayerWithStats } from '../../types/database';
import { formatValue } from '../../lib/constants';
import NumberStepper from '../ui/NumberStepper';
import Switch from '../ui/Switch';
import Field from '../ui/Field';
import PositionBadge from '../player/PositionBadge';
import { parseMillions, startOvr, type ClosingDraft } from './closingDrafts';

interface ClosingPlayerRowProps {
  player: PlayerWithStats;
  draft: ClosingDraft;
  expanded: boolean;
  invalid: boolean;
  onToggleExpanded: () => void;
  onChange: (patch: Partial<ClosingDraft>) => void;
}

export default function ClosingPlayerRow({
  player,
  draft,
  expanded,
  invalid,
  onToggleExpanded,
  onChange,
}: ClosingPlayerRowProps) {
  const panelId = `closing-player-${player.id}`;
  const start = startOvr(player);
  const delta = start === null ? 0 : draft.ovr - start;
  const cents = parseMillions(draft.value);

  return (
    <li
      className={clsx(
        'rounded-2xl border transition-colors',
        invalid
          ? 'border-red-500/50 bg-pitch-800'
          : draft.leaves
            ? 'border-red-500/20 bg-red-500/[0.04]'
            : 'border-pitch-700 bg-pitch-800'
      )}
    >
      <div className="flex items-center gap-2 py-1.5 pl-3 pr-2">
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex min-h-[2.75rem] min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <PositionBadge position={player.preferred_position} />
          <span className="min-w-0 flex-1">
            <span
              className={clsx('block truncate font-semibold', draft.leaves ? 'text-white/55' : 'text-white')}
              translate="no"
            >
              {player.full_name}
            </span>
            {draft.leaves ? (
              <span className="flex items-center gap-1 text-2xs font-semibold text-red-300">
                <LogOut size={10} strokeWidth={3} /> Deja el club
              </span>
            ) : (
              <span className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-2xs text-white/50">
                <span>Inicio {start ?? '—'}</span>
                <span aria-hidden="true">·</span>
                <span className={clsx('tabular-nums', invalid && 'font-semibold text-red-300')}>
                  {invalid ? 'Valor no válido' : formatValue(cents)}
                </span>
              </span>
            )}
          </span>
          <ChevronDown
            size={16}
            className={clsx('flex-shrink-0 text-white/35 transition-transform', expanded && 'rotate-180')}
          />
        </button>

        <NumberStepper
          value={draft.ovr}
          onChange={(ovr) => onChange({ ovr })}
          label={`media final de ${player.full_name}`}
          min={1}
          max={99}
          // Green when the player improved over the season, red when they dropped
          tone={delta > 0 ? 'neon' : delta < 0 ? 'red' : 'white'}
        />
      </div>

      {expanded && (
        <div id={panelId} className="grid gap-3 border-t border-pitch-700 p-3 sm:grid-cols-2 sm:items-start">
          <Field
            label="Valor final (millones de $)"
            error={invalid ? 'Escribe un número, por ejemplo 15,5' : undefined}
            hint={cents != null ? `= ${formatValue(cents)}` : 'Vacío: se mantiene el valor inicial'}
          >
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="15,5"
              value={draft.value}
              aria-invalid={invalid || undefined}
              onChange={(event) => onChange({ value: event.target.value })}
            />
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-pitch-600 bg-pitch-900 px-3.5 py-2 sm:mt-[1.625rem]">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Deja el club</p>
              <p className="text-2xs text-white/45">Venta, fin de contrato o fin de cesión</p>
            </div>
            <Switch
              checked={draft.leaves}
              onChange={(leaves) => onChange({ leaves })}
              label={`${player.full_name} deja el club`}
              hideLabel
              tone="red"
            />
          </div>
        </div>
      )}
    </li>
  );
}
