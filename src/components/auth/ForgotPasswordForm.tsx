// ============================================================
// src/components/auth/ForgotPasswordForm.tsx
// Asks for the account email and sends the password reset link.
// ============================================================

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { translateAuthError } from '../../lib/authErrors';
import InlineAlert from '../ui/InlineAlert';
import { EMAIL_RULES } from '../../lib/authValidation';
import EmailField from './EmailField';

interface ForgotPasswordFormProps {
  /** Called with the email once the link was requested */
  onSent: (email: string) => void;
  onBack: () => void;
}

export default function ForgotPasswordForm({ onSent, onBack }: ForgotPasswordFormProps) {
  const { requestPasswordReset } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>();

  const onSubmit = async ({ email }: { email: string }) => {
    setSubmitError(null);
    const { error } = await requestPasswordReset(email.trim());
    if (error) setSubmitError(translateAuthError(error));
    else onSent(email.trim());
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-white">Recuperar contraseña</h2>
        <p className="mt-1 text-sm text-white/60">
          Escribe tu email y te enviaremos un enlace para elegir una contraseña nueva.
        </p>
      </div>

      <EmailField id="forgot-email" registration={register('email', EMAIL_RULES)} error={errors.email?.message} />

      {submitError && <InlineAlert>{submitError}</InlineAlert>}

      <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
        {isSubmitting && <Loader2 size={18} className="animate-spin" />}
        Enviar enlace
      </button>

      <button type="button" onClick={onBack} className="btn-ghost w-full">
        <ArrowLeft size={18} />
        Volver
      </button>
    </form>
  );
}
