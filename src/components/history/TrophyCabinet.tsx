// ============================================================
// src/components/history/TrophyCabinet.tsx
// Club trophies and individual awards of a season, drawn with
// the SVG trophy badges.
// ============================================================

import { Award, Trash2, Trophy as TrophyIconLucide } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PlayerWithStats, Trophy } from '../../types/database';
import { getTrophyTypeLabel } from '../../lib/constants';
import PlayerAvatar from '../player/PlayerAvatar';
import { TrophyIcon } from './TrophyIcons';

interface TrophyCabinetProps {
  trophies: Trophy[];
  players: PlayerWithStats[];
  /** Omitted for read-only (closed) seasons */
  onDeleteTrophy?: (trophy: Trophy) => void;
}

// Artwork for an individual award, guessed from its name
const individualAwardKey = (name: string) => {
  const n = name.toLowerCase();
  if (/(boot|bota|botín|botin|pichichi)/.test(n)) return 'golden_boot';
  if (/(glove|guante|zamora)/.test(n)) return 'golden_glove';
  return 'ballon_dor';
};

export default function TrophyCabinet({ trophies, players, onDeleteTrophy }: TrophyCabinetProps) {
  const clubTrophies = trophies.filter((t) => t.trophy_type !== 'individual');
  const individualAwards = trophies.filter((t) => t.trophy_type === 'individual');

  // The recipient is stored in `icon` (player id); older awards only have the name in the title
  const recipientOf = (trophy: Trophy) =>
    players.find((p) => p.id === trophy.icon) ??
    players.find((p) => trophy.trophy_name.toLowerCase().includes(p.full_name.toLowerCase()));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Shelf
        title="Trofeos del club"
        icon={<TrophyIconLucide size={15} className="text-amber-400" />}
        count={clubTrophies.length}
        empty="Ningún título del club en esta temporada."
      >
        {clubTrophies.map((trophy) => (
          <ShelfItem
            key={trophy.id}
            badge={<TrophyIcon type={trophy.trophy_type} size={36} />}
            title={trophy.trophy_name}
            subtitle={getTrophyTypeLabel(trophy.trophy_type)}
            onDelete={onDeleteTrophy && (() => onDeleteTrophy(trophy))}
          />
        ))}
      </Shelf>

      <Shelf
        title="Premios individuales"
        icon={<Award size={15} className="text-purple-300" />}
        count={individualAwards.length}
        empty="Ningún premio individual en esta temporada."
      >
        {individualAwards.map((trophy) => {
          const recipient = recipientOf(trophy);
          return (
            <ShelfItem
              key={trophy.id}
              badge={<TrophyIcon type={individualAwardKey(trophy.trophy_name)} size={36} />}
              title={trophy.trophy_name}
              subtitle={
                recipient ? (
                  <span className="flex min-w-0 items-center gap-1.5 text-white/75">
                    <PlayerAvatar name={recipient.full_name} size="xs" />
                    <span className="truncate" translate="no">
                      {recipient.full_name}
                    </span>
                  </span>
                ) : (
                  'Premio individual'
                )
              }
              onDelete={onDeleteTrophy && (() => onDeleteTrophy(trophy))}
            />
          );
        })}
      </Shelf>
    </div>
  );
}

interface ShelfProps {
  title: string;
  icon: ReactNode;
  count: number;
  empty: string;
  children: ReactNode;
}

function Shelf({ title, icon, count, empty, children }: ShelfProps) {
  return (
    <section className="card p-4 sm:p-5" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-title">
          {icon}
          {title}
        </h2>
        <span className="text-xs font-semibold tabular-nums text-white/45">{count}</span>
      </div>
      {count === 0 ? (
        <p className="py-5 text-center text-sm text-white/40">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">{children}</ul>
      )}
    </section>
  );
}

interface ShelfItemProps {
  badge: ReactNode;
  title: string;
  subtitle: ReactNode;
  onDelete?: () => void;
}

function ShelfItem({ badge, title, subtitle, onDelete }: ShelfItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-pitch-700 bg-pitch-900/50 py-2 pl-2 pr-1">
      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/5">{badge}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{title}</p>
        <div className="mt-0.5 truncate text-xs text-white/50">{subtitle}</div>
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Eliminar ${title}`}
          className="icon-btn text-white/35 hover:bg-red-500/10 hover:text-red-300"
        >
          <Trash2 size={17} />
        </button>
      )}
    </li>
  );
}
