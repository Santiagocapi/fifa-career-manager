// ============================================================
// src/components/layout/Sidebar.tsx
// Desktop navigation (md+): brand, active career, sections,
// sign out and collapse toggle.
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, ChevronsUpDown, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS } from './navItems';
import { getGameVersionShort } from '../../lib/gameVersions';
import AppLogo from '../ui/AppLogo';
import ClubCrest from '../ui/ClubCrest';

export default function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar, activeCareer, activeSeason, reset } = useAppStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    reset();
    navigate('/auth');
  };

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-pitch-700 bg-pitch-850/95 backdrop-blur-xl transition-[width] duration-200 md:flex',
        collapsed ? 'w-[76px]' : 'w-[248px]'
      )}
    >
      {/* Brand */}
      <div className={clsx('flex h-16 flex-shrink-0 items-center gap-3', collapsed ? 'justify-center' : 'px-5')}>
        <AppLogo size={34} />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-black leading-tight text-white">Career Manager</p>
            <p className="text-2xs font-semibold uppercase tracking-widest text-neon-400">Modo carrera</p>
          </div>
        )}
      </div>

      {/* Active career */}
      <div className="px-3">
        <NavLink
          to="/careers"
          aria-label={collapsed ? 'Cambiar de carrera' : undefined}
          className={({ isActive }) =>
            clsx(
              'group relative flex items-center gap-3 rounded-2xl border p-2.5 transition-colors',
              collapsed && 'justify-center',
              isActive ? 'border-neon-400/40 bg-neon-400/10' : 'border-pitch-700 bg-pitch-800 hover:border-pitch-500'
            )
          }
        >
          {activeCareer ? (
            <ClubCrest name={activeCareer.club_name} size={30} />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pitch-700 text-white/60">
              <ArrowLeftRight size={16} />
            </span>
          )}
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-white">
                  {activeCareer?.club_name ?? 'Elige una carrera'}
                </span>
                <span className="block truncate text-xs text-white/50">
                  {[getGameVersionShort(activeCareer?.game_version), activeSeason ? `Temporada ${activeSeason.year_label}` : 'Cambiar de carrera']
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </span>
              <ChevronsUpDown size={16} className="flex-shrink-0 text-white/40" />
            </>
          )}
          {collapsed && <Tooltip label="Cambiar de carrera" />}
        </NavLink>
      </div>

      {/* Sections. Tooltips overflow the rail when collapsed, so no scroll there. */}
      <nav
        aria-label="Navegación principal"
        className={clsx('flex-1 px-3 py-4', collapsed ? 'overflow-visible' : 'overflow-y-auto')}
      >
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) =>
                  clsx(
                    'group relative flex h-11 items-center gap-3 rounded-xl text-sm font-semibold transition-colors',
                    collapsed ? 'justify-center' : 'px-3',
                    isActive ? 'bg-neon-400/10 text-neon-400' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && label}
                {collapsed && <Tooltip label={label} />}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-1 border-t border-pitch-700 p-3">
        <button
          type="button"
          onClick={handleSignOut}
          aria-label={collapsed ? 'Cerrar sesión' : undefined}
          className={clsx(
            'group relative flex h-11 items-center gap-3 rounded-xl text-sm font-semibold text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-300',
            collapsed ? 'justify-center' : 'px-3'
          )}
        >
          <LogOut size={20} />
          {!collapsed && 'Cerrar sesión'}
          {collapsed && <Tooltip label="Cerrar sesión" />}
        </button>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          aria-expanded={!collapsed}
          className={clsx(
            'group relative flex h-11 items-center gap-3 rounded-xl text-sm font-semibold text-white/50 transition-colors hover:bg-white/5 hover:text-white',
            collapsed ? 'justify-center' : 'px-3'
          )}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          {!collapsed && 'Contraer menú'}
          {collapsed && <Tooltip label="Expandir menú" />}
        </button>
      </div>
    </aside>
  );
}

function Tooltip({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg border border-pitch-600 bg-pitch-800 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-card transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}
