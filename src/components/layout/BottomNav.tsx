// ============================================================
// src/components/layout/BottomNav.tsx
// Mobile bottom navigation (md:hidden): four main sections and a
// "Más" tab, which keeps every target wide enough for a thumb.
// ============================================================

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { NAV_ITEMS } from './navItems';
import MoreSheet from './MoreSheet';

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const moreActive = NAV_ITEMS.some((item) => !item.primary && pathname.startsWith(item.to));

  return (
    <>
      <nav
        aria-label="Navegación principal"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-pitch-700 bg-pitch-850/95 backdrop-blur-xl md:hidden"
      >
        <ul className="grid h-16 grid-cols-5">
          {NAV_ITEMS.filter((item) => item.primary).map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className="block h-full">
                {({ isActive }) => <TabContent icon={item.icon} label={item.label} active={isActive} />}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className="block h-full w-full"
            >
              <TabContent icon={Menu} label="Más" active={moreActive} />
            </button>
          </li>
        </ul>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}

function TabContent({ icon: Icon, label, active }: { icon: LucideIcon; label: string; active: boolean }) {
  return (
    <span className="flex h-full flex-col items-center justify-center gap-1">
      <span
        className={clsx(
          'flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150',
          active ? 'bg-neon-400/15 text-neon-400' : 'text-white/55'
        )}
      >
        <Icon size={22} strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className={clsx('text-[11px] font-semibold leading-none', active ? 'text-white' : 'text-white/55')}>
        {label}
      </span>
    </span>
  );
}
