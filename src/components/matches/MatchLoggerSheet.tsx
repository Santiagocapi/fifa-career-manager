// ============================================================
// src/components/matches/MatchLoggerSheet.tsx
// Log or edit a match in three steps: result, starters and
// substitutes. Built for one-handed use next to the console:
// big steppers, the starting XI pre-filled from Tácticas and
// "Guardar" always reachable at the bottom.
// ============================================================

import { useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Footprints, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { MatchWithDetails, PlayerWithStats } from '../../types/database';
import { COMPETITIONS, sortPlayersByPosition } from '../../lib/constants';
import Sheet from '../ui/Sheet';
import Field from '../ui/Field';
import InlineAlert from '../ui/InlineAlert';
import NumberStepper from '../ui/NumberStepper';
import SegmentedTabs from '../ui/SegmentedTabs';
import { useConfirm } from '../ui/confirm';
import { BallIcon, CardIcon, GloveIcon } from '../icons/FootballIcons';
import PlayerEventRow from './PlayerEventRow';
import PlayerPicker from '../player/PlayerPicker';
import {
  applyCleanSheets,
  applySubstitution,
  buildEditMatchEvents,
  buildNewMatchEvents,
  countAssignedGoals,
  setPlayed,
  type MatchEvents,
  type PlayerMatchPerformance,
} from './matchEvents';

export interface MatchFormPayload {
  opponent: string;
  competition: string;
  team_score: number;
  opponent_score: number;
  mvp_player_id: string | null;
  playerEvents: PlayerMatchPerformance[];
}

interface MatchLoggerSheetProps {
  open: boolean;
  /** Match being edited, or null to log a new one */
  match: MatchWithDetails | null;
  players: PlayerWithStats[];
  /** Starting XI saved in Tácticas for this season (null for empty slots) */
  lineupIds: (string | null)[];
  teamName: string;
  saveError: string | null;
  onClose: () => void;
  onSave: (payload: MatchFormPayload) => Promise<boolean>;
  onDelete: (match: MatchWithDetails) => Promise<void>;
}

type Step = 'result' | 'starters' | 'bench';
const STEPS: Step[] = ['result', 'starters', 'bench'];

export default function MatchLoggerSheet(props: MatchLoggerSheetProps) {
  // Mount the form only while open so every opening starts from fresh state
  if (!props.open) return null;
  return <MatchLogger {...props} />;
}

function MatchLogger({
  match,
  players,
  lineupIds,
  teamName,
  saveError,
  onClose,
  onSave,
  onDelete,
}: Omit<MatchLoggerSheetProps, 'open'>) {
  const confirm = useConfirm();
  const opponentRef = useRef<HTMLInputElement>(null);
  const sortedPlayers = useMemo(() => sortPlayersByPosition(players), [players]);

  const [step, setStep] = useState<Step>('result');
  const [opponent, setOpponent] = useState(match?.opponent ?? '');
  const [opponentError, setOpponentError] = useState<string | null>(null);
  const [competition, setCompetition] = useState(match?.competition || 'League');
  const [teamScore, setTeamScore] = useState(match?.team_score ?? 0);
  const [opponentScore, setOpponentScore] = useState(match?.opponent_score ?? 0);
  const [mvpPlayerId, setMvpPlayerId] = useState(match?.mvp_player_id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [events, setEvents] = useState<MatchEvents>(() => {
    // Starters come from the lineup saved in Tácticas for this season
    const starterIds = new Set(lineupIds.filter((id): id is string => id !== null));
    if (match) return buildEditMatchEvents(players, match, starterIds);
    // No lineup yet: take the first eleven by position as a starting point
    if (starterIds.size === 0) sortedPlayers.slice(0, 11).forEach((p) => starterIds.add(p.id));
    return buildNewMatchEvents(players, starterIds);
  });

  // Rows open to edit goals/cards; ones that already have something start open
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        Object.values(events)
          .filter((e) => e.goals > 0 || e.assists > 0 || e.yellow_card || e.red_card)
          .map((e) => e.player_id)
      )
  );

  const toggleExpanded = (playerId: string, open?: boolean) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (open ?? !next.has(playerId)) next.add(playerId);
      else next.delete(playerId);
      return next;
    });

  const updateEvents = (next: MatchEvents) => {
    setEvents(next);
    setDirty(true);
  };

  const starters = sortedPlayers.filter((p) => events[p.id]?.is_starter);
  const bench = sortedPlayers.filter((p) => !events[p.id]?.is_starter);
  const assignedGoals = countAssignedGoals(events);
  const stepIndex = STEPS.indexOf(step);

  const handleOpponentScoreChange = (score: number) => {
    setOpponentScore(score);
    updateEvents(applyCleanSheets(events, players, score));
  };

  const requestClose = async () => {
    if (
      dirty &&
      !(await confirm({
        title: '¿Descartar el partido?',
        description: 'Perderás lo que has anotado.',
        confirmLabel: 'Descartar',
        tone: 'danger',
      }))
    ) {
      return;
    }
    onClose();
  };

  const handleSave = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!opponent.trim()) {
      setOpponentError('Escribe el nombre del rival');
      setStep('result');
      requestAnimationFrame(() => opponentRef.current?.focus());
      return;
    }

    setSubmitting(true);
    const saved = await onSave({
      opponent: opponent.trim(),
      competition: competition || 'League',
      team_score: teamScore,
      opponent_score: opponentScore,
      mvp_player_id: mvpPlayerId || null,
      // Every player's event is sent; `played` decides who gets a match played
      playerEvents: Object.values(events),
    });
    setSubmitting(false);
    if (saved) onClose();
  };

  const handleDelete = async () => {
    if (!match) return;
    const confirmed = await confirm({
      title: `¿Eliminar el partido contra ${match.opponent}?`,
      description: 'Se quitarán sus goles, asistencias, tarjetas y partidos jugados de las estadísticas.',
      confirmLabel: 'Eliminar partido',
      tone: 'danger',
    });
    if (!confirmed) return;
    await onDelete(match);
    onClose();
  };

  const renderRows = (list: PlayerWithStats[]) => (
    <ul className="flex flex-col gap-2">
      {list.map((player) => {
        const event = events[player.id];
        if (!event) return null;
        // A substitute can replace only one starter
        const substituteOptions = bench.filter((b) => {
          const benchEvent = events[b.id];
          return !b.stats?.is_injured && (!benchEvent?.substituted_in || benchEvent.replaced_player_id === player.id);
        });
        return (
          <PlayerEventRow
            key={player.id}
            player={player}
            event={event}
            expanded={expanded.has(player.id)}
            onToggleExpanded={() => toggleExpanded(player.id)}
            onChange={(patch) => updateEvents({ ...events, [player.id]: { ...event, ...patch } })}
            onPlayedChange={(played) => {
              updateEvents(setPlayed(events, players, opponentScore, player.id, played));
              // A substitute who just came on usually needs a goal or card next
              if (!event.is_starter || !played) toggleExpanded(player.id, played);
            }}
            substituteOptions={event.is_starter ? substituteOptions : undefined}
            onSubstitute={(subId) => updateEvents(applySubstitution(events, players, opponentScore, player.id, subId))}
            replacedName={players.find((p) => p.id === event.replaced_player_id)?.full_name}
          />
        );
      })}
    </ul>
  );

  return (
    <Sheet
      open
      onClose={requestClose}
      title={match ? 'Editar partido' : 'Registrar partido'}
      size="lg"
      tall
      closeOnBackdrop={false}
      toolbar={
        <SegmentedTabs
          ariaLabel="Pasos del registro"
          fullWidth
          value={step}
          onChange={setStep}
          items={[
            { value: 'result', label: 'Resultado' },
            { value: 'starters', label: 'Titulares', count: starters.length },
            { value: 'bench', label: 'Suplentes', count: bench.filter((p) => events[p.id]?.played).length },
          ]}
        />
      }
      footer={
        <div className="flex gap-3">
          {stepIndex < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep(STEPS[stepIndex + 1])} className="btn-secondary flex-1">
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button type="button" onClick={() => setStep(STEPS[stepIndex - 1])} className="btn-secondary flex-1">
              <ChevronLeft size={18} /> Atrás
            </button>
          )}
          <button type="submit" form="match-form" disabled={submitting} className="btn-primary flex-1">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Guardar
          </button>
        </div>
      }
    >
      <form id="match-form" onSubmit={handleSave} noValidate className="flex flex-col gap-5">
        {saveError && <InlineAlert>No se pudo guardar: {saveError}</InlineAlert>}

        {step === 'result' && (
          <>
            <Field label="Rival" required error={opponentError ?? undefined}>
              <input
                ref={opponentRef}
                value={opponent}
                onChange={(e) => {
                  setOpponent(e.target.value);
                  setOpponentError(null);
                  setDirty(true);
                }}
                placeholder="River Plate"
                autoComplete="off"
                enterKeyHint="done"
                aria-invalid={opponentError ? true : undefined}
              />
            </Field>

            <div role="radiogroup" aria-label="Competición" className="field">
              <span className="field-label">Competición</span>
              <div className="flex flex-wrap gap-2">
                {COMPETITIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={competition === c.value}
                    onClick={() => {
                      setCompetition(c.value);
                      setDirty(true);
                    }}
                    className="chip h-10"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <section aria-label="Marcador" className="rounded-2xl border border-pitch-600 bg-pitch-900/60 p-3 sm:p-4">
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <ScoreColumn label={teamName}>
                  <NumberStepper
                    size="lg"
                    tone="neon"
                    value={teamScore}
                    onChange={(score) => {
                      setTeamScore(score);
                      setDirty(true);
                    }}
                    label={`goles de ${teamName}`}
                  />
                </ScoreColumn>
                <ScoreColumn label={opponent.trim() || 'Rival'}>
                  <NumberStepper
                    size="lg"
                    tone="red"
                    value={opponentScore}
                    onChange={handleOpponentScoreChange}
                    label="goles del rival"
                  />
                </ScoreColumn>
              </div>
              {opponentScore === 0 && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-emerald-300">
                  <ShieldCheck size={14} className="flex-shrink-0" />
                  Valla invicta automática para portero y defensas
                </p>
              )}
            </section>

            <div className="field">
              <span className="field-label">MVP del partido</span>
              <PlayerPicker
                label="MVP del partido"
                emptyLabel="Sin MVP"
                value={mvpPlayerId}
                onChange={(id) => {
                  setMvpPlayerId(id);
                  setDirty(true);
                }}
                groups={[
                  { label: 'Titulares', players: starters },
                  { label: 'Suplentes', players: bench },
                ]}
              />
            </div>

            {match && (
              <button type="button" onClick={handleDelete} className="btn-ghost self-start text-red-300 hover:bg-red-500/10">
                <Trash2 size={18} /> Eliminar partido
              </button>
            )}
          </>
        )}

        {step !== 'result' && (
          <>
            <div className="flex flex-col gap-2">
              <GoalsCheck assigned={assignedGoals} total={teamScore} />
              <Legend />
            </div>

            {step === 'starters' &&
              (starters.length > 0 ? (
                <>
                  <p className="text-xs text-white/50">Toca un jugador para anotar sus goles, asistencias, tarjetas o el cambio.</p>
                  {renderRows(starters)}
                </>
              ) : (
                <p className="py-6 text-center text-sm text-white/50">
                  No hay titulares: arma el once en Tácticas o marca a los suplentes que jugaron.
                </p>
              ))}

            {step === 'bench' &&
              (bench.length > 0 ? (
                <>
                  <p className="text-xs text-white/50">
                    Activa a quien entró al partido, o elige el cambio desde la ficha del titular al que sustituyó.
                  </p>
                  {renderRows(bench)}
                </>
              ) : (
                <p className="py-6 text-center text-sm text-white/50">Toda la plantilla fue titular.</p>
              ))}
          </>
        )}
      </form>
    </Sheet>
  );
}

// A scoreboard row on phones (name left, stepper right), a column from sm up
function ScoreColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 sm:flex-col sm:justify-start sm:gap-2">
      <span className="min-w-0 truncate text-sm font-bold uppercase tracking-wide text-white/70 sm:max-w-full sm:text-xs sm:text-white/55" translate="no">
        {label}
      </span>
      {children}
    </div>
  );
}

function GoalsCheck({ assigned, total }: { assigned: number; total: number }) {
  return (
    <div
      role="status"
      className={clsx(
        'flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm',
        assigned === total
          ? 'border-neon-400/30 bg-neon-400/10 text-neon-200'
          : assigned > total
            ? 'border-red-400/40 bg-red-500/10 text-red-300'
            : 'border-pitch-600 bg-pitch-900/60 text-white/70'
      )}
    >
      <span className="flex items-center gap-2">
        <BallIcon size={16} />
        Goles asignados
      </span>
      <span className="font-bold tabular-nums">
        {assigned} de {total}
        {assigned > total && <span className="ml-1 font-medium">· sobran {assigned - total}</span>}
      </span>
    </div>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-white/50" aria-label="Leyenda">
      <li className="flex items-center gap-1">
        <BallIcon size={13} className="text-neon-400" /> Goles
      </li>
      <li className="flex items-center gap-1">
        <Footprints size={13} className="text-electric-400" /> Asistencias
      </li>
      <li className="flex items-center gap-1">
        <CardIcon size={13} filled className="text-amber-400" /> Amarilla
      </li>
      <li className="flex items-center gap-1">
        <CardIcon size={13} filled className="text-red-500" /> Roja
      </li>
      <li className="flex items-center gap-1">
        <GloveIcon size={13} className="text-emerald-300" /> Valla invicta
      </li>
    </ul>
  );
}
