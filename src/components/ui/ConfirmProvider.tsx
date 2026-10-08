// ============================================================
// src/components/ui/ConfirmProvider.tsx
// Renders the shared confirmation sheet used by useConfirm().
// ============================================================

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import Sheet from './Sheet';
import { ConfirmContext, type ConfirmOptions } from './confirm';

export default function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // A new request cancels any pending one
        resolverRef.current?.(false);
        resolverRef.current = resolve;
        setRequest(options);
      }),
    []
  );

  const settle = (confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Sheet
        open={request !== null}
        onClose={() => settle(false)}
        title={request?.title ?? ''}
        size="sm"
        footer={
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => settle(false)}>
              {request?.cancelLabel ?? 'Cancelar'}
            </button>
            <button
              type="button"
              data-autofocus
              className={clsx(request?.tone === 'danger' ? 'btn-danger-solid' : 'btn-primary', 'flex-1')}
              onClick={() => settle(true)}
            >
              {request?.confirmLabel ?? 'Confirmar'}
            </button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-white/70">
          {request?.description ?? 'Esta acción no se puede deshacer.'}
        </p>
      </Sheet>
    </ConfirmContext.Provider>
  );
}
