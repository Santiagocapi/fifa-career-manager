// ============================================================
// src/components/ui/InlineAlert.tsx
// Error / success / info message shown inside a page or form.
// ============================================================

import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface InlineAlertProps {
  tone?: 'error' | 'success' | 'info';
  children: ReactNode;
  className?: string;
}

const TONES = {
  error: { icon: CircleAlert, classes: 'border-red-500/30 bg-red-500/10 text-red-300' },
  success: { icon: CircleCheck, classes: 'border-neon-400/30 bg-neon-400/10 text-neon-300' },
  info: { icon: Info, classes: 'border-electric-400/30 bg-electric-400/10 text-electric-300' },
};

export default function InlineAlert({ tone = 'error', children, className }: InlineAlertProps) {
  const { icon: Icon, classes } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm', classes, className)}
    >
      <Icon size={18} className="mt-px flex-shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
