// ============================================================
// src/components/ui/NumberStepper.tsx
// "− value +" control with large touch targets, used for scores,
// goals and assists instead of tiny number inputs.
// ============================================================

import { Minus, Plus } from 'lucide-react';
import { clsx } from 'clsx';

type StepperTone = 'neon' | 'electric' | 'red' | 'white';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  /** Spoken name of the value, e.g. "goles" → "Sumar goles" */
  label: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'md' | 'lg';
  tone?: StepperTone;
}

const VALUE_TONES: Record<StepperTone, string> = {
  neon: 'text-neon-400',
  electric: 'text-electric-400',
  red: 'text-red-400',
  white: 'text-white',
};

const PLUS_TONES: Record<StepperTone, string> = {
  neon: 'bg-neon-400/15 text-neon-300 hover:bg-neon-400/25',
  electric: 'bg-electric-400/15 text-electric-300 hover:bg-electric-400/25',
  red: 'bg-red-400/15 text-red-300 hover:bg-red-400/25',
  white: 'bg-white/10 text-white hover:bg-white/15',
};

export default function NumberStepper({
  value,
  onChange,
  label,
  min = 0,
  max,
  disabled = false,
  size = 'md',
  tone = 'white',
}: NumberStepperProps) {
  const buttonSize = size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl';
  const iconSize = size === 'lg' ? 20 : 16;
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && (max === undefined || value < max);

  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`Restar ${label}`}
        disabled={!canDecrement}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={clsx(
          buttonSize,
          'inline-flex flex-shrink-0 items-center justify-center bg-pitch-700 text-white/70 transition-colors active:scale-95 hover:bg-pitch-600 disabled:opacity-30'
        )}
      >
        <Minus size={iconSize} strokeWidth={2.5} />
      </button>

      <output
        aria-live="polite"
        className={clsx(
          'min-w-[2ch] text-center font-black tabular-nums',
          size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-lg',
          value > 0 ? VALUE_TONES[tone] : 'text-white/40'
        )}
      >
        {value}
      </output>

      <button
        type="button"
        aria-label={`Sumar ${label}`}
        disabled={!canIncrement}
        onClick={() => onChange(value + 1)}
        className={clsx(
          buttonSize,
          'inline-flex flex-shrink-0 items-center justify-center transition-colors active:scale-95 disabled:opacity-30',
          PLUS_TONES[tone]
        )}
      >
        <Plus size={iconSize} strokeWidth={2.5} />
      </button>
    </div>
  );
}
