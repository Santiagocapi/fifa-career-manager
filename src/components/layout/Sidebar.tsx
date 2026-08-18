// ============================================================
// src/components/layout/Sidebar.tsx
// Main navigation sidebar with active state and collapse.
// ============================================================

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Crosshair, BarChart2,
  Telescope, Trophy, ChevronLeft, ChevronRight,
  LogOut, Shield
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/squad',     icon: Users,           label: 'Squad' },
  { to: '/tactics',   icon: Crosshair,       label: 'Tactics' },
  { to: '/stats',     icon: BarChart2,       label: 'Stats' },
  { to: '/scouting',  icon: Telescope,       label: 'Scouting' },
  { to: '/history',   icon: Trophy,          label: 'History' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, activeCareer, reset } = useAppStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    reset();
    navigate('/auth');
  };

  return (
    <aside className={clsx(
      'fixed left-0 top-0 h-full z-40 flex-col',
      'bg-pitch-800/95 backdrop-blur-xl border-r border-pitch-700',
      'transition-all duration-300',
      // Hidden on mobile, shown as flex on md+ screens
      'hidden md:flex',
      sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
    )}>

      {/* Header: Logo + Career Name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-pitch-700 min-h-[72px]">
        <div className="w-9 h-9 rounded-xl bg-neon-400/10 border border-neon-400/20 flex items-center justify-center flex-shrink-0">
          <Shield size={18} className="text-neon-400" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="text-xs text-neon-400 font-semibold uppercase tracking-widest leading-none mb-0.5">
              Career Manager
            </p>
            <p className="text-sm font-bold text-white truncate">
              {activeCareer?.club_name ?? 'No Career Selected'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {/* Career selector link */}
        <NavLink
          to="/careers"
          className={({ isActive }) => clsx(
            isActive ? 'nav-item-active' : 'nav-item',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title="Switch Career"
        >
          {({ isActive }) => (
            <>
              <div className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black',
                isActive
                  ? 'bg-neon-400/20 text-neon-400'
                  : 'bg-pitch-700 text-white/60'
              )}>
                {activeCareer?.club_name?.charAt(0) ?? '?'}
              </div>
              {!sidebarCollapsed && (
                <span className="text-xs text-white/50">Switch Career</span>
              )}
            </>
          )}
        </NavLink>

        <div className="divider my-2" />

        {/* Main nav items */}
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              isActive ? 'nav-item-active' : 'nav-item',
              sidebarCollapsed && 'justify-center px-0'
            )}
            title={label}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer: Collapse toggle + Sign out */}
      <div className="px-3 py-4 border-t border-pitch-700 flex flex-col gap-2">
        <button
          onClick={handleSignOut}
          className={clsx(
            'nav-item text-red-400/70 hover:text-red-400 hover:bg-red-500/10 w-full',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title="Sign Out"
        >
          <LogOut size={18} />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className={clsx(
            'nav-item w-full',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed
            ? <ChevronRight size={18} />
            : <><ChevronLeft size={18} /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
