// ============================================================
// src/components/ui/Field.tsx
// Label + control + hint/error. The <label> wraps the control,
// so tapping the label text focuses the input.
// ============================================================

import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export default function Field({ label, children, hint, error, required = false, className }: FieldProps) {
  return (
    <label className={clsx('field', className)}>
      <span className="field-label">
        {label}
        {required && <span className="text-neon-400"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </label>
  );
}
