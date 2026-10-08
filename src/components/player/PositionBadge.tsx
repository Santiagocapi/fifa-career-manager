// ============================================================
// src/components/player/PositionBadge.tsx
// Position code (GK, CB, ST…) colored by position group.
// ============================================================

import { clsx } from 'clsx';
import { POSITION_COLORS, getPositionGroup, getPositionLabel } from '../../lib/constants';

interface PositionBadgeProps {
  position: string;
  size?: 'sm' | 'md';
  className?: string;
}

export default function PositionBadge({ position, size = 'sm', className }: PositionBadgeProps) {
  const group = getPositionGroup(position);
  return (
    <span
      translate="no"
      title={getPositionLabel(position)}
      className={clsx(POSITION_COLORS[group].badge, 'uppercase', size === 'md' && 'px-2 py-1 text-xs', className)}
    >
      {position}
    </span>
  );
}
