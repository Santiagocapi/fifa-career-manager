// ============================================================
// src/components/season/CloseSeasonSheet.tsx
// Close-season assistant in two steps:
//   1. Plantilla: final OVR and value of each player, and who
//      leaves the club.
//   2. Resumen: name of the next season and what will happen.
// Confirming calls close_season, which closes the season and
// starts the next one with the same squad in one transaction.
// ============================================================

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Lock, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { MatchWithDetails, PlayerWithStats, Season } from '../../types/database';
import type { ClosingPlayer } from '../../hooks/useSeasons';
import { sortPlayersByPosition } from '../../lib/constants';
import Sheet from '../ui/Sheet';
import Field from '../ui/Field';
import InlineAlert from '../ui/InlineAlert';
import SegmentedTabs from '../ui/SegmentedTabs';
import { useConfirm } from '../ui/confirm';
import PositionBadge from '../player/PositionBadge';
import { summarizeMatches } from '../matches/matchStats';
import ClosingPlayerRow from './ClosingPlayerRow';
import { suggestNextSeasonLabel } from './seasonLabel';
import {
  buildClosingPlayers,
  buildInitialDrafts,
  findInvalidValues,
  startOvr,
  type ClosingDraft,
  type ClosingDrafts,
} from './closingDrafts';

interface CloseSeasonSheetProps {
  open: boolean;
  season: Season;
  seasons: Season[];
  players: PlayerWithStats[];
  matches: MatchWithDetails[];
  saveError: string | null;
  onClose: () => void;
  onConfirm: (nextYearLabel: string, players: ClosingPlayer[]) => Promise<boolean>;
}

type Step = 'squad' | 'summary';

export default function CloseSeasonSheet(props: CloseSeasonSheetProps) {
  // Mount the form only while open so every opening starts from fresh state
  if (!props.open) return null;
  return <CloseSeasonForm {...props} />;
}

function CloseSeasonForm({ season, seasons, players, matches, saveError, onClose, onConfirm }: Omit<CloseSeasonSheetProps, 'open'>) {
  const confirm = useConfirm();
  const sortedPlayers = useMemo(() => sortPlayersByPosition(players), [players]);

  const [step, setStep] = useState<Step>('squad');
  const [drafts, setDrafts] = useState<ClosingDrafts>(() => buildInitialDrafts(players));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [nextLabel, setNextLabel] = useState(() => suggestNextSeasonLabel(seasons));
  const [labelError, setLabelError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const invalidIds = useMemo(() => new Set(findInvalidValues(drafts)), [drafts]);
  const record = useMemo(() => summarizeMatches(matches), [matches]);
  const leaving = sortedPlayers.filter((p) => drafts[p.id]?.leaves);
  const staying = sortedPlayers.length - leaving.length;
  const risers = useMemo(
    () =>
      sortedPlayers
        .flatMap((p) => {
          const start = startOvr(p);
          const draft = drafts[p.id];
          return start !== null && draft && draft.ovr > start ? [{ player: p, delta: draft.ovr - start }] : [];
        })
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 3),
    [sortedPlayers, drafts]
  );

  const updateDraft = (playerId: string, patch: Partial<ClosingDraft>) => {
    setDrafts((current) => ({ ...current, [playerId]: { ...current[playerId], ...patch } }));
    setDirty(true);
  };

  const toggleExpanded = (playerId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });

  // A value that cannot be read sends the user back to the row to fix it
  const showInvalidRows = () => {
    setStep('squad');
    setExpanded((current) => new Set([...current, ...invalidIds]));
    const firstInvalid = sortedPlayers.find((p) => invalidIds.has(p.id));
    if (firstInvalid) {
      requestAnimationFrame(() =>
        document.querySelector<HTMLInputElement>(`#closing-player-${firstInvalid.id} input`)?.focus()
      );
    }
  };

  const goToSummary = () => {
    if (invalidIds.size > 0) showInvalidRows();
    else setStep('summary');
  };

  const requestClose = async () => {
    if (
      dirty &&
      !(await confirm({
        title: '¿Salir sin cerrar la temporada?',
        description: 'Perderás las medias y valores que has anotado.',
        confirmLabel: 'Salir',
        tone: 'danger',
      }))
    ) {
      return;
    }
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (invalidIds.size > 0) {
      showInvalidRows();
      return;
    }
    if (!nextLabel.trim()) {
      setLabelError('Ponle nombre a la siguiente temporada');
      setStep('summary');
      return;
    }

    setSubmitting(true);
    const closed = await onConfirm(nextLabel.trim(), buildClosingPlayers(drafts));
    setSubmitting(false);
    if (closed) onClose();
  };

  return (
    <Sheet
      open
      onClose={requestClose}
      title={`Cerrar temporada ${season.year_label}`}
      description={step === 'squad' ? 'Anota la media final de cada jugador. Toca un nombre para el valor o si deja el club.' : undefined}
      size="lg"
      tall
      closeOnBackdrop={false}
      toolbar={
        <SegmentedTabs
          ariaLabel="Pasos del cierre"
          fullWidth
          value={step}
          onChange={(next) => (next === 'summary' ? goToSummary() : setStep(next))}
          items={[
            { value: 'squad', label: 'Plantilla', count: sortedPlayers.length },
            { value: 'summary', label: 'Resumen' },
          ]}
        />
      }
      footer={
        <div className="flex gap-3">
          {step === 'squad' ? (
            <>
              <button type="button" onClick={requestClose} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="button" onClick={goToSummary} className="btn-primary flex-1">
                Siguiente <ChevronRight size={18} />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setStep('squad')} className="btn-secondary flex-1">
                <ChevronLeft size={18} /> Atrás
              </button>
              <button type="submit" form="close-season-form" disabled={submitting} className="btn-primary flex-1">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                Cerrar temporada
              </button>
            </>
          )}
        </div>
      }
    >
      <form id="close-season-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {saveError && <InlineAlert>No se pudo cerrar la temporada: {saveError}</InlineAlert>}

        {step === 'squad' &&
          (sortedPlayers.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/45">
              No hay jugadores en la plantilla. Puedes cerrar la temporada igualmente.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sortedPlayers.map((player) => {
                const draft = drafts[player.id];
                if (!draft) return null;
                return (
                  <ClosingPlayerRow
                    key={player.id}
                    player={player}
                    draft={draft}
                    expanded={expanded.has(player.id)}
                    invalid={invalidIds.has(player.id)}
                    onToggleExpanded={() => toggleExpanded(player.id)}
                    onChange={(patch) => updateDraft(player.id, patch)}
                  />
                );
              })}
            </ul>
          ))}

        {step === 'summary' && (
          <>
            <Field
              label="Siguiente temporada"
              required
              error={labelError ?? undefined}
              hint="Empezará en cuanto cierres esta."
            >
              <input
                value={nextLabel}
                placeholder="2026/2027"
                autoComplete="off"
                onChange={(event) => {
                  setNextLabel(event.target.value);
                  setLabelError(null);
                  setDirty(true);
                }}
              />
            </Field>

            <div className="grid grid-cols-3 gap-2">
              <SummaryTile
                label="Partidos"
                value={record.played}
                detail={`${record.wins}V · ${record.draws}E · ${record.losses}D`}
              />
              <SummaryTile label="Siguen" value={staying} detail="en la plantilla" />
              <SummaryTile
                label="Se van"
                value={leaving.length}
                detail={leaving.length === 1 ? 'jugador' : 'jugadores'}
                tone={leaving.length > 0 ? 'red' : undefined}
              />
            </div>

            {risers.length > 0 && (
              <section aria-labelledby="risers-title">
                <h3 id="risers-title" className="section-title mb-2 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-neon-400" /> Los que más crecieron
                </h3>
                <ul className="flex flex-col gap-1.5">
                  {risers.map(({ player, delta }) => (
                    <li key={player.id} className="flex items-center gap-2.5 rounded-xl bg-pitch-800 px-3 py-2">
                      <PositionBadge position={player.preferred_position} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white" translate="no">
                        {player.full_name}
                      </span>
                      <span className="text-sm tabular-nums text-white/55">
                        {startOvr(player)} → <span className="font-bold text-white">{drafts[player.id]?.ovr}</span>
                      </span>
                      <span className="w-8 text-right text-sm font-black tabular-nums text-neon-300">+{delta}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {leaving.length > 0 && (
              <section aria-labelledby="leaving-title">
                <h3 id="leaving-title" className="section-title mb-2">
                  Dejan el club
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                  {leaving.map((player) => (
                    <li
                      key={player.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 py-1 pl-1 pr-3 text-xs font-semibold text-red-200"
                    >
                      <PositionBadge position={player.preferred_position} />
                      <span translate="no">{player.full_name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <InlineAlert tone="info">
              <p className="font-semibold">Al cerrar la temporada {season.year_label}:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-electric-200/90">
                <li>Quedará guardada en el Historial y ya no se podrá modificar.</li>
                <li>
                  Empezará {nextLabel.trim() || 'la siguiente temporada'} con los {staying} jugadores que siguen, su media y
                  su valor finales.
                </li>
                <li>Los jugadores que siguen cumplen un año más.</li>
                <li>Tu once titular y tu formación pasan a la nueva temporada.</li>
              </ul>
            </InlineAlert>
          </>
        )}
      </form>
    </Sheet>
  );
}

interface SummaryTileProps {
  label: string;
  value: number;
  detail: string;
  tone?: 'red';
}

function SummaryTile({ label, value, detail, tone }: SummaryTileProps) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-pitch-700 bg-pitch-800 px-2.5 py-3">
      <span className="text-2xs font-semibold uppercase tracking-wide text-white/50">{label}</span>
      <span className={clsx('text-xl font-black tabular-nums', tone === 'red' ? 'text-red-300' : 'text-white')}>
        {value}
      </span>
      <span className="truncate text-2xs text-white/45">{detail}</span>
    </div>
  );
}
