// ============================================================
// src/components/dashboard/SeasonsCard.tsx
// Seasons of the career on Inicio, with the entry point to close
// the current one when it is over.
// ============================================================

import { Link } from 'react-router-dom';
import { ChevronRight, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import type { Season } from '../../types/database';

interface SeasonsCardProps {
  seasons: Season[];
  /** Open season that can be closed now, if any */
  closableSeason: Season | null;
  closeDisabled?: boolean;
  onCloseSeason: () => void;
}

export default function SeasonsCard({ seasons, closableSeason, closeDisabled = false, onCloseSeason }: SeasonsCardProps) {
  return (
    <section className="card p-4 sm:p-5" aria-labelledby="seasons-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="seasons-title" className="section-title">
          Temporadas
        </h2>
        <Link to="/history" className="flex items-center gap-0.5 text-xs font-semibold text-neon-400">
          Ver historial <ChevronRight size={14} />
        </Link>
      </div>

      <ul className="mt-1 divide-y divide-pitch-700/70">
        {seasons
          .slice()
          .reverse()
          .map((season) => (
            <li key={season.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm text-white">
                <span className="font-semibold">Temporada {season.season_number}</span>
                <span className="text-white/50"> · {season.year_label}</span>
              </span>
              <span
                className={clsx(
                  'badge',
                  season.is_closed
                    ? 'border-white/10 bg-white/5 text-white/50'
                    : 'border-neon-400/30 bg-neon-400/10 text-neon-300'
                )}
              >
                {season.is_closed ? 'Cerrada' : 'En curso'}
              </span>
            </li>
          ))}
      </ul>

      {closableSeason && (
        <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-dashed border-pitch-600 p-3.5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">¿Terminaste la temporada {closableSeason.year_label}?</p>
            <p className="mt-0.5 text-xs text-white/50">
              Guarda la media y el valor final de la plantilla y empieza la siguiente con el mismo equipo.
            </p>
          </div>
          <button type="button" onClick={onCloseSeason} disabled={closeDisabled} className="btn-secondary flex-shrink-0">
            <Lock size={16} /> Cerrar temporada
          </button>
        </div>
      )}
    </section>
  );
}
