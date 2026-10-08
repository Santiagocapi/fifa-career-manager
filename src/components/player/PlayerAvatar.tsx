// ============================================================
// src/components/player/PlayerAvatar.tsx
// Initials on a gradient that is stable for each player name.
// ============================================================

import { clsx } from 'clsx';
import { getPlayerAvatarGradient, getPlayerInitials } from '../../lib/constants';

interface PlayerAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  xs: 'h-6 w-6 rounded-md text-[9px]',
  sm: 'h-8 w-8 rounded-lg text-[11px]',
  md: 'h-10 w-10 rounded-xl text-xs',
  lg: 'h-14 w-14 rounded-2xl text-base',
  xl: 'h-16 w-16 rounded-2xl text-lg sm:h-20 sm:w-20 sm:text-xl',
};

export default function PlayerAvatar({ name, size = 'md', className }: PlayerAvatarProps) {
  const [from, to] = getPlayerAvatarGradient(name);
  return (
    <span
      aria-hidden="true"
      translate="no"
      className={clsx(
        'inline-flex flex-shrink-0 items-center justify-center font-black text-white ring-1 ring-inset ring-white/15 [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]',
        SIZES[size],
        className
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {getPlayerInitials(name)}
    </span>
  );
}
