// ============================================================
// src/components/ui/Field.tsx
// Label + control + hint/error. By default the <label> wraps the
// control, so tapping the label text focuses the input. Pass
// htmlFor when the control sits next to other buttons (e.g. a
// "show password" toggle) so they are not nested in the label.
// ============================================================

import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}

export default function Field({ label, children, hint, error, required = false, htmlFor, className }: FieldProps) {
  const labelContent = (
    <>
      {label}
      {required && <span className="text-neon-400"> *</span>}
    </>
  );

  const message = error ? (
    <span className="field-error" role="alert">
      {error}
    </span>
  ) : (
    hint && <span className="field-hint">{hint}</span>
  );

  if (htmlFor) {
    return (
      <div className={clsx('field', className)}>
        <label htmlFor={htmlFor} className="field-label">
          {labelContent}
        </label>
        {children}
        {message}
      </div>
    );
  }

  return (
    <label className={clsx('field', className)}>
      <span className="field-label">{labelContent}</span>
      {children}
      {message}
    </label>
  );
}
