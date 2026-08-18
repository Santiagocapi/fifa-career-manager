// ============================================================
// src/components/layout/AppLayout.tsx
// The main shell: sidebar + content area.
// <Outlet /> is where React Router renders the current page.
// ============================================================

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store/useAppStore';
import { clsx } from 'clsx';

export default function AppLayout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="flex min-h-screen bg-pitch-900">
      {/* Sidebar — fixed on the left */}
      <Sidebar />

      {/* Main content area — shifts right when sidebar is open */}
      <main className={clsx(
        'flex-1 transition-all duration-300 min-h-screen',
        sidebarCollapsed ? 'ml-[72px]' : 'ml-[240px]'
      )}>
        <div className="p-6 max-w-[1400px] mx-auto">
          {/* Outlet renders the matched child route component */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
