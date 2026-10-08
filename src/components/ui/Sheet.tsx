// ============================================================
// src/components/ui/Sheet.tsx
// Responsive dialog: a bottom sheet on phones (thumb-friendly,
// actions pinned at the bottom) and a centered modal on larger
// screens. Handles Escape, focus trapping and body scroll lock.
// ============================================================

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Actions pinned to the bottom (stay visible while the body scrolls) */
  footer?: ReactNode;
  /** Content pinned under the header, e.g. step tabs */
  toolbar?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Fixed height so the sheet does not jump when its content changes */
  tall?: boolean;
  /** Tapping the backdrop closes the sheet. Disable it for long forms. */
  closeOnBackdrop?: boolean;
}

const SIZE_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open sheets, top-most last: only that one reacts to Escape/Tab, and the
// body stays locked until the last sheet closes (sheets can be stacked,
// e.g. a confirmation on top of a form).
const openStack: string[] = [];
let overflowBeforeLock = '';

export default function Sheet({ open, ...props }: SheetProps) {
  if (!open) return null;
  return <SheetPanel {...props} />;
}

function SheetPanel({
  onClose,
  title,
  description,
  children,
  footer,
  toolbar,
  size = 'md',
  tall = false,
  closeOnBackdrop = true,
}: Omit<SheetProps, 'open'>) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { body } = document;

    if (openStack.length === 0) overflowBeforeLock = body.style.overflow;
    openStack.push(id);
    body.style.overflow = 'hidden';

    // Only jump into a field when there is a physical keyboard: on phones
    // an autofocus would pop the on-screen keyboard over the sheet.
    const prefersFieldFocus = window.matchMedia('(pointer: fine)').matches;
    const autofocusTarget = prefersFieldFocus
      ? panel?.querySelector<HTMLElement>('[data-autofocus]')
      : null;
    (autofocusTarget ?? panel)?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== id || !panel) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key === 'Tab') {
        const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null
        );
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === panel)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = openStack.lastIndexOf(id);
      if (index !== -1) openStack.splice(index, 1);
      if (openStack.length === 0) body.style.overflow = overflowBeforeLock;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [id]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-pitch-950/75 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={clsx(
          'relative flex w-full flex-col overflow-hidden border border-pitch-600 bg-pitch-850 shadow-sheet outline-none',
          'animate-sheet-up rounded-t-3xl sm:animate-dialog-in sm:rounded-2xl',
          tall ? 'h-[92dvh] sm:h-[min(88vh,880px)]' : 'max-h-[92dvh] sm:max-h-[88vh]',
          SIZE_CLASSES[size]
        )}
      >
        {/* Grab handle: purely visual cue that this is a sheet */}
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 flex-shrink-0 rounded-full bg-white/15 sm:hidden" />

        <header className="flex flex-shrink-0 items-start gap-3 px-5 pb-3 pt-2 sm:pt-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-bold leading-tight text-white">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-white/55">
                {description}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="icon-btn -mr-2 -mt-1" aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {toolbar && <div className="flex-shrink-0 px-5 pb-3">{toolbar}</div>}

        <div
          className={clsx(
            'flex-1 overflow-y-auto overscroll-contain border-t border-pitch-700 px-5 pt-4',
            // Without a footer the body is the last thing above the home indicator
            footer ? 'pb-4' : 'pb-[max(1rem,env(safe-area-inset-bottom))]'
          )}
        >
          {children}
        </div>

        {footer && (
          <footer className="flex-shrink-0 border-t border-pitch-700 bg-pitch-850 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
