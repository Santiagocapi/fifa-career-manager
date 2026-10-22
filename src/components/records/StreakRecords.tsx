// ============================================================
// src/components/records/StreakRecords.tsx
// Longest runs of the career: wins, unbeaten, clean sheets and
// matches scoring. Runs carry over from one season to the next.
// ============================================================

import { Flame, ShieldCheck, Swords, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatShortDate } from '../../lib/constants';
import type { CareerRecords, Streak } from './careerRecords';

export default function StreakRecords({ streaks }: { streaks: CareerRecords['streaks'] }) {
  const items: { key: string; label: string; icon: ReactNode; streak: Streak | null }[] = [
    { key: 'wins', label: 'Victorias seguidas', icon: <Flame size={16} className="text-neon-400" />, streak: streaks.wins },
    { key: 'unbeaten', label: 'Partidos sin perder', icon: <TrendingUp size={16} className="text-electric-400" />, streak: streaks.unbeaten },
    { key: 'clean', label: 'Vallas invictas seguidas', icon: <ShieldCheck size={16} className="text-emerald-300" />, streak: streaks.cleanSheets },
    { key: 'scoring', label: 'Partidos marcando', icon: <Swords size={16} className="text-amber-300" />, streak: streaks.scoring },
  ];

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="streaks-title">
      <h2 id="streaks-title" className="section-title">
        Mejores rachas
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        {items.map(({ key, label, icon, streak }) => (
          <div key={key} className="flex flex-col rounded-xl border border-pitch-700 bg-pitch-900/60 p-3">
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-white/55">
              <span aria-hidden="true">{icon}</span>
              {label}
            </dt>
            <dd className="mt-1.5">
              <span className="text-3xl font-black tabular-nums leading-none text-white">{streak?.length ?? 0}</span>
              {streak && (
                <span className="mt-1.5 block text-2xs text-white/45">
                  {streak.length === 1
                    ? formatShortDate(streak.from.match.match_date)
                    : `${formatShortDate(streak.from.match.match_date)} – ${formatShortDate(streak.to.match.match_date)}`}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
