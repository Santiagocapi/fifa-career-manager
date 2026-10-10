// ============================================================
// src/pages/ResetPassword.tsx
// Landing page of the password recovery email. Opening the link
// signs the user in temporarily; here they choose a new password.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { MIN_PASSWORD_LENGTH, useAuth } from '../hooks/useAuth';
import { translateAuthError } from '../lib/authErrors';
import AuthShell from '../components/auth/AuthShell';
import PasswordField from '../components/auth/PasswordField';
import InlineAlert from '../components/ui/InlineAlert';

interface ResetFormData {
  password: string;
  confirm: string;
}

export default function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>();

  const onSubmit = async ({ password }: ResetFormData) => {
    setSubmitError(null);
    const { error } = await updatePassword(password);
    if (error) setSubmitError(translateAuthError(error));
    else navigate('/careers', { replace: true });
  };

  if (loading) {
    return (
      <AuthShell>
        <div className="flex justify-center py-6" role="status" aria-label="Cargando">
          <Loader2 className="animate-spin text-white/50" />
        </div>
      </AuthShell>
    );
  }

  // No session means the link was not opened, or it already expired
  if (!user) {
    return (
      <AuthShell>
        <div className="flex flex-col gap-4">
          <InlineAlert>El enlace caducó o ya se usó. Solicita uno nuevo desde la pantalla de acceso.</InlineAlert>
          <Link to="/auth" className="btn-primary btn-lg w-full">
            Ir al acceso
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Nueva contraseña</h2>
          <p className="mt-1 text-sm text-white/60">Elige una contraseña para {user.email}.</p>
        </div>

        <PasswordField
          id="reset-password"
          label="Nueva contraseña"
          autoComplete="new-password"
          error={errors.password?.message}
          hint={`Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`}
          registration={register('password', {
            required: 'Escribe tu nueva contraseña',
            minLength: { value: MIN_PASSWORD_LENGTH, message: `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres` },
          })}
        />

        <PasswordField
          id="reset-confirm"
          label="Repite la contraseña"
          autoComplete="new-password"
          error={errors.confirm?.message}
          registration={register('confirm', {
            required: 'Repite la contraseña',
            validate: (value) => value === getValues('password') || 'Las contraseñas no coinciden',
          })}
        />

        {submitError && <InlineAlert>{submitError}</InlineAlert>}

        <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          Guardar contraseña
        </button>
      </form>
    </AuthShell>
  );
}
