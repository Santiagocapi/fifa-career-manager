// ============================================================
// src/components/player/OvrBadge.tsx
// Player rating with the visual tier from getOvrBadgeStyle.
// ============================================================

import { clsx } from 'clsx';
import { getOvrBadgeStyle } from '../../lib/constants';

interface OvrBadgeProps {
  ovr: number | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  xs: 'h-5 min-w-[1.75rem] rounded-md px-1 text-2xs',
  sm: 'h-7 w-8 rounded-lg text-xs',
  md: 'h-9 w-10 rounded-xl text-sm',
  lg: 'h-12 w-12 rounded-2xl text-lg',
};

export default function OvrBadge({ ovr, size = 'md', className }: OvrBadgeProps) {
  if (ovr == null) {
    return (
      <span
        aria-label="Media sin definir"
        className={clsx(
          'inline-flex flex-shrink-0 items-center justify-center border border-dashed border-pitch-500 font-bold text-white/40',
          SIZES[size],
          className
        )}
      >
        ?
      </span>
    );
  }

  const tier = getOvrBadgeStyle(ovr);
  return (
    <span
      aria-label={`Media ${ovr}`}
      title={tier.label}
      className={clsx(
        'inline-flex flex-shrink-0 items-center justify-center border font-black tabular-nums',
        SIZES[size],
        tier.badgeClass,
        className
      )}
    >
      {ovr}
    </span>
  );
}
