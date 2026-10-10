// ============================================================
// src/components/layout/DeleteAccountSheet.tsx
// Permanently deletes the signed-in account and all its data.
// The user must type their own email, so it cannot be done by a
// stray tap.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Sheet from '../ui/Sheet';
import InlineAlert from '../ui/InlineAlert';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { translateAuthError } from '../../lib/authErrors';

interface DeleteAccountSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function DeleteAccountSheet({ open, onClose }: DeleteAccountSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Eliminar mi cuenta" size="sm">
      <DeleteAccountForm onClose={onClose} />
    </Sheet>
  );
}

function DeleteAccountForm({ onClose }: { onClose: () => void }) {
  const { user, deleteAccount } = useAuth();
  const { reset } = useAppStore();
  const navigate = useNavigate();
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = user?.email ?? '';
  const matches = email !== '' && typed.trim().toLowerCase() === email.toLowerCase();

  const handleDelete = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!matches || deleting) return;

    setDeleting(true);
    setError(null);
    const { error: err } = await deleteAccount(email);
    if (err) {
      setError(translateAuthError(err));
      setDeleting(false);
      return;
    }

    reset();
    onClose();
    navigate('/auth', { replace: true });
  };

  return (
    <form onSubmit={handleDelete} className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-white/70">
        Se borrarán de forma permanente tu cuenta y todos tus datos: carreras, temporadas, plantillas, partidos,
        tácticas, scouting y trofeos. No se puede deshacer.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">
          Escribe <span className="font-semibold text-white">{email}</span> para confirmar
        </span>
        <input
          type="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={email}
        />
      </label>

      {error && <InlineAlert>{error}</InlineAlert>}

      <div className="flex gap-3">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={deleting}>
          Cancelar
        </button>
        <button type="submit" className="btn-danger-solid flex-1" disabled={!matches || deleting}>
          {deleting && <Loader2 size={18} className="animate-spin" />}
          Eliminar cuenta
        </button>
      </div>
    </form>
  );
}
