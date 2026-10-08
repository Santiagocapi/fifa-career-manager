// ============================================================
// src/pages/Auth.tsx
// Login / Register page.
// Uses React Hook Form for form state + validation.
//
// WHY REACT HOOK FORM?
// Regular forms with useState get messy fast:
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [emailError, setEmailError] = useState('')
//   ... 10 more useState calls ...
//
// React Hook Form handles all of this with ONE register() call.
// It also only re-renders when necessary (better performance).
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AppLogo from '../components/ui/AppLogo';
import Field from '../components/ui/Field';
import InlineAlert from '../components/ui/InlineAlert';
import SegmentedTabs from '../components/ui/SegmentedTabs';

interface AuthFormData {
  email: string;
  password: string;
}

type AuthMode = 'login' | 'register';

// Supabase answers in English; translate the messages users actually see
const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email o contraseña incorrectos.',
  'Email not confirmed': 'Confirma tu email antes de iniciar sesión.',
  'User already registered': 'Ya existe una cuenta con ese email.',
};

const translateAuthError = (message: string) => AUTH_ERRORS[message] ?? message;

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthFormData>();

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const onSubmit = async (data: AuthFormData) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (mode === 'login') {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        setSubmitError(translateAuthError(error));
      } else {
        navigate('/careers');
      }
    } else {
      const { error } = await signUp(data.email, data.password);
      if (error) {
        setSubmitError(translateAuthError(error));
      } else {
        setSubmitSuccess('Cuenta creada. Revisa tu email para confirmarla y después inicia sesión.');
        setMode('login');
      }
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <AppLogo size={64} className="mb-4 drop-shadow-[0_0_24px_theme(colors.neon.400/30%)]" />
          <h1 className="text-3xl font-black tracking-tight text-white">Career Manager</h1>
          <p className="mt-1 text-sm text-white/55">Tu modo carrera de EA FC, partido a partido</p>
        </div>

        <div className="card p-5 sm:p-6">
          <SegmentedTabs
            ariaLabel="Acceso"
            fullWidth
            value={mode}
            onChange={switchMode}
            items={[
              { value: 'login', label: 'Iniciar sesión' },
              { value: 'register', label: 'Crear cuenta' },
            ]}
          />

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 flex flex-col gap-4">
            <Field label="Email" htmlFor="auth-email" error={errors.email?.message}>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  id="auth-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="entrenador@club.com"
                  className="pl-11"
                  aria-invalid={errors.email ? true : undefined}
                  {...register('email', {
                    required: 'Escribe tu email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'El email no es válido',
                    },
                  })}
                />
              </div>
            </Field>

            <Field label="Contraseña" htmlFor="auth-password" error={errors.password?.message}>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  className="pl-11 pr-12"
                  aria-invalid={errors.password ? true : undefined}
                  {...register('password', {
                    required: 'Escribe tu contraseña',
                    minLength:
                      mode === 'register'
                        ? { value: 6, message: 'Usa al menos 6 caracteres' }
                        : undefined,
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {submitError && <InlineAlert>{submitError}</InlineAlert>}
            {submitSuccess && <InlineAlert tone="success">{submitSuccess}</InlineAlert>}

            <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg mt-1 w-full">
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
