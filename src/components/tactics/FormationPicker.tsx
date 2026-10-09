// ============================================================
// src/components/tactics/FormationPicker.tsx
// Current formation as a card with a mini pitch; tapping it
// opens a gallery of all formations grouped by the back line.
// Quick chips keep the most used ones one tap away.
// ============================================================

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { FormationScheme } from '../../types/database';
import { FORMATIONS, getFormationLabel, getPositionGroup } from '../../lib/constants';
import Sheet from '../ui/Sheet';
import { getSlots } from './lineup';

const QUICK_FORMATIONS: FormationScheme[] = ['4-3-3 Attack', '4-3-3 Holding', '4-2-3-1', '4-4-2', '3-5-2'];

const BACK_LINES = [
  { digit: '4', label: 'Defensa de cuatro' },
  { digit: '3', label: 'Defensa de tres' },
  { digit: '5', label: 'Defensa de cinco' },
];

const DOT_COLORS = {
  GK: 'fill-amber-400',
  DEF: 'fill-blue-400',
  MID: 'fill-emerald-400',
  FWD: 'fill-red-400',
};

interface FormationPickerProps {
  value: FormationScheme;
  onChange: (scheme: FormationScheme) => void;
}

export default function FormationPicker({ value, onChange }: FormationPickerProps) {
  const [open, setOpen] = useState(false);

  const pick = (scheme: FormationScheme) => {
    onChange(scheme);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center" translate="no">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Formación: ${getFormationLabel(value)}. Cambiar`}
        className="flex items-center gap-3 rounded-2xl border border-pitch-600 bg-pitch-800 p-2 pr-3 text-left transition-colors hover:border-pitch-500 lg:w-72"
      >
        <MiniPitch scheme={value} className="h-12 w-9 flex-shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-2xs font-semibold uppercase tracking-wide text-white/45">Formación</span>
          <span className="block truncate font-bold text-white">{getFormationLabel(value)}</span>
        </span>
        <ChevronDown size={18} className="flex-shrink-0 text-white/40" />
      </button>

      <div role="group" aria-label="Formaciones habituales" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
        {QUICK_FORMATIONS.map((scheme) => (
          <button key={scheme} type="button" aria-pressed={value === scheme} onClick={() => onChange(scheme)} className="chip">
            {getFormationLabel(scheme)}
          </button>
        ))}
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Elegir formación" size="xl">
        <div className="flex flex-col gap-5" translate="no">
          {BACK_LINES.map((line) => (
            <section key={line.digit} aria-label={line.label}>
              <h3 className="mb-2 text-2xs font-bold uppercase tracking-wider text-white/40">{line.label}</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {FORMATIONS.filter((f) => f.scheme.startsWith(line.digit)).map((formation) => {
                  const selected = formation.scheme === value;
                  return (
                    <button
                      key={formation.scheme}
                      type="button"
                      onClick={() => pick(formation.scheme)}
                      aria-pressed={selected}
                      className={clsx(
                        'flex flex-col items-center gap-2 rounded-2xl border p-2.5 transition-colors active:scale-[0.98]',
                        selected ? 'border-neon-400/60 bg-neon-400/10' : 'border-pitch-600 bg-pitch-800 hover:border-pitch-500'
                      )}
                    >
                      <MiniPitch scheme={formation.scheme} className="h-24 w-[4.25rem]" />
                      <span className={clsx('text-center text-xs font-bold leading-tight', selected ? 'text-neon-300' : 'text-white/80')}>
                        {formation.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

// Formation drawn as colored dots on a small pitch (attack at the top)
function MiniPitch({ scheme, className }: { scheme: FormationScheme; className?: string }) {
  return (
    <svg viewBox="0 0 68 100" aria-hidden="true" className={clsx('rounded-md bg-emerald-950', className)}>
      <g fill="none" className="stroke-white/20" strokeWidth="1">
        <rect x="2" y="2" width="64" height="96" rx="2" />
        <line x1="2" y1="50" x2="66" y2="50" />
        <circle cx="34" cy="50" r="8" />
        <rect x="18" y="82" width="32" height="16" />
        <rect x="18" y="2" width="32" height="16" />
      </g>
      {getSlots(scheme).map((slot, i) => (
        <circle
          key={i}
          cx={2 + (slot.x / 100) * 64}
          cy={2 + (slot.y / 100) * 96}
          r="4"
          className={DOT_COLORS[getPositionGroup(slot.role)]}
        />
      ))}
    </svg>
  );
}
