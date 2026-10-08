// ============================================================
// src/components/ui/confirm.ts
// Promise-based confirmation dialog (replaces window.confirm,
// which looks out of place and is easy to mis-tap on phones).
// Usage: const confirm = useConfirm();
//        if (await confirm({ title: '¿Eliminar?' })) { ... }
// ============================================================

import { createContext, useContext } from 'react';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
}
