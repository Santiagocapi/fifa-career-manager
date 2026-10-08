// ============================================================
// src/components/matches/ResultBadge.tsx
// V / E / D square for a match result, plus the form guide
// (last five results) built from it.
// ============================================================

import { clsx } from 'clsx';
import type { MatchResult } from '../../types/database';

const RESULT_META: Record<MatchResult, { short: string; label: string; classes: string }> = {
  win:  { short: 'V', label: 'Victoria', classes: 'border-neon-400/40 bg-neon-400/15 text-neon-300' },
  draw: { short: 'E', label: 'Empate',   classes: 'border-amber-400/40 bg-amber-400/15 text-amber-300' },
  loss: { short: 'D', label: 'Derrota',  classes: 'border-red-400/40 bg-red-400/15 text-red-300' },
};

interface ResultBadgeProps {
  result: MatchResult;
  size?: 'sm' | 'md';
  className?: string;
}

export default function ResultBadge({ result, size = 'md', className }: ResultBadgeProps) {
  const meta = RESULT_META[result];
  return (
    <span
      title={meta.label}
      aria-label={meta.label}
      className={clsx(
        'inline-flex flex-shrink-0 items-center justify-center border font-black',
        size === 'sm' ? 'h-6 w-6 rounded-md text-2xs' : 'h-9 w-9 rounded-xl text-sm',
        meta.classes,
        className
      )}
    >
      {meta.short}
    </span>
  );
}

export function FormGuide({ form }: { form: MatchResult[] }) {
  if (form.length === 0) return <span className="text-xs text-white/40">Sin partidos</span>;
  return (
    <span className="inline-flex items-center gap-1" aria-label="Últimos resultados, del más antiguo al más reciente">
      {form.map((result, i) => (
        <ResultBadge
          key={i}
          result={result}
          size="sm"
          className={i === form.length - 1 ? 'ring-1 ring-white/40' : undefined}
        />
      ))}
    </span>
  );
}
