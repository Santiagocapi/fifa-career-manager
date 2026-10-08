// ============================================================
// src/App.tsx
// Root component: sets up routing and authentication guard.
//
// HOW ROUTING WORKS:
// React Router intercepts browser URL changes and renders
// the matching component WITHOUT a full page reload.
// This is what makes it a "Single Page Application" (SPA).
//
// AUTH GUARD:
// If the user is not logged in, they see the Auth page.
// If they are logged in, they see the app.
// This is handled by the ProtectedRoute component.
//
// Pages are lazy-loaded so phones only download the code of the
// screen being opened (e.g. the charts library only on Partidos).
// ============================================================

import { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import ConfirmProvider from './components/ui/ConfirmProvider';
import AppLogo from './components/ui/AppLogo';
import AuthPage from './pages/Auth';

const CareerSelect = lazy(() => import('./pages/CareerSelect'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Squad = lazy(() => import('./pages/Squad'));
const Tactics = lazy(() => import('./pages/Tactics'));
const Stats = lazy(() => import('./pages/Stats'));
const Scouting = lazy(() => import('./pages/Scouting'));
const History = lazy(() => import('./pages/History'));

// ProtectedRoute: renders children only if user is authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // While checking auth state, show a loading screen
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-pitch-900" role="status">
        <div className="flex flex-col items-center gap-4">
          <AppLogo size={56} className="animate-pulse" />
          <p className="text-sm text-white/50">Cargando tu carrera…</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to auth
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    // BrowserRouter: enables React Router in the app
    <BrowserRouter>
      <ConfirmProvider>
        <Routes>
          {/* Public route: auth page */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected routes: wrapped in ProtectedRoute + AppLayout */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            {/* Nested routes render inside AppLayout's <Outlet /> */}
            <Route index element={<Navigate to="/careers" replace />} />
            <Route path="careers" element={<CareerSelect />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="squad" element={<Squad />} />
            <Route path="tactics" element={<Tactics />} />
            <Route path="stats" element={<Stats />} />
            <Route path="scouting" element={<Scouting />} />
            <Route path="history" element={<History />} />
          </Route>

          {/* Catch-all: redirect unknown URLs to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ConfirmProvider>
    </BrowserRouter>
  );
}
