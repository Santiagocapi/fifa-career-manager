// ============================================================
// src/components/ui/BackButton.tsx
// "Volver" for detail pages that are opened from several
// screens: goes back to whichever one it was.
// ============================================================

import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  /** Where to go when the page was opened directly (no in-app history) */
  fallback: string;
}

export default function BackButton({ fallback }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <button
      type="button"
      // A direct link or reload has the 'default' key: there is nothing to go back to
      onClick={() => (location.key === 'default' ? navigate(fallback) : navigate(-1))}
      className="btn-ghost btn-sm -mb-2 -ml-3 self-start"
    >
      <ChevronLeft size={16} /> Volver
    </button>
  );
}
