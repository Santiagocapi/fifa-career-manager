// ============================================================
// src/pages/Stats.tsx
// Matches of the season and their stats: match list (tap to
// edit), player leaderboard, MVPs, chart and head-to-head.
// Logging a match happens in MatchLoggerSheet.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarPlus, ListOrdered, Plus, Swords, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { usePlayers } from '../hooks/usePlayers';
import { useMatches } from '../hooks/useMatches';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import InlineAlert from '../components/ui/InlineAlert';
import SegmentedTabs from '../components/ui/SegmentedTabs';
import SeasonRecord from '../components/matches/SeasonRecord';
import MatchListItem from '../components/matches/MatchListItem';
import MatchLoggerSheet, { type MatchFormPayload } from '../components/matches/MatchLoggerSheet';
import Leaderboard from '../components/matches/Leaderboard';
import MvpRanking from '../components/matches/MvpRanking';
import GoalsChart from '../components/matches/GoalsChart';
import H2HTable from '../components/matches/H2HTable';
import { rankMvps } from '../components/matches/matchStats';
import type { MatchWithDetails } from '../types/database';

type StatsTab = 'matches' | 'players' | 'rivals';

export default function Stats() {
  const { activeCareer, activeSeason } = useAppStore();
  const { players, loading: playersLoading, refetch: refetchPlayers, toggleInjured } = usePlayers(
    activeCareer?.id ?? null,
    activeSeason?.id ?? null
  );
  const { matches, h2hRecords, loading: matchesLoading, error, logMatch, updateMatch, deleteMatch } = useMatches(
    activeSeason?.id ?? null
  );
  const location = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState<StatsTab>('matches');
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchWithDetails | null>(null);

  // A closed season is read-only
  const readOnly = activeSeason?.is_closed ?? false;
  const canLog = !!activeSeason && !readOnly && !playersLoading;
  const mvpRanking = useMemo(() => rankMvps(matches, players), [matches, players]);

  const openNewMatch = () => {
    setEditingMatch(null);
    setLoggerOpen(true);
  };

  // "Registrar partido" from other screens lands here with this flag. It waits
  // for the squad to load, since the logger is pre-filled with the players.
  useEffect(() => {
    const state = location.state as { openLogger?: boolean } | null;
    if (!state?.openLogger || !canLog) return;
    setEditingMatch(null);
    setLoggerOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, canLog, navigate]);

  const handleSave = async (payload: MatchFormPayload) => {
    const saved = editingMatch ? await updateMatch(editingMatch.id, payload) : await logMatch(payload);
    if (saved) refetchPlayers();
    return saved;
  };

  const handleDelete = async (match: MatchWithDetails) => {
    await deleteMatch(match.id);
    refetchPlayers();
  };

  if (!activeSeason) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Partidos" />
        <EmptyState
          className="card"
          icon={CalendarPlus}
          title="No hay ninguna temporada en curso"
          description="Crea la temporada desde Inicio para empezar a registrar partidos."
          action={
            <Link to="/dashboard" className="btn-primary">
              Ir a Inicio
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Partidos"
        subtitle={`Temporada ${activeSeason.year_label}`}
        primaryAction={{ label: 'Registrar partido', icon: Plus, onClick: openNewMatch, disabled: !canLog }}
      />

      {error && !loggerOpen && <InlineAlert>{error}</InlineAlert>}

      <SegmentedTabs
        ariaLabel="Secciones de partidos"
        fullWidth
        value={tab}
        onChange={setTab}
        items={[
          { value: 'matches', label: 'Partidos', icon: Swords, count: matches.length },
          { value: 'players', label: 'Jugadores', icon: Users },
          { value: 'rivals', label: 'Rivales', icon: ListOrdered, count: h2hRecords.length },
        ]}
      />

      {tab === 'matches' && (
        <div className="flex flex-col gap-5">
          <SeasonRecord matches={matches} loading={matchesLoading} />

          <section className="card p-2 sm:p-3" aria-label="Partidos de la temporada">
            {matchesLoading ? (
              <div className="flex flex-col gap-2 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-14 rounded-xl" />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <EmptyState
                icon={Swords}
                title="Aún no hay partidos"
                description="Registra cada partido al terminarlo: resultado, goleadores, tarjetas y MVP."
                action={
                  canLog && (
                    <button type="button" onClick={openNewMatch} className="btn-primary">
                      <Plus size={18} /> Registrar partido
                    </button>
                  )
                }
              />
            ) : (
              <>
                {!readOnly && <p className="px-2 pb-1 pt-1 text-xs text-white/45">Toca un partido para editarlo.</p>}
                <ul className="divide-y divide-pitch-700/60">
                  {matches.map((match) => (
                    <li key={match.id}>
                      <MatchListItem
                        match={match}
                        onClick={
                          readOnly
                            ? undefined
                            : () => {
                                setEditingMatch(match);
                                setLoggerOpen(true);
                              }
                        }
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      )}

      {tab === 'players' && (
        <div className="grid items-start gap-5 xl:grid-cols-3">
          <section className="card overflow-hidden xl:col-span-2" aria-labelledby="leaderboard-title">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-2 pt-4">
              <h2 id="leaderboard-title" className="section-title">
                Estadísticas de la plantilla
              </h2>
              <span className="text-xs text-white/45">Toca una columna para ordenar</span>
            </div>
            {playersLoading ? (
              <div className="flex flex-col gap-2 p-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-10 rounded-lg" />
                ))}
              </div>
            ) : players.length === 0 ? (
              <p className="px-4 pb-6 pt-2 text-sm text-white/40">No hay jugadores en esta temporada.</p>
            ) : (
              <Leaderboard players={players} onToggleInjured={toggleInjured} />
            )}
          </section>

          <div className="flex flex-col gap-5">
            <section className="card p-4" aria-labelledby="mvp-title">
              <h2 id="mvp-title" className="section-title mb-3">
                MVP de la temporada
              </h2>
              <MvpRanking ranking={mvpRanking} />
            </section>

            <section className="card p-4" aria-labelledby="chart-title">
              <h2 id="chart-title" className="section-title mb-3">
                Goles y asistencias
              </h2>
              <GoalsChart players={players} />
            </section>
          </div>
        </div>
      )}

      {tab === 'rivals' && (
        <section className="card p-4" aria-labelledby="rivals-title">
          <h2 id="rivals-title" className="section-title mb-2">
            Cara a cara
          </h2>
          {h2hRecords.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">Aún no te has enfrentado a ningún rival.</p>
          ) : (
            <H2HTable records={h2hRecords} />
          )}
        </section>
      )}

      <MatchLoggerSheet
        open={loggerOpen}
        match={editingMatch}
        players={players}
        seasonId={activeSeason.id}
        teamName={activeCareer?.club_name ?? 'Tu equipo'}
        saveError={error}
        onClose={() => {
          setLoggerOpen(false);
          setEditingMatch(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
