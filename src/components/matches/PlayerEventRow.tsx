// ============================================================
// src/components/matches/PlayerEventRow.tsx
// One player in the match logger. Collapsed it is a single line
// (name, what they did, played switch) so the whole XI fits on
// a phone screen; tap it to open the goal/assist steppers, card
// and clean sheet toggles and, for starters, who replaced them.
// ============================================================

import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Cross, Footprints } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlayerWithStats } from '../../types/database';
import { BallIcon, CardIcon, GloveIcon } from '../icons/FootballIcons';
import NumberStepper from '../ui/NumberStepper';
import Switch from '../ui/Switch';
import PositionBadge from '../player/PositionBadge';
import type { PlayerMatchPerformance } from './matchEvents';

interface PlayerEventRowProps {
  player: PlayerWithStats;
  event: PlayerMatchPerformance;
  expanded: boolean;
  onToggleExpanded: () => void;
  onChange: (patch: Partial<PlayerMatchPerformance>) => void;
  onPlayedChange: (played: boolean) => void;
  /** Starters only: bench players that can come on for them */
  substituteOptions?: PlayerWithStats[];
  onSubstitute?: (substituteId: string) => void;
  /** Substitutes only: who they replaced */
  replacedName?: string;
}

export default function PlayerEventRow({
  player,
  event,
  expanded,
  onToggleExpanded,
  onChange,
  onPlayedChange,
  substituteOptions,
  onSubstitute,
  replacedName,
}: PlayerEventRowProps) {
  // Injured players cannot be edited here: they never count as having played
  const active = event.played && !event.injured;
  const panelId = `player-event-${player.id}`;

  return (
    <li
      className={clsx(
        'rounded-2xl border transition-colors',
        event.injured
          ? 'border-red-500/20 bg-red-500/[0.04] opacity-70'
          : active
            ? event.is_starter
              ? 'border-neon-400/25 bg-pitch-800'
              : 'border-electric-400/30 bg-pitch-800'
            : 'border-pitch-700 bg-pitch-900/40'
      )}
    >
      <div className="flex items-center gap-2 py-1.5 pl-3 pr-2">
        <button
          type="button"
          onClick={onToggleExpanded}
          disabled={!active}
          aria-expanded={active ? expanded : undefined}
          aria-controls={active ? panelId : undefined}
          className="flex min-h-[2.75rem] min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <PositionBadge position={player.preferred_position} />
          <span className="min-w-0 flex-1">
            <span className={clsx('block truncate font-semibold', active ? 'text-white' : 'text-white/55')} translate="no">
              {player.full_name}
            </span>
            {event.injured ? (
              <span className="flex items-center gap-1 text-2xs font-semibold text-red-300">
                <Cross size={10} strokeWidth={3} /> Lesionado
              </span>
            ) : event.substituted_in && replacedName ? (
              <span className="flex items-center gap-1 text-2xs font-semibold text-electric-300">
                <ArrowUp size={11} strokeWidth={3} /> Entró por <span translate="no">{replacedName}</span>
              </span>
            ) : event.substituted_off ? (
              <span className="flex items-center gap-1 text-2xs font-semibold text-red-300/90">
                <ArrowDown size={11} strokeWidth={3} /> Sustituido
              </span>
            ) : null}
          </span>
          {active && <EventSummary event={event} />}
          {active && (
            <ChevronDown
              size={18}
              aria-hidden="true"
              className={clsx('flex-shrink-0 text-white/35 transition-transform', expanded && 'rotate-180')}
            />
          )}
        </button>
        <Switch
          checked={active}
          onChange={onPlayedChange}
          label={`Jugó ${player.full_name}`}
          hideLabel
          disabled={event.injured}
          tone={event.is_starter ? 'neon' : 'electric'}
        />
      </div>

      {active && expanded && (
        <div id={panelId} className="border-t border-pitch-700 px-3 pb-3 pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <StatControl icon={<BallIcon size={16} className="text-neon-400" />}>
              <NumberStepper
                value={event.goals}
                onChange={(goals) => onChange({ goals })}
                label={`goles de ${player.full_name}`}
                tone="neon"
              />
            </StatControl>
            <StatControl icon={<Footprints size={16} className="text-electric-400" />}>
              <NumberStepper
                value={event.assists}
                onChange={(assists) => onChange({ assists })}
                label={`asistencias de ${player.full_name}`}
                tone="electric"
              />
            </StatControl>
            <div className="flex gap-1.5">
              <ToggleIcon
                pressed={event.yellow_card}
                onToggle={() => onChange({ yellow_card: !event.yellow_card })}
                label={`Amarilla para ${player.full_name}`}
                activeClass="border-amber-400/60 bg-amber-400/15 text-amber-400"
              >
                <CardIcon size={18} filled={event.yellow_card} />
              </ToggleIcon>
              <ToggleIcon
                pressed={event.red_card}
                onToggle={() => onChange({ red_card: !event.red_card })}
                label={`Roja para ${player.full_name}`}
                activeClass="border-red-500/60 bg-red-500/15 text-red-500"
              >
                <CardIcon size={18} filled={event.red_card} />
              </ToggleIcon>
              <ToggleIcon
                pressed={event.clean_sheet}
                onToggle={() => onChange({ clean_sheet: !event.clean_sheet })}
                label={`Valla invicta para ${player.full_name}`}
                activeClass="border-emerald-400/60 bg-emerald-400/15 text-emerald-300"
              >
                <GloveIcon size={18} />
              </ToggleIcon>
            </div>
          </div>

          {event.is_starter && substituteOptions && onSubstitute && (
            <label className="mt-3 flex items-center gap-2">
              <ArrowDown size={16} className="flex-shrink-0 text-red-400" aria-hidden="true" />
              <span className="flex-shrink-0 text-xs font-medium text-white/60">Sustituido por</span>
              <select
                value={event.replaced_player_id ?? ''}
                onChange={(e) => onSubstitute(e.target.value)}
                className="min-w-0 flex-1"
              >
                <option value="">Jugó todo el partido</option>
                {substituteOptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.full_name} ({sub.preferred_position})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </li>
  );
}

// Compact icons for what the player did, visible while the row is collapsed
function EventSummary({ event }: { event: PlayerMatchPerformance }) {
  const items: ReactNode[] = [];
  if (event.goals > 0) {
    items.push(
      <span key="g" className="flex items-center gap-0.5 text-neon-300">
        <BallIcon size={13} />
        {event.goals > 1 && event.goals}
      </span>
    );
  }
  if (event.assists > 0) {
    items.push(
      <span key="a" className="flex items-center gap-0.5 text-electric-300">
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

function StatControl({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden="true">{icon}</span>
      {children}
    </div>
  );
}

interface ToggleIconProps {
  pressed: boolean;
  onToggle: () => void;
  label: string;
  activeClass: string;
  children: ReactNode;
}

function ToggleIcon({ pressed, onToggle, label, activeClass, children }: ToggleIconProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={clsx(
        'flex h-10 w-10 items-center justify-center rounded-xl border transition-colors active:scale-95',
        pressed ? activeClass : 'border-pitch-600 bg-pitch-900 text-white/35 hover:text-white/70'
      )}
    >
      {children}
    </button>
  );
}
