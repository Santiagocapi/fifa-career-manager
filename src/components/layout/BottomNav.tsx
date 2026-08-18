// ============================================================
// src/components/layout/BottomNav.tsx
// Mobile bottom navigation bar — shown only on small screens (md:hidden).
// Mirrors the same nav items as the desktop sidebar.
// ============================================================

import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Crosshair, BarChart2,
  Telescope, Trophy,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/squad',     icon: Users,           label: 'Squad' },
  { to: '/tactics',   icon: Crosshair,       label: 'Tactics' },
  { to: '/stats',     icon: BarChart2,       label: 'Stats' },
  { to: '/scouting',  icon: Telescope,       label: 'Scout' },
  { to: '/history',   icon: Trophy,          label: 'History' },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-pitch-800/95 backdrop-blur-xl border-t border-pitch-700 flex items-stretch">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-center transition-colors',
              isActive
                ? 'text-neon-400'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            {({ isActive }) => (
              <>
                <div className={clsx(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-colors',
                  isActive ? 'bg-neon-400/15' : ''
                )}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
