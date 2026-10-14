// ============================================================
// src/components/match/MatchPlayers.tsx
// Everyone who played the match, by position, with what they
// did. Each row opens the player's profile.
// ============================================================

import { Link } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import type { MatchWithSeason } from '../../types/database';
import { sortPlayersByPosition } from '../../lib/constants';
import PositionBadge from '../player/PositionBadge';
import EventSummary from '../matches/EventSummary';

export default function MatchPlayers({ match }: { match: MatchWithSeason }) {
  const eventByPlayer = new Map(match.events.map((e) => [e.player_id, e]));
  // Same rule as matches_played in migration 004: an injured player does not count as having played
  const played = sortPlayersByPosition(
    match.events.filter((e) => e.played && !e.injured && e.player).map((e) => e.player)
  );

  return (
    <section className="card p-2 sm:p-3" aria-labelledby="players-title">
      <h2 id="players-title" className="section-title px-2 pb-1 pt-2">
        Jugaron
        <span className="tabular-nums text-white/40">{played.length}</span>
      </h2>

      {played.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/40">No se marcó a ningún jugador como participante.</p>
      ) : (
        <ul className="divide-y divide-pitch-700/60">
          {played.map((player) => {
            const event = eventByPlayer.get(player.id);
            const isMvp = match.mvp_player_id === player.id;
            return (
              <li key={player.id}>
                <Link
                  to={`/squad/${player.id}`}
                  className="flex min-h-[3rem] items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03] active:bg-white/5"
                >
                  {/* Fixed width so the names line up whatever the position code */}
                  <span className="w-11 flex-shrink-0">
                    <PositionBadge position={player.preferred_position} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white" translate="no">
                    {player.full_name}
                  </span>
                  {isMvp && <Star size={14} className="flex-shrink-0 fill-amber-400 text-amber-400" aria-label="MVP del partido" />}
                  {event && <EventSummary event={event} />}
                  <ChevronRight size={16} className="flex-shrink-0 text-white/25" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
