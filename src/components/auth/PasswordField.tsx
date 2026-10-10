// ============================================================
// src/components/auth/PasswordField.tsx
// Password input with a show/hide toggle, wired to react-hook-form
// through the object returned by register().
// ============================================================

import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Field from '../ui/Field';

interface PasswordFieldProps {
  id: string;
  label: string;
  autoComplete: 'current-password' | 'new-password';
  registration: UseFormRegisterReturn;
  error?: string;
  hint?: string;
}

export default function PasswordField({ id, label, autoComplete, registration, error, hint }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      <div className="relative">
        <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="••••••••"
          className="pl-11 pr-12"
          aria-invalid={error ? true : undefined}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </Field>
  );
}
