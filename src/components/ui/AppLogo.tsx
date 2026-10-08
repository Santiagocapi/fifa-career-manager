// ============================================================
// src/components/ui/AppLogo.tsx
// App mark: neon shield with a ball patch (same as favicon.svg).
// ============================================================

import { useId } from 'react';

export default function AppLogo({ size = 32, className }: { size?: number; className?: string }) {
  // useId returns ":r0:"-style ids; colons are not safe inside url(#…)
  const gradientId = `logo-${useId().replace(/:/g, '')}`;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--color-neon)" />
          <stop offset="1" stopColor="var(--color-electric)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" className="fill-pitch-800" />
      <path
        d="M32 10 49 16v14.6C49 41.6 41.7 49.6 32 54 22.3 49.6 15 41.6 15 30.6V16l17-6Z"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="m32 23.5 6 4.35-2.3 7.05h-7.4L26 27.85l6-4.35Z" fill={`url(#${gradientId})`} />
    </svg>
  );
}
