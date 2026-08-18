// ============================================================
// src/components/layout/AppLayout.tsx
// The main shell: sidebar + content area.
// On mobile: sidebar is hidden, BottomNav is shown instead.
// <Outlet /> is where React Router renders the current page.
// ============================================================

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAppStore } from '../../store/useAppStore';
import { clsx } from 'clsx';

export default function AppLayout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="flex min-h-screen bg-pitch-900">
      {/* Sidebar — fixed on the left, hidden on mobile */}
      <Sidebar />

      {/* Main content area — shifts right when sidebar is open (desktop only) */}
      <main className={clsx(
        'flex-1 transition-all duration-300 min-h-screen',
        // Desktop: shift right to clear the sidebar
        'md:' + (sidebarCollapsed ? 'ml-[72px]' : 'ml-[240px]'),
        // Mobile: no left margin, but add bottom padding to clear the bottom nav
        'ml-0 pb-20 md:pb-0'
      )}>
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
          {/* Outlet renders the matched child route component */}
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation — mobile only */}
      <BottomNav />
    </div>
  );
}
