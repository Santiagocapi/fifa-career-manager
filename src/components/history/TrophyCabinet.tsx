// ============================================================
// src/components/history/TrophyCabinet.tsx
// Visual Showcase for Club Trophies & Individual Player Awards
// with authentic SVG trophy badges.
// ============================================================

import React from "react";
import { clsx } from "clsx";
import type { Trophy, PlayerWithStats } from "../../types/database";
import { TrophyIcon } from "./TrophyIcons";
import {
  POSITION_COLORS,
  getPositionGroup,
  getPlayerInitials,
  getPlayerAvatarGradient,
  getCountryCode,
} from "../../lib/constants";
import { Trophy as TrophyLucide, Award, Trash2, Crown } from "lucide-react";

interface TrophyCabinetProps {
  trophies: Trophy[];
  players: PlayerWithStats[];
  onDeleteTrophy?: (id: string) => void;
}

export default function TrophyCabinet({
  trophies,
  players,
  onDeleteTrophy,
}: TrophyCabinetProps) {
  const clubTrophies = trophies.filter((t) => t.trophy_type !== "individual");
  const individualTrophies = trophies.filter((t) => t.trophy_type === "individual");

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Club Trophies Shelf */}
      <div className="card p-5 bg-gradient-to-r from-amber-500/5 via-[#0f172a] to-[#0f172a] border-amber-400/20 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-[#223254] pb-3">
          <div className="flex items-center gap-2">
            <TrophyLucide size={20} className="text-amber-400" />
            <h3 className="font-extrabold text-white text-base tracking-tight">
              Club Trophies (Vitrina del Club)
            </h3>
          </div>
          <span className="badge bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold font-mono">
            {clubTrophies.length} {clubTrophies.length === 1 ? "Title" : "Titles"}
          </span>
        </div>

        {clubTrophies.length === 0 ? (
          <p className="text-white/30 text-sm py-4 text-center">
            No club trophies won yet for this season
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {clubTrophies.map((trophy) => (
              <div
                key={trophy.id}
                className="group relative flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#0b111e]/90 border border-amber-400/30 hover:border-amber-400 shadow-md transition-all hover:-translate-y-0.5"
              >
                {/* SVG Trophy Badge */}
                <div className="w-14 h-14 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <TrophyIcon type={trophy.trophy_type} size={38} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-white text-sm truncate group-hover:text-amber-300 transition-colors">
                    {trophy.trophy_name}
                  </p>
                  <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider block mt-0.5">
                    {trophy.trophy_type.replace("_", " ")}
                  </span>
                </div>

                {onDeleteTrophy && (
                  <button
                    onClick={() => onDeleteTrophy(trophy.id)}
                    className="btn-danger p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    title="Delete Trophy"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Individual Player Awards Shelf */}
      <div className="card p-5 bg-gradient-to-r from-purple-500/5 via-[#0f172a] to-[#0f172a] border-purple-400/20 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-[#223254] pb-3">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-purple-400" />
            <h3 className="font-extrabold text-white text-base tracking-tight">
              Individual Player Awards (Títulos Individuales)
            </h3>
          </div>
          <span className="badge bg-purple-400/10 text-purple-300 border border-purple-400/20 font-bold font-mono">
            {individualTrophies.length} {individualTrophies.length === 1 ? "Award" : "Awards"}
          </span>
        </div>

        {individualTrophies.length === 0 ? (
          <p className="text-white/30 text-sm py-4 text-center">
            No individual player awards recorded for this season
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {individualTrophies.map((trophy) => {
              // Extract player name if included in icon/name string
              const matchedPlayer = players.find(
                (p) =>
                  trophy.icon &&
                  (p.id === trophy.icon ||
                    trophy.trophy_name.toLowerCase().includes(p.full_name.toLowerCase()))
              );

              const initials = matchedPlayer
                ? getPlayerInitials(matchedPlayer.full_name)
                : null;
              const [gradStart, gradEnd] = matchedPlayer
                ? getPlayerAvatarGradient(matchedPlayer.full_name)
                : ["#a855f7", "#6366f1"];
              const countryCode = matchedPlayer
                ? getCountryCode(matchedPlayer.nationality)
                : null;
              const group = matchedPlayer
                ? getPositionGroup(matchedPlayer.preferred_position)
                : "FWD";
              const colors = POSITION_COLORS[group];

              return (
                <div
                  key={trophy.id}
                  className="group relative flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#0b111e]/90 border border-purple-400/30 hover:border-purple-400 shadow-md transition-all hover:-translate-y-0.5"
                >
                  {/* Trophy Icon */}
                  <div className="w-14 h-14 rounded-xl bg-purple-500/15 border border-purple-400/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <TrophyIcon
                      type={
                        trophy.trophy_name.toLowerCase().includes("ballon")
                          ? "ballon_dor"
                          : trophy.trophy_name.toLowerCase().includes("boot")
                          ? "golden_boot"
                          : trophy.trophy_name.toLowerCase().includes("glove")
                          ? "golden_glove"
                          : "ballon_dor"
                      }
                      size={38}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-white text-sm truncate group-hover:text-purple-300 transition-colors">
                      {trophy.trophy_name}
                    </p>

                    {matchedPlayer ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})` }}
                        >
                          {initials}
                        </div>
                        <span className="text-xs font-bold text-white/80 truncate">
                          {matchedPlayer.full_name}
                        </span>
                        {countryCode && (
                          <img
                            src={`https://flagcdn.com/w40/${countryCode}.png`}
                            alt=""
                            className="w-3.5 h-2.5 object-cover rounded-[2px] flex-shrink-0"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-purple-400/80 font-bold uppercase tracking-wider block mt-0.5">
                        Individual Player Award
                      </span>
                    )}
                  </div>

                  {onDeleteTrophy && (
                    <button
                      onClick={() => onDeleteTrophy(trophy.id)}
                      className="btn-danger p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      title="Delete Award"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
