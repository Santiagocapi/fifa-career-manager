// ============================================================
// src/pages/Auth.tsx
// Sign in / create account. Sign-up needs the user to confirm the
// email address before the first session; password recovery lives
// here too. Email links land back on this route.
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { MIN_PASSWORD_LENGTH, useAuth } from '../hooks/useAuth';
import { translateAuthError } from '../lib/authErrors';
import { EMAIL_RULES } from '../lib/authValidation';
import AuthShell from '../components/auth/AuthShell';
import CheckEmailPanel from '../components/auth/CheckEmailPanel';
import EmailField from '../components/auth/EmailField';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import PasswordField from '../components/auth/PasswordField';
import InlineAlert from '../components/ui/InlineAlert';
import SegmentedTabs from '../components/ui/SegmentedTabs';

interface AuthFormData {
  email: string;
  password: string;
}

type AuthMode = 'login' | 'register';
type AuthView =
  | { name: 'form' }
  | { name: 'confirm'; email: string }
  | { name: 'forgot' }
  | { name: 'reset-sent'; email: string };

// An expired or already used email link comes back as #error=...&error_description=...
const readLinkError = (): string | null => {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (!params.get('error') && !params.get('error_code')) return null;
  return translateAuthError(params.get('error_description') ?? 'expired');
};

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [view, setView] = useState<AuthView>({ name: 'form' });
  const [submitError, setSubmitError] = useState<string | null>(readLinkError);
  const { user, signIn, signUp, resendConfirmation, requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>();

  // Following the confirmation link signs the user in: send them to the app
  useEffect(() => {
    if (user) navigate('/careers', { replace: true });
  }, [user, navigate]);

  // Drop the error fragment so a refresh does not show it again
  useEffect(() => {
    if (window.location.hash.includes('error')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setSubmitError(null);
  };

  const onSubmit = async (data: AuthFormData) => {
    setSubmitError(null);
    const email = data.email.trim();

    if (mode === 'login') {
      const { error } = await signIn(email, data.password);
      if (error) setSubmitError(translateAuthError(error));
      return;
    }

    const { error, needsConfirmation } = await signUp(email, data.password);
    if (error) setSubmitError(translateAuthError(error));
    else if (needsConfirmation) setView({ name: 'confirm', email });
  };

  const backToForm = () => {
    setView({ name: 'form' });
    setSubmitError(null);
  };

  if (view.name === 'confirm') {
    return (
      <AuthShell>
        <CheckEmailPanel
          email={view.email}
          title="Revisa tu correo"
          description="Para activar tu cuenta abre el enlace que enviamos a"
          onResend={async () => {
            const { error } = await resendConfirmation(view.email);
            return error ? translateAuthError(error) : null;
          }}
          onBack={() => {
            setMode('login');
            backToForm();
          }}
        />
      </AuthShell>
    );
  }

  if (view.name === 'forgot') {
    return (
      <AuthShell>
        <ForgotPasswordForm onSent={(email) => setView({ name: 'reset-sent', email })} onBack={backToForm} />
      </AuthShell>
    );
  }

  if (view.name === 'reset-sent') {
    return (
      <AuthShell>
        <CheckEmailPanel
          email={view.email}
          title="Revisa tu correo"
          description="Si existe una cuenta, te enviamos un enlace para cambiar la contraseña a"
          onResend={async () => {
            const { error } = await requestPasswordReset(view.email);
            return error ? translateAuthError(error) : null;
          }}
          onBack={backToForm}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
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
        <EmailField id="auth-email" registration={register('email', EMAIL_RULES)} error={errors.email?.message} />

        <PasswordField
          id="auth-password"
          label="Contraseña"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          error={errors.password?.message}
          hint={mode === 'register' ? `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.` : undefined}
          registration={register('password', {
            required: 'Escribe tu contraseña',
            minLength:
              mode === 'register'
                ? { value: MIN_PASSWORD_LENGTH, message: `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres` }
                : undefined,
          })}
        />

        {submitError && <InlineAlert>{submitError}</InlineAlert>}

        <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg mt-1 w-full">
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => setView({ name: 'forgot' })}
            className="self-center text-sm font-medium text-white/60 underline-offset-4 hover:text-white hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}
      </form>
    </AuthShell>
  );
}
