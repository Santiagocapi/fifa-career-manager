// ============================================================
// src/components/dashboard/NewSeasonCard.tsx
// Call to action shown when the career has no open season.
// The year is pre-filled with the next season after the last one.
// ============================================================

import { useState } from 'react';
import { CalendarPlus, Loader2 } from 'lucide-react';
import type { Season } from '../../types/database';
import Field from '../ui/Field';

interface NewSeasonCardProps {
  seasons: Season[];
  onCreate: (yearLabel: string) => Promise<unknown>;
}

// "2024/2025" → "2025/2026"; falls back to the current calendar year
const suggestNextLabel = (seasons: Season[]): string => {
  const last = seasons[seasons.length - 1]?.year_label ?? '';
  const match = last.match(/(\d{4})\D+(\d{4})/);
  if (match) return `${Number(match[1]) + 1}/${Number(match[2]) + 1}`;
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`;
};

export default function NewSeasonCard({ seasons, onCreate }: NewSeasonCardProps) {
  const [yearLabel, setYearLabel] = useState(() => suggestNextLabel(seasons));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!yearLabel.trim()) return;
    setSubmitting(true);
    await onCreate(yearLabel.trim());
    setSubmitting(false);
  };

  return (
    <section className="card relative overflow-hidden border-neon-400/30 p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-neon-400/10 blur-3xl" />
      <div className="relative flex items-start gap-3.5">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-neon-400/15 text-neon-400">
          <CalendarPlus size={22} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white">
            {seasons.length === 0 ? 'Empieza tu primera temporada' : 'Empieza una nueva temporada'}
          </h2>
          <p className="mt-0.5 text-sm text-white/55">
            La temporada agrupa la plantilla, los partidos y los trofeos del año.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Temporada" className="sm:max-w-xs sm:flex-1">
          <input value={yearLabel} onChange={(e) => setYearLabel(e.target.value)} placeholder="2025/2026" />
        </Field>
        <button type="submit" disabled={submitting || !yearLabel.trim()} className="btn-primary">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <CalendarPlus size={18} />}
          Crear temporada
        </button>
      </form>
    </section>
  );
}
