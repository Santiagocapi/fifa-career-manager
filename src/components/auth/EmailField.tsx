// ============================================================
// src/components/auth/EmailField.tsx
// Email input wired to react-hook-form through register().
// ============================================================

import type { UseFormRegisterReturn } from 'react-hook-form';
import { Mail } from 'lucide-react';
import Field from '../ui/Field';

interface EmailFieldProps {
  id: string;
  registration: UseFormRegisterReturn;
  error?: string;
}

export default function EmailField({ id, registration, error }: EmailFieldProps) {
  return (
    <Field label="Email" htmlFor={id} error={error}>
      <div className="relative">
        <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="entrenador@club.com"
          className="pl-11"
          aria-invalid={error ? true : undefined}
          {...registration}
        />
      </div>
    </Field>
  );
}
