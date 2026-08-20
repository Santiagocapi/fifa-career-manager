// ============================================================
// src/pages/History.tsx
// Authentic Trophy Cabinet & Season Career History with Top 3
// Most Influential Players Podium and Season Summaries.
// ============================================================

import React, { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useSeasons } from "../hooks/useSeasons";
import { useTrophies } from "../hooks/useTrophies";
import { usePlayers } from "../hooks/usePlayers";
import { useMatches } from "../hooks/useMatches";
import { TROPHY_TYPES, formatValue, getPositionGroup, POSITION_COLORS } from "../lib/constants";
import TrophyCabinet from "../components/history/TrophyCabinet";
import SeasonSummary from "../components/history/SeasonSummary";
import { Trophy, Plus, X, Loader2, Calendar, Award, Crown } from "lucide-react";
import { useForm } from "react-hook-form";
import { clsx } from "clsx";
import type { TrophyType, CreateTrophyDto } from "../types/database";

interface TrophyFormData {
  trophy_name: string;
  trophy_type: TrophyType;
  icon_player_id?: string;
}

export default function History() {
  const { activeCareer, activeSeason } = useAppStore();
  const { seasons, loading: seasonsLoading } = useSeasons(activeCareer?.id ?? null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [showTrophyForm, setShowTrophyForm] = useState(false);

  // Active or selected season
  const viewingSeasonId = selectedSeasonId ?? activeSeason?.id ?? null;
  const viewingSeason = seasons.find((s) => s.id === viewingSeasonId);

  const { trophies, addTrophy, deleteTrophy } = useTrophies(viewingSeasonId);
  const { players: seasonPlayers } = usePlayers(
    activeCareer?.id ?? null,
    viewingSeasonId
  );
  const { matches: seasonMatches } = useMatches(
    viewingSeasonId,
    activeCareer?.id ?? null
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<TrophyFormData>({
    defaultValues: {
      trophy_type: "league",
    },
  });

  const selectedTrophyType = watch("trophy_type");

  const onSubmit = async (data: TrophyFormData) => {
    if (!viewingSeasonId) return;
    const dto: CreateTrophyDto = {
      season_id: viewingSeasonId,
      trophy_name: data.trophy_name,
      trophy_type: data.trophy_type,
      icon: data.icon_player_id || "??",
    };
    await addTrophy(dto);
    reset();
    setShowTrophyForm(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Trophy className="text-amber-400" size={28} /> Trophy Cabinet & History
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Season archives, authentic trophy showcase & Player of the Season podium
          </p>
        </div>
        <button
          onClick={() => setShowTrophyForm(true)}
          className="btn-primary flex-shrink-0"
          disabled={!viewingSeasonId}
        >
          <Plus size={16} /> Add Trophy
        </button>
      </div>

      {/* Trophy Modal */}
      {showTrophyForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-5 border-b border-pitch-700 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Crown size={20} className="text-amber-400" /> Add Trophy to Cabinet
              </h3>
              <button
                onClick={() => setShowTrophyForm(false)}
                className="btn-ghost p-2"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Trophy / Award Name *</label>
                <input
                  placeholder="e.g. UEFA Champions League or Ballon d'Or"
                  {...register("trophy_name", { required: true })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  {...register("trophy_type", { required: true })}
                  className="w-full bg-pitch-900 border border-pitch-700 text-white rounded-xl p-2.5 text-sm"
                >
                  {TROPHY_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-pitch-900">
                      {t.emoji} {t.label}
                    </option>
                  ))}
                  <option value="individual" className="bg-pitch-900">
                    ? Individual Player Award (Ballon d'Or / Boot / Glove)
                  </option>
                </select>
              </div>

              {/* If Individual Award selected, select player */}
              {selectedTrophyType === ("individual" as any) && (
                <div className="form-group">
                  <label className="form-label">Recipient Player</label>
                  <select
                    {...register("icon_player_id")}
                    className="w-full bg-pitch-900 border border-pitch-700 text-white rounded-xl p-2.5 text-sm"
                  >
                    <option value="">-- Select Winner --</option>
                    {seasonPlayers.map((p) => (
                      <option key={p.id} value={p.id} className="bg-pitch-900">
                        {p.full_name} ({p.preferred_position})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 mt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Save Award
                </button>
                <button
                  type="button"
                  onClick={() => setShowTrophyForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Season Archive Selector (Left) + Detail & Trophy Showcase (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Seasons Sidebar */}
        <div className="lg:col-span-3">
          <div className="card p-4 flex flex-col gap-3">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2 border-b border-[#223254] pb-3">
              <Calendar size={16} className="text-amber-400" />
              Seasons Archive
            </h3>

            {seasonsLoading ? (
              <div className="skeleton h-24 rounded-xl" />
            ) : (
              <div className="flex flex-col gap-2">
                {seasons
                  .slice()
                  .reverse()
                  .map((season) => (
                    <button
                      key={season.id}
                      onClick={() =>
                        setSelectedSeasonId(
                          season.id === viewingSeasonId ? null : season.id
                        )
                      }
                      className={clsx(
                        "w-full text-left px-3.5 py-3 rounded-2xl transition-all text-sm flex items-center justify-between border cursor-pointer",
                        viewingSeasonId === season.id
                          ? "bg-amber-400/10 border-amber-400/40 text-amber-300 shadow-md font-bold"
                          : "hover:bg-[#141e33] text-white/70 border-transparent"
                      )}
                    >
                      <div>
                        <p className="font-extrabold text-white text-sm">
                          Season {season.season_number}
                        </p>
                        <p className="text-xs text-white/50">{season.year_label}</p>
                      </div>
                      <span
                        className={clsx(
                          "badge text-[10px] uppercase font-bold",
                          season.is_closed
                            ? "bg-white/5 text-white/40 border-white/10"
                            : "bg-amber-400/20 text-amber-300 border-amber-400/30"
                        )}
                      >
                        {season.is_closed ? "Closed" : "Active"}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Season Detail View */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {viewingSeason ? (
            <>
              {/* Season Overview Stats & Top 3 Most Influential Players Podium */}
              <SeasonSummary
                season={viewingSeason}
                players={seasonPlayers}
                matches={seasonMatches}
                trophiesCount={trophies.length}
              />

              {/* Authentic Trophy Cabinet Showcase */}
              <TrophyCabinet
                trophies={trophies}
                players={seasonPlayers}
                onDeleteTrophy={deleteTrophy}
              />

              {/* Season Roster Snapshot Table */}
              <div className="card p-5">
                <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  Season Player Performance & Growth Snapshot
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#223254]">
                        <th className="py-2.5 text-left text-white/40 font-bold uppercase">
                          Player
                        </th>
                        <th className="py-2.5 text-center text-white/40 font-bold uppercase">
                          Pos
                        </th>
                        <th className="py-2.5 text-center text-white/40 font-bold uppercase">
                          OVR
                        </th>
                        <th className="py-2.5 text-center text-white/40 font-bold uppercase">
                          Growth
                        </th>
                        <th className="py-2.5 text-center text-emerald-400 font-bold uppercase">
                          Goals
                        </th>
                        <th className="py-2.5 text-center text-cyan-400 font-bold uppercase">
                          Assists
                        </th>
                        <th className="py-2.5 text-right text-white/40 font-bold uppercase">
                          Valuation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#223254]/50">
                      {seasonPlayers.map((player) => {
                        const ovrStart = player.stats?.ovr_start ?? 75;
                        const ovrEnd = player.stats?.ovr_end ?? ovrStart;
                        const growth = ovrEnd - ovrStart;
                        const group = getPositionGroup(player.preferred_position);
                        const colors = POSITION_COLORS[group];

                        return (
                          <tr
                            key={player.id}
                            className="hover:bg-[#141e33]/50 transition-colors"
                          >
                            <td className="py-2.5 font-bold text-white">
                              {player.full_name}
                            </td>
                            <td className="py-2.5 text-center">
                              <span
                                translate="no"
                                className={clsx(
                                  "badge text-[9px] font-bold px-1.5 py-0.2 rounded uppercase",
                                  colors.badge
                                )}
                              >
                                {player.preferred_position}
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-amber-300">
                              {ovrEnd}
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold">
                              {growth > 0 ? (
                                <span className="text-emerald-400">+{growth}</span>
                              ) : growth < 0 ? (
                                <span className="text-rose-400">{growth}</span>
                              ) : (
                                <span className="text-white/30">—</span>
                              )}
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-emerald-400">
                              {player.stats?.goals ?? 0}
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-cyan-400">
                              {player.stats?.assists ?? 0}
                            </td>
                            <td className="py-2.5 text-right font-mono text-white/60">
                              {formatValue(
                                player.stats?.market_value_end ??
                                  player.stats?.market_value_start
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {seasonPlayers.length === 0 && (
                    <p className="text-center text-white/30 py-6 text-sm">
                      No players found in roster for this season
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center gap-3 text-center">
              <Trophy size={48} className="text-white/20" />
              <p className="text-white/40 text-sm">
                Select a season from the left archive to view its trophy showcase & performance statistics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
