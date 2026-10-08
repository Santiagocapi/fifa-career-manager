// ============================================================
// src/components/player/PositionPicker.tsx
// Tap-to-pick position grid grouped by line (GK / DEF / MID / FWD).
// One tap instead of opening and scrolling a 15-option dropdown.
// ============================================================

import { useId } from 'react';
import { clsx } from 'clsx';
import { POSITIONS, POSITION_COLORS, POSITION_GROUPS, getPositionLabel } from '../../lib/constants';
import type { PlayerPosition } from '../../types/database';

interface PositionPickerProps {
  value: string | null | undefined;
  onChange: (position: PlayerPosition) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export default function PositionPicker({ value, onChange, label = 'Posición', error, required = false }: PositionPickerProps) {
  const labelId = useId();

  return (
    <div role="radiogroup" aria-labelledby={labelId} className="field">
      <span id={labelId} className="field-label">
        {label}
        {required && <span className="text-neon-400"> *</span>}
      </span>

      <div className="flex flex-col gap-2 rounded-2xl border border-pitch-600 bg-pitch-900 p-2">
        {POSITION_GROUPS.map((group) => (
          <div key={group.value} className="flex items-start gap-2">
            <span className="w-8 flex-shrink-0 pt-3 text-[10px] font-bold uppercase text-white/35">{group.short}</span>
            <div className="flex flex-wrap gap-1.5">
              {POSITIONS.filter((p) => p.group === group.value).map((position) => {
                const selected = value === position.value;
                return (
                  <button
                    key={position.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={position.label}
                    title={position.label}
                    translate="no"
                    onClick={() => onChange(position.value)}
                    className={clsx(
                      'h-10 min-w-[2.75rem] rounded-xl border px-2 text-xs font-black transition-colors active:scale-95 sm:min-w-[3.25rem]',
                      selected
                        ? clsx(POSITION_COLORS[group.value].bg, POSITION_COLORS[group.value].text, POSITION_COLORS[group.value].border)
                        : 'border-pitch-600 bg-pitch-800 text-white/60 hover:text-white'
                    )}
                  >
                    {position.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : (
        <span className="field-hint">{value ? getPositionLabel(value) : 'Elige la posición principal'}</span>
      )}
    </div>
  );
}
