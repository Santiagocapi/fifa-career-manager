// ============================================================
// src/components/ui/SegmentedTabs.tsx
// Pill-style tabs. Scrolls horizontally on narrow screens
// instead of wrapping onto several lines.
// ============================================================

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: LucideIcon;
  count?: number;
}

interface SegmentedTabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  /** Stretch the tabs to fill the row (good for 2–3 tabs) */
  fullWidth?: boolean;
  className?: string;
}

export default function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  fullWidth = false,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx(
        'no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-pitch-700 bg-pitch-800/80 p-1',
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={clsx(
              'inline-flex h-10 flex-shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold transition-colors duration-150',
              fullWidth && 'flex-1',
              active ? 'bg-pitch-600 text-white shadow-sm' : 'text-white/55 hover:text-white'
            )}
          >
            {Icon && <Icon size={16} className={active ? 'text-neon-400' : undefined} />}
            {item.label}
            {item.count !== undefined && (
              <span
                className={clsx(
                  'rounded-full px-1.5 py-0.5 text-2xs font-bold tabular-nums leading-none',
                  active ? 'bg-neon-400/15 text-neon-300' : 'bg-white/5 text-white/50'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
