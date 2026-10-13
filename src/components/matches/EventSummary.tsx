// ============================================================
// src/components/matches/EventSummary.tsx
// Compact icons for what a player did in a match: goals,
// assists, cards and clean sheet. Renders nothing if none.
// ============================================================

import type { ReactNode } from 'react';
import { Footprints } from 'lucide-react';
import type { MatchEvent } from '../../types/database';
import { BallIcon, CardIcon, GloveIcon } from '../icons/FootballIcons';

type EventCounters = Pick<MatchEvent, 'goals' | 'assists' | 'yellow_card' | 'red_card' | 'clean_sheet'>;

export default function EventSummary({ event }: { event: EventCounters }) {
  const items: ReactNode[] = [];
  if (event.goals > 0) {
    items.push(
      <span key="g" className="flex items-center gap-0.5 text-neon-300" title="Goles">
        <BallIcon size={13} />
        {event.goals > 1 && event.goals}
      </span>
    );
  }
  if (event.assists > 0) {
    items.push(
      <span key="a" className="flex items-center gap-0.5 text-electric-300" title="Asistencias">
        <Footprints size={13} />
        {event.assists > 1 && event.assists}
      </span>
    );
  }
  if (event.yellow_card) items.push(<CardIcon key="y" size={13} filled className="text-amber-400" />);
  if (event.red_card) items.push(<CardIcon key="r" size={13} filled className="text-red-500" />);
  if (event.clean_sheet) items.push(<GloveIcon key="cs" size={13} className="text-emerald-300" />);
  if (items.length === 0) return null;

  return <span className="flex flex-shrink-0 items-center gap-1.5 text-2xs font-bold tabular-nums">{items}</span>;
}
