// ============================================================
// src/components/history/SeasonSummary.tsx
// Season Overview Metrics & Top 3 Most Influential Players Podium.
// ============================================================

import React, { useMemo } from "react";
import { clsx } from "clsx";
import type { Season, PlayerWithStats, MatchWithDetails } from "../../types/database";
import {
  POSITION_COLORS,
  getPositionGroup,
  getPlayerInitials,
  getPlayerAvatarGradient,
  getCountryCode,
} from "../../lib/constants";
import { Crown, Flame, Swords, ShieldCheck, Trophy, Sparkles } from "lucide-react";

interface SeasonSummaryProps {
  season: Season;
  players: PlayerWithStats[];
  matches: MatchWithDetails[];
  trophiesCount: number;
}

export default function SeasonSummary({
  season,
  players,
  matches,
  trophiesCount,
}: SeasonSummaryProps) {
  // Aggregate match metrics for this season
  const totalMatches = matches.length;
  const wins = matches.filter((m) => m.result === "win").length;
  const draws = matches.filter((m) => m.result === "draw").length;
  const losses = matches.filter((m) => m.result === "loss").length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const goalsFor = matches.reduce((sum, m) => sum + m.team_score, 0);
  const goalsAgainst = matches.reduce((sum, m) => sum + m.opponent_score, 0);
  const cleanSheets = matches.filter((m) => m.opponent_score === 0).length;

  // Calculate Top 3 Most Influential Players by (Goals + Assists + MVP bonus)
  const topInfluentialPlayers = useMemo(() => {
    return [...players]
      .map((p) => {
        const goals = p.stats?.goals ?? 0;
        const assists = p.stats?.assists ?? 0;
        const mvpCount = matches.filter((m) => m.mvp_player_id === p.id).length;
        const totalImpact = goals * 1.5 + assists * 1.0 + mvpCount * 2.0;
        return {
          player: p,
          goals,
          assists,
          mvpCount,
          totalContributions: goals + assists,
          impactScore: totalImpact,
        };
      })
      .filter((item) => item.totalContributions > 0 || item.mvpCount > 0)
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 3);
  }, [players, matches]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top 3 Most Influential Players Podium */}
      <div className="card p-5 bg-gradient-to-b from-[#141e33] via-[#0b111e] to-[#0b111e] border-amber-400/30 shadow-2xl relative overflow-hidden">
        {/* Subtle background star flare */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-5 border-b border-[#223254] pb-3 relative z-10">
          <div>
            <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
              <Crown size={22} className="text-amber-400 animate-pulse" />
              Top 3 Most Influential Players (Podio de Influencia)
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Ranked by Goals, Assists & MVP Awards in {season.year_label}
            </p>
          </div>
          <span className="badge bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold uppercase text-[10px]">
            Season MVP Leaders
          </span>
        </div>

        {topInfluentialPlayers.length === 0 ? (
          <p className="text-white/30 text-sm py-6 text-center">
            No match events or stats recorded for players in this season yet
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
            {topInfluentialPlayers.map((item, idx) => {
              const { player, goals, assists, mvpCount, totalContributions } = item;
              const rank = idx + 1; // 1 = Gold, 2 = Silver, 3 = Bronze
              const group = getPositionGroup(player.preferred_position);
              const colors = POSITION_COLORS[group];
              const initials = getPlayerInitials(player.full_name);
              const [gradStart, gradEnd] = getPlayerAvatarGradient(player.full_name);
              const countryCode = getCountryCode(player.nationality);
              const ovr = player.stats?.ovr_end ?? player.stats?.ovr_start ?? 75;

              const isGold = rank === 1;
              const isSilver = rank === 2;
              const isBronze = rank === 3;

              return (
                <div
                  key={player.id}
                  className={clsx(
                    "flex flex-col items-center text-center p-4 rounded-3xl border transition-all relative group shadow-xl",
                    isGold &&
                      "bg-gradient-to-b from-amber-500/20 via-[#131c2e] to-[#0b111e] border-amber-400 md:-translate-y-3 shadow-[0_0_30px_rgba(245,158,11,0.3)] z-20",
                    isSilver &&
                      "bg-gradient-to-b from-slate-400/15 via-[#131c2e] to-[#0b111e] border-slate-300/60 z-10",
                    isBronze &&
                      "bg-gradient-to-b from-amber-800/20 via-[#131c2e] to-[#0b111e] border-amber-700/60 z-10"
                  )}
                >
                  {/* Podium Rank Badge */}
                  <div
                    className={clsx(
                      "absolute -top-3.5 px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1 shadow-lg",
                      isGold && "bg-amber-400 text-slate-950 ring-2 ring-amber-300",
                      isSilver && "bg-slate-300 text-slate-950",
                      isBronze && "bg-amber-700 text-white"
                    )}
                  >
                    {isGold && <Crown size={12} fill="currentColor" />}
                    #{rank} {isGold ? "PLAYER OF THE SEASON" : rank === 2 ? "2ND" : "3RD"}
                  </div>

                  {/* Player Avatar */}
                  <div className="relative mt-2 mb-3">
                    <div
                      className={clsx(
                        "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-base sm:text-xl font-black text-white shadow-xl border-2",
                        isGold ? "border-amber-300" : "border-white/20"
                      )}
                      style={{ background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})` }}
                    >
                      {initials}
                    </div>
                    {/* OVR Badge */}
                    <div className="absolute -bottom-2 -right-2 bg-pitch-900 border border-amber-400/40 text-amber-300 font-mono font-black text-xs px-2 py-0.5 rounded-lg shadow-md">
                      {ovr}
                    </div>
                  </div>

                  {/* Name & Country */}
                  <h4 className="font-extrabold text-white text-base truncate max-w-full px-1 group-hover:text-amber-300 transition-colors">
                    {player.full_name}
                  </h4>

                  <div className="flex items-center gap-2 mt-1 mb-3">
                    <span
                      translate="no"
                      className={clsx("badge text-[9px] font-bold px-1.5 py-0.2 rounded uppercase", colors.badge)}
                    >
                      {player.preferred_position}
                    </span>
                    {countryCode && (
                      <img
                        src={`https://flagcdn.com/w40/${countryCode}.png`}
                        alt={player.nationality ?? ""}
                        className="w-4 h-3 object-cover rounded-[2px] shadow-sm flex-shrink-0"
                      />
                    )}
                  </div>

                  {/* Stat Highlights Bar */}
                  <div className="w-full grid grid-cols-3 gap-1 p-2 rounded-2xl bg-[#090e18]/80 border border-white/10 text-xs">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-white/40 font-bold uppercase">Goles</span>
                      <span className="font-mono font-extrabold text-emerald-400 text-sm">
                        {goals}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-white/40 font-bold uppercase">Asist</span>
                      <span className="font-mono font-extrabold text-cyan-400 text-sm">
                        {assists}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-amber-400 font-bold uppercase">G+A</span>
                      <span className="font-mono font-black text-amber-300 text-sm">
                        {totalContributions}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Aggregate Season Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 flex items-center gap-3 border-[#223254]">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Swords size={20} />
          </div>
          <div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
              Matches / Record
            </span>
            <span className="text-xs font-mono font-extrabold text-white">
              {totalMatches} Played ({wins}W-{draws}D-{losses}L)
            </span>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3 border-[#223254]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Flame size={20} />
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
              Win Rate & Goals
            </span>
            <span className="text-xs font-mono font-extrabold text-white">
              {winRate}% ({goalsFor} Goles)
            </span>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3 border-[#223254]">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
              Clean Sheets
            </span>
            <span className="text-xs font-mono font-extrabold text-white">
              {cleanSheets} Matches
            </span>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3 border-amber-400/30 bg-amber-500/5">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <Trophy size={20} />
          </div>
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              Trophies Won
            </span>
            <span className="text-xs font-mono font-extrabold text-amber-300">
              {trophiesCount} Titles
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
