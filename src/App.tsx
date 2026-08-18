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
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppLayout from './components/layout/AppLayout';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Squad from './pages/Squad';
import Tactics from './pages/Tactics';
import Stats from './pages/Stats';
import Scouting from './pages/Scouting';
import History from './pages/History';
import CareerSelect from './pages/CareerSelect';

// ProtectedRoute: renders children only if user is authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // While checking auth state, show a loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-pitch-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-neon-400/30 border-t-neon-400 rounded-full animate-spin" />
          <p className="text-white/50 text-sm">Loading your career...</p>
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
    </BrowserRouter>
  );
}
