// ============================================================
// src/components/layout/MobileTopBar.tsx
// Sticky top bar on phones: which club and season you are
// editing, always visible. Tapping it opens the career list.
// ============================================================

import { Link } from 'react-router-dom';
import { ChevronsUpDown } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import AppLogo from '../ui/AppLogo';
import ClubCrest from '../ui/ClubCrest';

export default function MobileTopBar() {
  const { activeCareer, activeSeason } = useAppStore();

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-pitch-700/80 bg-pitch-900/85 backdrop-blur-xl md:hidden">
      <div className="flex h-14 items-center px-4">
        {activeCareer ? (
          <Link
            to="/careers"
            className="-ml-1 flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1"
            aria-label={`${activeCareer.club_name}. Cambiar de carrera`}
          >
            <ClubCrest name={activeCareer.club_name} size={30} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight text-white">
                {activeCareer.club_name}
              </span>
              <span className="block truncate text-xs leading-tight text-white/50">
                {activeSeason
                  ? `Temporada ${activeSeason.season_number} · ${activeSeason.year_label}`
                  : 'Sin temporada activa'}
              </span>
            </span>
            <ChevronsUpDown size={16} className="flex-shrink-0 text-white/40" />
          </Link>
        ) : (
          <span className="flex items-center gap-2.5">
            <AppLogo size={30} />
            <span className="text-sm font-bold text-white">Career Manager</span>
          </span>
        )}
      </div>
    </header>
  );
}
