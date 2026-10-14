// ============================================================
// src/pages/MatchDetail.tsx
// One match: score, MVP, what happened and who played. Editing
// and deleting live here, so tapping a match in a list only
// opens it instead of dropping straight into the editor.
// ============================================================

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, Pencil, SearchX, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useMatchDetail } from '../hooks/useMatchDetail';
import { usePlayers } from '../hooks/usePlayers';
import { useLineup } from '../hooks/useLineup';
import BackButton from '../components/ui/BackButton';
import EmptyState from '../components/ui/EmptyState';
import InlineAlert from '../components/ui/InlineAlert';
import { useConfirm } from '../components/ui/confirm';
import MatchLoggerSheet, { type MatchFormPayload } from '../components/matches/MatchLoggerSheet';
import Scoreboard from '../components/match/Scoreboard';
import MatchSummary from '../components/match/MatchSummary';
import MatchPlayers from '../components/match/MatchPlayers';

export default function MatchDetail() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { activeCareer } = useAppStore();
  const { match, loading, error, updateMatch, deleteMatch } = useMatchDetail(activeCareer?.id ?? null, matchId ?? null);
  const [editing, setEditing] = useState(false);

  // A closed season is read-only. The editor needs the season's squad and saved
  // lineup, so they are only loaded when the match can be edited.
  const editable = !!match && !match.season.is_closed;
  const editSeasonId = editable ? match.season_id : null;
  const { players, loading: playersLoading, refetch: refetchPlayers } = usePlayers(
    editable ? activeCareer?.id ?? null : null,
    editSeasonId
  );
  const { lineupIds, loading: lineupLoading } = useLineup(editSeasonId);
  const canEdit = editable && !playersLoading && !lineupLoading;

  const handleSave = async (payload: MatchFormPayload) => {
    const saved = await updateMatch(payload);
    if (saved) refetchPlayers();
    return saved;
  };

  // Used by the editor's own delete button, which already asked for confirmation
  const removeMatch = async () => {
    if (await deleteMatch()) navigate('/stats', { replace: true });
  };

  const handleDelete = async () => {
    if (!match) return;
    const confirmed = await confirm({
      title: `¿Eliminar el partido contra ${match.opponent}?`,
      description: 'Se quitarán sus goles, asistencias, tarjetas y partidos jugados de las estadísticas.',
      confirmLabel: 'Eliminar partido',
      tone: 'danger',
    });
    if (confirmed) await removeMatch();
  };

  return (
    <div className="flex flex-col gap-5">
      <BackButton fallback="/stats" />

      {error && !editing && <InlineAlert>{error}</InlineAlert>}

      {loading ? (
        <div className="flex flex-col gap-5" role="status" aria-label="Cargando partido">
          <div className="skeleton h-[230px] rounded-2xl" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="skeleton h-[180px] rounded-2xl" />
            <div className="skeleton h-[180px] rounded-2xl" />
          </div>
        </div>
      ) : !match ? (
        <EmptyState
          className="card"
          icon={SearchX}
          title="Partido no encontrado"
          description="Puede que se haya eliminado o que pertenezca a otra carrera."
          action={
            <Link to="/stats" className="btn-secondary">
              Ir a Partidos
            </Link>
          }
        />
      ) : (
        <>
          <Scoreboard match={match} teamName={activeCareer?.club_name ?? 'Tu equipo'} />

          {editable ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(true)} disabled={!canEdit} className="btn-secondary flex-1 sm:flex-none">
                <Pencil size={16} /> Editar partido
              </button>
              <button type="button" onClick={handleDelete} className="btn-danger">
                <Trash2 size={16} />
                <span className="sr-only sm:not-sr-only">Eliminar</span>
              </button>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-white/45">
              <Lock size={13} aria-hidden="true" /> La temporada {match.season.year_label} está cerrada: este partido ya no se puede editar.
            </p>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-2">
            <MatchSummary match={match} />
            <MatchPlayers match={match} />
          </div>

          {editable && (
            <MatchLoggerSheet
              open={editing}
              match={match}
              players={players}
              lineupIds={lineupIds}
              teamName={activeCareer?.club_name ?? 'Tu equipo'}
              saveError={error}
              onClose={() => setEditing(false)}
              onSave={handleSave}
              onDelete={removeMatch}
            />
          )}
        </>
      )}
    </div>
  );
}
