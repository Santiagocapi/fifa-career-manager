// ============================================================
// src/components/ui/PageHeader.tsx
// Page title + actions. The primary action becomes a floating
// button on phones so it stays within thumb reach.
// ============================================================

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface PageAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Secondary actions, always rendered inline */
  actions?: ReactNode;
  primaryAction?: PageAction;
}

export default function PageHeader({ title, subtitle, actions, primaryAction }: PageHeaderProps) {
  const ActionIcon = primaryAction?.icon;

  return (
    <>
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-white/55">{subtitle}</div>}
        </div>

        {(actions || primaryAction) && (
          <div className="flex flex-shrink-0 items-center gap-2">
            {actions}
            {primaryAction && ActionIcon && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="btn-primary hidden md:inline-flex"
              >
                <ActionIcon size={18} />
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </header>

      {primaryAction && ActionIcon && !primaryAction.disabled && (
        <button type="button" onClick={primaryAction.onClick} className="fab md:hidden">
          <ActionIcon size={20} strokeWidth={2.5} />
          {primaryAction.label}
        </button>
      )}
    </>
  );
}
