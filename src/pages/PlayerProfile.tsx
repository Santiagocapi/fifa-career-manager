// ============================================================
// src/pages/PlayerProfile.tsx
// One player's profile: who they are, this season's numbers,
// how their rating and value moved season by season, and the
// matches they played. Also reachable for players who already
// left the club (from the season history).
// ============================================================

import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, UserX } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import EmptyState from '../components/ui/EmptyState';
import InlineAlert from '../components/ui/InlineAlert';
import PlayerFormSheet, { type PlayerFormData } from '../components/squad/PlayerFormSheet';
import { toPlayerFields, toSeasonStatsFields } from '../components/squad/playerForm';
import ProfileHero from '../components/profile/ProfileHero';
import SeasonTotals from '../components/profile/SeasonTotals';
import RatingChart from '../components/profile/RatingChart';
import SeasonHistoryTable from '../components/profile/SeasonHistoryTable';
import RecentMatches from '../components/profile/RecentMatches';

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCareer, activeSeason } = useAppStore();
  const { player, seasons, events, loading, error, updatePlayer, updateStats } = usePlayerProfile(
    activeCareer?.id ?? null,
    playerId ?? null
  );
  const [editing, setEditing] = useState(false);

  // The active season's row, or the last season the player was at the club
  const activeRow = seasons.find((row) => row.season_id === activeSeason?.id) ?? null;
  const shownRow = activeRow ?? seasons[seasons.length - 1] ?? null;

  const playedEvents = useMemo(() => events.filter((e) => e.played), [events]);

  const mvpsBySeason = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(({ match }) => {
      if (match.mvp_player_id === playerId) counts[match.season_id] = (counts[match.season_id] ?? 0) + 1;
    });
    return counts;
  }, [events, playerId]);

  // Closed seasons are read-only, and players who left are not edited from here
  const canEdit = !!player?.is_active && !!activeSeason && !activeSeason.is_closed && !!activeRow;

  const handleSubmit = async (data: PlayerFormData) => {
    if (!activeSeason) return;
    const saved = await updatePlayer(toPlayerFields(data));
    if (saved) await updateStats(activeSeason.id, toSeasonStatsFields(data));
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* The profile is opened from several screens: go back to whichever it was.
          A direct link has no in-app history ('default' key), so fall back to the squad. */}
      <button
        type="button"
        onClick={() => (location.key === 'default' ? navigate('/squad') : navigate(-1))}
        className="btn-ghost btn-sm -mb-2 -ml-3 self-start"
      >
        <ChevronLeft size={16} /> Volver
      </button>

      {error && <InlineAlert>{error}</InlineAlert>}

      {loading ? (
        <div className="flex flex-col gap-5" role="status" aria-label="Cargando jugador">
          <div className="skeleton h-[140px] rounded-2xl" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="skeleton h-[220px] rounded-2xl" />
            <div className="skeleton h-[220px] rounded-2xl" />
          </div>
        </div>
      ) : !player ? (
        <EmptyState
          className="card"
          icon={UserX}
          title="Jugador no encontrado"
          description="Puede que pertenezca a otra carrera o que el enlace ya no sea válido."
          action={
            <Link to="/squad" className="btn-secondary">
              Volver a la plantilla
            </Link>
          }
        />
      ) : (
        <>
          <ProfileHero player={player} stats={shownRow} onEdit={canEdit ? () => setEditing(true) : undefined} />

          <div className="grid gap-5 lg:grid-cols-2">
            {shownRow && (
              <SeasonTotals
                stats={shownRow}
                mvps={mvpsBySeason[shownRow.season_id] ?? 0}
                position={player.preferred_position}
              />
            )}
            <RatingChart seasons={seasons} />
          </div>

          <section className="card overflow-hidden" aria-labelledby="seasons-title">
            <h2 id="seasons-title" className="section-title px-4 pb-2 pt-4 sm:px-5">
              Temporada a temporada
            </h2>
            <SeasonHistoryTable seasons={seasons} mvpsBySeason={mvpsBySeason} />
          </section>

          <section className="card p-4 sm:p-5" aria-labelledby="matches-title">
            <h2 id="matches-title" className="section-title">
              Partidos jugados
              <span className="tabular-nums text-white/40">{playedEvents.length}</span>
            </h2>
            <div className="mt-1">
              <RecentMatches events={playedEvents} playerId={player.id} />
            </div>
          </section>

          <PlayerFormSheet
            open={editing}
            player={{ ...player, stats: activeRow }}
            onClose={() => setEditing(false)}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
}
