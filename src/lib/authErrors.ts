// ============================================================
// src/lib/authErrors.ts
// Supabase Auth answers in English. Translate the messages users
// can actually run into; anything unknown is shown as received.
// ============================================================

const AUTH_ERRORS: [RegExp, string][] = [
  [/^Invalid login credentials/i, 'Email o contraseña incorrectos.'],
  [/^Email not confirmed/i, 'Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.'],
  [/^User already registered/i, 'Ya existe una cuenta con ese email.'],
  [/^Password should be at least/i, 'La contraseña debe tener al menos 8 caracteres.'],
  [/^New password should be different/i, 'La nueva contraseña debe ser distinta de la anterior.'],
  [/rate limit/i, 'Se enviaron demasiados correos. Espera unos minutos e inténtalo de nuevo.'],
  [/you can only request this after/i, 'Por seguridad, espera unos segundos antes de volver a intentarlo.'],
  [/Auth session missing|expired|invalid.*(token|link)/i, 'El enlace caducó o ya se usó. Solicita uno nuevo.'],
];

export const translateAuthError = (message: string): string =>
  AUTH_ERRORS.find(([pattern]) => pattern.test(message))?.[1] ?? message;
