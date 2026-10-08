// ============================================================
// src/components/ui/Switch.tsx
// Accessible on/off switch with a large tap area.
// ============================================================

import { clsx } from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Hide the label visually (it is still read by screen readers) */
  hideLabel?: boolean;
  disabled?: boolean;
  tone?: 'neon' | 'electric' | 'red';
  className?: string;
}

const TRACK_TONES = {
  neon: 'bg-neon-400',
  electric: 'bg-electric-400',
  red: 'bg-red-500',
};

export default function Switch({
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled = false,
  tone = 'neon',
  className,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'inline-flex min-h-[2.5rem] items-center gap-2.5 rounded-xl text-sm font-medium text-white/80 disabled:opacity-40',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-150',
          checked ? TRACK_TONES[tone] : 'bg-pitch-600'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </span>
      {!hideLabel && <span>{label}</span>}
    </button>
  );
}
