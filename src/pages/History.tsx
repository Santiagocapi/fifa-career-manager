// ============================================================
// src/pages/History.tsx
// Season archive: pick a season to see its balance, the most
// influential players, the trophy cabinet and a squad snapshot.
// ============================================================

import { useState } from 'react';
import { History as HistoryIcon, Lock, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { useSeasons } from '../hooks/useSeasons';
import { useTrophies } from '../hooks/useTrophies';
import { usePlayers } from '../hooks/usePlayers';
import { useMatches } from '../hooks/useMatches';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import InlineAlert from '../components/ui/InlineAlert';
import { useConfirm } from '../components/ui/confirm';
import SeasonSummary from '../components/history/SeasonSummary';
import TrophyCabinet from '../components/history/TrophyCabinet';
import SeasonRosterTable from '../components/history/SeasonRosterTable';
import TrophyFormSheet, { type TrophyFormData } from '../components/history/TrophyFormSheet';
import type { CreateTrophyDto, Trophy } from '../types/database';

export default function History() {
  const { activeCareer, activeSeason } = useAppStore();
  const { seasons, loading: seasonsLoading } = useSeasons(activeCareer?.id ?? null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const confirm = useConfirm();

  const viewingSeasonId = selectedSeasonId ?? activeSeason?.id ?? seasons[seasons.length - 1]?.id ?? null;
  const viewingSeason = seasons.find((s) => s.id === viewingSeasonId);
  // A closed season is read-only
  const readOnly = viewingSeason?.is_closed ?? false;

  const { trophies, error: trophiesError, addTrophy, deleteTrophy } = useTrophies(viewingSeasonId);
  const { players: seasonPlayers } = usePlayers(activeCareer?.id ?? null, viewingSeasonId);
  const { matches: seasonMatches, loading: matchesLoading } = useMatches(viewingSeasonId);

  const handleAddTrophy = async (data: TrophyFormData) => {
    if (!viewingSeasonId) return;
    const isIndividual = data.trophy_type === 'individual';
    const dto: CreateTrophyDto = {
      season_id: viewingSeasonId,
      trophy_name: data.trophy_name.trim(),
      trophy_type: data.trophy_type,
      // For individual awards `icon` keeps the recipient's player id
      icon: isIndividual && data.recipient_id ? data.recipient_id : null,
    };
    const created = await addTrophy(dto);
    if (created) setFormOpen(false);
  };

  const handleDeleteTrophy = async (trophy: Trophy) => {
    const confirmed = await confirm({
      title: `¿Eliminar ${trophy.trophy_name}?`,
      description: 'Se quitará de la vitrina de esta temporada.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });
    if (confirmed) await deleteTrophy(trophy.id);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Historial"
        subtitle="Temporadas, trofeos y rendimiento de la plantilla"
        primaryAction={
          viewingSeason && !readOnly
            ? { label: 'Añadir trofeo', icon: Plus, onClick: () => setFormOpen(true) }
            : undefined
        }
      />

      {trophiesError && <InlineAlert>{trophiesError}</InlineAlert>}

      {seasonsLoading ? (
        <div className="skeleton h-12 rounded-2xl" />
      ) : seasons.length === 0 ? (
        <EmptyState
          className="card"
          icon={HistoryIcon}
          title="Todavía no hay temporadas"
          description="Cuando crees tu primera temporada aparecerá aquí con sus trofeos y estadísticas."
        />
      ) : (
        <>
          {/* Season picker: newest first, scrolls sideways on phones */}
          <div role="tablist" aria-label="Temporadas" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {seasons
              .slice()
              .reverse()
              .map((season) => {
                const selected = season.id === viewingSeasonId;
                return (
                  <button
                    key={season.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setSelectedSeasonId(season.id)}
                    className={clsx(
                      'flex flex-shrink-0 flex-col items-start rounded-2xl border px-4 py-2 text-left transition-colors',
                      selected ? 'border-neon-400/50 bg-neon-400/10' : 'border-pitch-600 bg-pitch-800 hover:border-pitch-500'
                    )}
                  >
                    <span className={clsx('text-sm font-bold', selected ? 'text-white' : 'text-white/75')}>
                      {season.year_label}
                    </span>
                    <span className="flex items-center gap-1 text-2xs text-white/50">
                      {season.is_closed && <Lock size={10} />}
                      Temporada {season.season_number} · {season.is_closed ? 'Cerrada' : 'En curso'}
                    </span>
                  </button>
                );
              })}
          </div>

          {viewingSeason && (
            <>
              {readOnly && (
                <InlineAlert tone="info">Esta temporada está cerrada: puedes consultarla pero no modificarla.</InlineAlert>
              )}

              <SeasonSummary season={viewingSeason} players={seasonPlayers} matches={seasonMatches} loading={matchesLoading} />

              <TrophyCabinet
                trophies={trophies}
                players={seasonPlayers}
                onDeleteTrophy={readOnly ? undefined : handleDeleteTrophy}
              />

              <section className="card overflow-hidden" aria-labelledby="roster-title">
                <h2 id="roster-title" className="section-title px-4 pb-2 pt-4">
                  Plantilla de la temporada
                </h2>
                <SeasonRosterTable players={seasonPlayers} />
              </section>
            </>
          )}
        </>
      )}

      <TrophyFormSheet
        open={formOpen}
        seasonLabel={viewingSeason?.year_label ?? ''}
        players={seasonPlayers}
        onClose={() => setFormOpen(false)}
        onSubmit={handleAddTrophy}
      />
    </div>
  );
}
