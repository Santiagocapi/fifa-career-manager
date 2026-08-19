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
      <nav className={clsx('flex-1 px-3 py-4 flex flex-col gap-1', sidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto')}>
        {/* Career selector link */}
        <NavLink
          to="/careers"
          className={({ isActive }) => clsx(
            isActive ? 'nav-item-active' : 'nav-item',
            sidebarCollapsed && 'justify-center px-0 relative group'
          )}
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
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3.5 px-3 py-1.5 bg-pitch-900/95 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-neon-400/30 shadow-[0_4px_20px_rgba(0,0,0,0.6)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 flex items-center gap-1.5 translate-x-1 group-hover:translate-x-0">
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-pitch-900 border-l border-b border-neon-400/30 rotate-45" />
                  <span>Switch Career</span>
                </div>
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
              sidebarCollapsed && 'justify-center px-0 relative group'
            )}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-3.5 px-3 py-1.5 bg-pitch-900/95 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-neon-400/30 shadow-[0_4px_20px_rgba(0,0,0,0.6)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 flex items-center gap-1.5 translate-x-1 group-hover:translate-x-0">
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-pitch-900 border-l border-b border-neon-400/30 rotate-45" />
                <span>{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: Collapse toggle + Sign out */}
      <div className="px-3 py-4 border-t border-pitch-700 flex flex-col gap-2">
        <button
          onClick={handleSignOut}
          className={clsx(
            'nav-item text-red-400/70 hover:text-red-400 hover:bg-red-500/10 w-full',
            sidebarCollapsed && 'justify-center px-0 relative group'
          )}
        >
          <LogOut size={18} />
          {!sidebarCollapsed && <span>Sign Out</span>}
          {sidebarCollapsed && (
            <div className="absolute left-full ml-3.5 px-3 py-1.5 bg-pitch-900/95 backdrop-blur-md text-red-400 text-xs font-bold rounded-xl border border-red-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.6)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 flex items-center gap-1.5 translate-x-1 group-hover:translate-x-0">
              <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-pitch-900 border-l border-b border-red-500/30 rotate-45" />
              <span>Sign Out</span>
            </div>
          )}
        </button>

        <button
          onClick={toggleSidebar}
          className={clsx(
            'nav-item w-full',
            sidebarCollapsed && 'justify-center px-0 relative group'
          )}
        >
          {sidebarCollapsed
            ? (
              <>
                <ChevronRight size={18} />
                <div className="absolute left-full ml-3.5 px-3 py-1.5 bg-pitch-900/95 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-neon-400/30 shadow-[0_4px_20px_rgba(0,0,0,0.6)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 flex items-center gap-1.5 translate-x-1 group-hover:translate-x-0">
                  <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-pitch-900 border-l border-b border-neon-400/30 rotate-45" />
                  <span>Expand Sidebar</span>
                </div>
              </>
            )
            : <><ChevronLeft size={18} /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
