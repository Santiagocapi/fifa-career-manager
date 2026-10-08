// ============================================================
// src/components/icons/FootballIcons.tsx
// Football-specific SVG icons that lucide-react does not ship
// (ball, referee cards, goalkeeper glove). Same 24x24 grid and
// stroke style as lucide so they can be mixed freely.
// ============================================================

import type { SVGProps } from 'react';

interface FootballIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

const svgDefaults = (size: number | string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

// Goals
export function BallIcon({ size = 24, ...props }: FootballIconProps) {
  return (
    <svg {...svgDefaults(size)} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m12 8.2 3.8 2.76-1.45 4.48h-4.7L8.2 10.96Z" />
      <path d="M12 8.2V2.5M15.8 10.96l5.15-1.68M14.35 15.44l3.2 4.4M9.65 15.44l-3.2 4.4M8.2 10.96 3.05 9.28" />
    </svg>
  );
}

// Yellow / red cards: outlined when off, filled with the text color when on
export function CardIcon({ size = 24, filled = false, ...props }: FootballIconProps & { filled?: boolean }) {
  return (
    <svg {...svgDefaults(size)} {...props}>
      <rect
        x="6.5"
        y="3"
        width="11"
        height="18"
        rx="2"
        transform="rotate(8 12 12)"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

// Clean sheets
export function GloveIcon({ size = 24, ...props }: FootballIconProps) {
  return (
    <svg {...svgDefaults(size)} {...props}>
      <path d="M7.5 16.5V8.25a1.25 1.25 0 0 1 2.5 0V11" />
      <path d="M10 10.5V5.75a1.25 1.25 0 0 1 2.5 0V10.5" />
      <path d="M12.5 10.5V5.25a1.25 1.25 0 0 1 2.5 0v5.25" />
      <path d="M15 10.5V7.25a1.25 1.25 0 0 1 2.5 0v9.25" />
      <path d="M7.5 14.5 5.6 12.6a1.4 1.4 0 0 0-2 2l2.4 2.4" />
      <rect x="6" y="16.5" width="13" height="5" rx="1.5" />
    </svg>
  );
}
