// ============================================================
// src/components/layout/AppLayout.tsx
// The main shell. Desktop: sidebar + content. Phones: sticky top
// bar with the active career, content and bottom navigation.
// <Outlet /> is where React Router renders the current page.
// ============================================================

import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MobileTopBar from './MobileTopBar';
import EmptyState from '../ui/EmptyState';
import { useAppStore } from '../../store/useAppStore';

export default function AppLayout() {
  const { sidebarCollapsed, activeCareer } = useAppStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Every section except the career list works on the active career
  const needsCareer = !activeCareer && pathname !== '/careers';

  // A new section always starts at the top (BrowserRouter keeps the scroll)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-dvh">
      <Sidebar />

      <div className={clsx('transition-[padding] duration-200', sidebarCollapsed ? 'md:pl-[76px]' : 'md:pl-[248px]')}>
        <MobileTopBar />

        {/* Bottom padding keeps the last item clear of the bottom nav and the floating button */}
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 md:px-8 md:pb-12 md:pt-8">
          {needsCareer ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No hay ninguna carrera seleccionada"
              description="Elige una de tus carreras o crea una nueva para empezar."
              action={
                <button type="button" onClick={() => navigate('/careers')} className="btn-primary">
                  Ver mis carreras
                </button>
              }
            />
          ) : (
            <Suspense fallback={<PageLoader />}>
              <div key={pathname} className="animate-fade-in">
                <Outlet />
              </div>
            </Suspense>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex justify-center py-24" role="status" aria-label="Cargando">
      <Loader2 className="animate-spin text-neon-400" size={28} />
    </div>
  );
}
