// ============================================================
// src/components/auth/AuthShell.tsx
// Centered card with the brand header shared by the sign-in and
// password reset screens.
// ============================================================

import type { ReactNode } from 'react';
import AppLogo from '../ui/AppLogo';

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <AppLogo size={64} className="mb-4 drop-shadow-[0_0_24px_theme(colors.neon.400/30%)]" />
          <h1 className="text-3xl font-black tracking-tight text-white">Career Manager</h1>
          <p className="mt-1 text-sm text-white/55">Tu modo carrera de EA FC, partido a partido</p>
        </div>

        <div className="card p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
