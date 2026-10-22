// ============================================================
// src/components/records/AllTimeLeaders.tsx
// Top five of the whole career in goals, assists, appearances,
// MVP awards and clean sheets, players who left included.
// ============================================================

import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Footprints, Shirt, Star } from 'lucide-react';
import { clsx } from 'clsx';
import type { LeaderCategory, LeaderEntry } from './careerRecords';
import { BallIcon, GloveIcon } from '../icons/FootballIcons';
import SegmentedTabs from '../ui/SegmentedTabs';
import PlayerAvatar from '../player/PlayerAvatar';
import PositionBadge from '../player/PositionBadge';

const CATEGORIES: { value: LeaderCategory; label: string; unit: [string, string] }[] = [
  { value: 'goals', label: 'Goles', unit: ['gol', 'goles'] },
  { value: 'assists', label: 'Asist.', unit: ['asist.', 'asist.'] },
  { value: 'matches', label: 'Partidos', unit: ['partido', 'partidos'] },
  { value: 'mvps', label: 'MVP', unit: ['MVP', 'MVP'] },
  { value: 'clean_sheets', label: 'Invicto', unit: ['valla', 'vallas'] },
];

const ICONS: Record<LeaderCategory, ReactNode> = {
  goals: <BallIcon size={14} className="text-neon-400" />,
  assists: <Footprints size={14} className="text-electric-400" />,
  matches: <Shirt size={14} className="text-white/60" />,
  mvps: <Star size={14} className="fill-amber-400 text-amber-400" />,
  clean_sheets: <GloveIcon size={14} className="text-emerald-300" />,
};

const RANK_STYLES = ['bg-amber-400 text-pitch-950', 'bg-slate-300 text-pitch-950', 'bg-amber-700 text-white'];

export default function AllTimeLeaders({ leaders }: { leaders: Record<LeaderCategory, LeaderEntry[]> }) {
  const [category, setCategory] = useState<LeaderCategory>('goals');
  const entries = leaders[category];
  const unit = CATEGORIES.find((c) => c.value === category)?.unit ?? ['', ''];

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="leaders-title">
      <h2 id="leaders-title" className="section-title">
        Máximos históricos
      </h2>

      <SegmentedTabs
        ariaLabel="Estadística"
        value={category}
        onChange={setCategory}
        className="mt-3"
        items={CATEGORIES.map(({ value, label }) => ({ value, label }))}
      />

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-white/40">Todavía no hay datos para esta estadística.</p>
      ) : (
        <ol className="mt-3 flex flex-col gap-1.5">
          {entries.map(({ player, value }, index) => (
            <li key={player.id}>
              <Link
                to={`/squad/${player.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03] active:bg-white/5"
              >
                <span
                  className={clsx(
                    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-black tabular-nums',
                    RANK_STYLES[index] ?? 'bg-pitch-700 text-white/70'
                  )}
                >
                  {index + 1}
                </span>
                <PlayerAvatar name={player.full_name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white" translate="no">
                    {player.full_name}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5">
                    <PositionBadge position={player.preferred_position} />
                    {!player.is_active && <span className="text-2xs text-white/40">Ya no está en el club</span>}
                  </span>
                </span>
                <span className="flex flex-shrink-0 items-center gap-1.5 text-sm font-bold tabular-nums text-white">
                  {ICONS[category]}
                  {value}
                  <span className="text-xs font-normal text-white/45">{value === 1 ? unit[0] : unit[1]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
