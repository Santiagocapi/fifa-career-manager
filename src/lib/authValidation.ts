// ============================================================
// src/lib/authValidation.ts
// Validation rules shared by the auth forms (react-hook-form).
// ============================================================

export const EMAIL_RULES = {
  required: 'Escribe tu email',
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'El email no es válido',
  },
};
