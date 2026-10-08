// ============================================================
// src/components/ui/ClubCrest.tsx
// Shield-shaped badge with the club initial.
// ============================================================

import { clsx } from 'clsx';

interface ClubCrestProps {
  name: string;
  size?: number;
  className?: string;
}

export default function ClubCrest({ name, size = 36, className }: ClubCrestProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <svg
      width={size}
      height={size * 1.1}
      viewBox="0 0 40 44"
      aria-hidden="true"
      className={clsx('flex-shrink-0', className)}
    >
      <path
        d="M20 2 37 8v13.5C37 32 29.6 38.8 20 42 10.4 38.8 3 32 3 21.5V8L20 2Z"
        className="fill-neon-400/10 stroke-neon-400/60"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text x="20" y="27.5" textAnchor="middle" className="fill-neon-300 font-black" style={{ fontSize: 17 }}>
        {initial}
      </text>
    </svg>
  );
}
