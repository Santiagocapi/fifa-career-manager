// ============================================================
// src/pages/Dashboard.tsx
// Career home: season balance, squad numbers, season leaders,
// latest results, a shortcut to log the next match and the
// close-season assistant.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Swords } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { usePlayers } from '../hooks/usePlayers';
import { useSeasons } from '../hooks/useSeasons';
import { useTrophies } from '../hooks/useTrophies';
import { useMatches } from '../hooks/useMatches';
import { formatValue } from '../lib/constants';
import { getGameVersionShort } from '../lib/gameVersions';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import SeasonRecord from '../components/matches/SeasonRecord';
import MatchListItem from '../components/matches/MatchListItem';
import LeadersCard from '../components/dashboard/LeadersCard';
import NewSeasonCard from '../components/dashboard/NewSeasonCard';
import SeasonsCard from '../components/dashboard/SeasonsCard';
import InlineAlert from '../components/ui/InlineAlert';
import CloseSeasonSheet from '../components/season/CloseSeasonSheet';
import type { ClosingPlayer } from '../hooks/useSeasons';

export default function Dashboard() {
  const { activeCareer, activeSeason } = useAppStore();
  const { players, loading: playersLoading } = usePlayers(activeCareer?.id ?? null, activeSeason?.id ?? null);
  const {
    seasons,
    createSeason,
    closeSeason,
    loading: seasonsLoading,
    error: seasonsError,
  } = useSeasons(activeCareer?.id ?? null);
  const { trophies } = useTrophies(activeSeason?.id ?? null);
  const { matches, loading: matchesLoading } = useMatches(activeSeason?.id ?? null);
  const navigate = useNavigate();
  const [closeOpen, setCloseOpen] = useState(false);
  // Shown after closing: "<closed> cerrada, empieza <next>"
  const [closedNotice, setClosedNotice] = useState<{ closed: string; next: string } | null>(null);

  if (!activeCareer) return null; // AppLayout shows the "pick a career" state

  const canLogMatch = !!activeSeason && !activeSeason.is_closed;
  const injuredCount = players.filter((p) => p.stats?.is_injured).length;
  const handleCloseSeason = async (nextYearLabel: string, closingPlayers: ClosingPlayer[]) => {
    if (!activeSeason) return false;
    const closed = activeSeason.year_label;
    const nextSeason = await closeSeason(activeSeason.id, nextYearLabel, closingPlayers);
    if (!nextSeason) return false;
    setClosedNotice({ closed, next: nextSeason.year_label });
    return true;
  };
  const squadValue = players.reduce(
    (sum, p) => sum + (p.stats?.market_value_end ?? p.stats?.market_value_start ?? 0),
    0
  );

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title={activeCareer.club_name}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {activeCareer.game_version && (
              <span translate="no" className="badge border-electric-400/30 bg-electric-400/10 text-electric-300">
                {getGameVersionShort(activeCareer.game_version)}
              </span>
            )}
            {activeCareer.league && <span>{activeCareer.league}</span>}
            {activeCareer.league && activeSeason && <span aria-hidden="true">·</span>}
            {activeSeason && (
              <span>
                Temporada {activeSeason.season_number} · {activeSeason.year_label}
              </span>
            )}
            {activeSeason?.is_closed && (
              <span className="badge border-white/10 bg-white/5 text-white/50">Cerrada</span>
            )}
          </span>
        }
        primaryAction={
          canLogMatch
            ? {
                label: 'Registrar partido',
                icon: Plus,
                onClick: () => navigate('/stats', { state: { openLogger: true } }),
              }
            : undefined
        }
      />

      {closedNotice && (
        <InlineAlert tone="success">
          Temporada {closedNotice.closed} cerrada. Ya puedes registrar los partidos de {closedNotice.next}.
        </InlineAlert>
      )}

      {!activeSeason && !seasonsLoading && <NewSeasonCard seasons={seasons} onCreate={createSeason} />}

      {activeSeason && (
        <>
          <SeasonRecord matches={matches} loading={matchesLoading} />

          {/* Squad numbers */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatTile
              label="Plantilla"
              value={players.length}
              detail={injuredCount > 0 ? `${injuredCount} lesionado${injuredCount === 1 ? '' : 's'}` : 'sin lesionados'}
              detailClass={injuredCount > 0 ? 'text-red-300' : undefined}
              loading={playersLoading}
              to="/squad"
            />
            <StatTile label="Valor" value={formatValue(squadValue)} detail="de mercado" loading={playersLoading} to="/squad" />
            <StatTile label="Trofeos" value={trophies.length} detail="esta temporada" to="/history" />
          </div>

          <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
            <LeadersCard players={players} matches={matches} loading={playersLoading || matchesLoading} />

            <section className="card p-4 sm:p-5" aria-labelledby="recent-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="recent-title" className="section-title">
                  Últimos partidos
                </h2>
                {matches.length > 0 && (
                  <Link to="/stats" className="flex items-center gap-0.5 text-xs font-semibold text-neon-400">
                    Ver todos <ChevronRight size={14} />
                  </Link>
                )}
              </div>
              {matchesLoading ? (
                <div className="mt-4 flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-12 rounded-xl" />
                  ))}
                </div>
              ) : matches.length === 0 ? (
                <EmptyState
                  compact
                  icon={Swords}
                  title="Aún no hay partidos"
                  description="Registra tu primer partido al terminarlo en la consola."
                  action={
                    canLogMatch && (
                      <button
                        type="button"
                        onClick={() => navigate('/stats', { state: { openLogger: true } })}
                        className="btn-secondary"
                      >
                        <Plus size={18} /> Registrar partido
                      </button>
                    )
                  }
                />
              ) : (
                <ul className="mt-1 divide-y divide-pitch-700/70">
                  {matches.slice(0, 5).map((match) => (
                    <li key={match.id}>
                      <MatchListItem match={match} to={`/stats/${match.id}`} compact />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      {seasons.length > 0 && (
        <SeasonsCard
          seasons={seasons}
          closableSeason={canLogMatch ? activeSeason : null}
          closeDisabled={playersLoading || matchesLoading}
          onCloseSeason={() => {
            setClosedNotice(null);
            setCloseOpen(true);
          }}
        />
      )}

      {activeSeason && (
        <CloseSeasonSheet
          open={closeOpen}
          season={activeSeason}
          seasons={seasons}
          players={players}
          matches={matches}
          saveError={seasonsError}
          onClose={() => setCloseOpen(false)}
          onConfirm={handleCloseSeason}
        />
      )}
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  detail: string;
  detailClass?: string;
  loading?: boolean;
  to: string;
}

function StatTile({ label, value, detail, detailClass, loading = false, to }: StatTileProps) {
  return (
    <Link to={to} className="card-interactive flex min-w-0 flex-col px-2.5 py-3 sm:p-4">
      <span className="text-2xs font-semibold uppercase tracking-wide text-white/50">{label}</span>
      {loading ? (
        <span className="skeleton mt-1.5 h-7 w-12 rounded" />
      ) : (
        <span className="mt-1 truncate text-lg font-black tabular-nums text-white sm:text-2xl">{value}</span>
      )}
      <span className={clsx('mt-0.5 text-2xs leading-tight text-white/45', detailClass)}>{detail}</span>
    </Link>
  );
}
