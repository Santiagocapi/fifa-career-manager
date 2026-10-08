// ============================================================
// src/components/ui/EmptyState.tsx
// Friendly placeholder for empty lists, with an optional action.
// ============================================================

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, compact = false, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3 text-center',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-pitch-600 bg-pitch-700/60 text-white/40">
        <Icon size={26} />
      </div>
      <div>
        <p className="font-semibold text-white">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">{description}</p>}
      </div>
      {action}
    </div>
  );
}
