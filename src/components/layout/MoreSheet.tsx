// ============================================================
// src/components/layout/MoreSheet.tsx
// Mobile "Más" menu: secondary sections plus career switching
// and sign out (the desktop sidebar shows these directly).
// ============================================================

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeftRight, ChevronRight, LogOut, Trash2, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import Sheet from '../ui/Sheet';
import { NAV_ITEMS } from './navItems';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import DeleteAccountSheet from './DeleteAccountSheet';

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function MoreSheet({ open, onClose }: MoreSheetProps) {
  const navigate = useNavigate();
  const { activeCareer, reset } = useAppStore();
  const { signOut } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const handleSignOut = async () => {
    onClose();
    await signOut();
    reset();
    navigate('/auth');
  };

  return (
    <Sheet open={open} onClose={onClose} title="Más opciones" size="sm">
      <nav aria-label="Más secciones" className="flex flex-col gap-1">
        {NAV_ITEMS.filter((item) => !item.primary).map((item) => (
          <MenuRow
            key={item.to}
            icon={item.icon}
            label={item.label}
            description={item.description}
            onClick={() => go(item.to)}
          />
        ))}
      </nav>

      <div className="my-3 border-t border-pitch-700" />

      <div className="flex flex-col gap-1">
        <MenuRow
          icon={ArrowLeftRight}
          label="Cambiar de carrera"
          description={activeCareer ? `Ahora: ${activeCareer.club_name}` : 'Elige o crea una carrera'}
          onClick={() => go('/careers')}
        />
        <MenuRow icon={LogOut} label="Cerrar sesión" tone="danger" onClick={handleSignOut} />
        <MenuRow
          icon={Trash2}
          label="Eliminar mi cuenta"
          description="Borra tu cuenta y todos tus datos"
          tone="danger"
          onClick={() => setDeleteOpen(true)}
        />
      </div>

      <DeleteAccountSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </Sheet>
  );
}

interface MenuRowProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  tone?: 'default' | 'danger';
  onClick: () => void;
}

function MenuRow({ icon: Icon, label, description, tone = 'default', onClick }: MenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[3.5rem] w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors active:bg-white/5 hover:bg-white/5"
    >
      <span
        className={clsx(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
          tone === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-pitch-700 text-neon-400'
        )}
      >
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={clsx('block font-semibold', tone === 'danger' ? 'text-red-300' : 'text-white')}>{label}</span>
        {description && <span className="block truncate text-xs text-white/50">{description}</span>}
      </span>
      {tone === 'default' && <ChevronRight size={18} className="flex-shrink-0 text-white/30" />}
    </button>
  );
}
