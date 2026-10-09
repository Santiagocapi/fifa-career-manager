// ============================================================
// src/components/auth/CheckEmailPanel.tsx
// Shown after sign-up and after asking for a password reset:
// tells the user to open the email link and lets them resend it,
// with a short cooldown so the mail provider is not flooded.
// ============================================================

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import InlineAlert from '../ui/InlineAlert';

const RESEND_COOLDOWN_SECONDS = 60;

interface CheckEmailPanelProps {
  email: string;
  title: string;
  description: string;
  /** Resolves with an error message, or null when the email was sent */
  onResend: () => Promise<string | null>;
  onBack: () => void;
}

export default function CheckEmailPanel({ email, title, description, onResend, onBack }: CheckEmailPanelProps) {
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const resend = async () => {
    setSending(true);
    setFeedback(null);
    const error = await onResend();
    setSending(false);
    if (error) {
      setFeedback({ tone: 'error', text: error });
    } else {
      setFeedback({ tone: 'success', text: 'Te enviamos el correo de nuevo.' });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neon-400/10 text-neon-400">
        <MailCheck size={28} />
      </span>

      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="mt-1.5 text-sm text-white/60">
          {description} <span className="break-all font-semibold text-white">{email}</span>
        </p>
        <p className="mt-2 text-xs text-white/40">
          Si no lo ves, revisa la carpeta de spam. El enlace caduca en poco tiempo.
        </p>
      </div>

      {feedback && (
        <InlineAlert tone={feedback.tone} className="w-full text-left">
          {feedback.text}
        </InlineAlert>
      )}

      <button type="button" onClick={resend} disabled={sending || cooldown > 0} className="btn-secondary w-full">
        {sending && <Loader2 size={18} className="animate-spin" />}
        {cooldown > 0 ? `Reenviar correo (${cooldown} s)` : 'Reenviar correo'}
      </button>

      <button type="button" onClick={onBack} className="btn-ghost w-full">
        <ArrowLeft size={18} />
        Volver
      </button>
    </div>
  );
}
