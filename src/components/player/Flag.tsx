// ============================================================
// src/components/player/Flag.tsx
// Country flag image (flagcdn) for a nationality string such as
// "Argentina", "ARG" or "AR". Renders nothing when unknown.
// ============================================================

import { clsx } from 'clsx';
import { getCountryCode } from '../../lib/constants';

interface FlagProps {
  nationality: string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

export default function Flag({ nationality, size = 'sm', className }: FlagProps) {
  const code = getCountryCode(nationality);
  if (!code) return null;

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={nationality ?? ''}
      title={nationality ?? undefined}
      width={size === 'md' ? 20 : 16}
      height={size === 'md' ? 15 : 12}
      loading="lazy"
      decoding="async"
      className={clsx(
        'inline-block flex-shrink-0 rounded-[3px] object-cover ring-1 ring-white/10',
        size === 'md' ? 'h-[15px] w-5' : 'h-3 w-4',
        className
      )}
    />
  );
}
