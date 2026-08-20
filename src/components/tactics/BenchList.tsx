// ============================================================
// src/components/tactics/BenchList.tsx
// Panel listing substitutes & reserve squad players with quick
// swap actions and Drag & Drop into the pitch.
// ============================================================

import React from "react";
import { clsx } from "clsx";
import type { PlayerWithStats } from "../../types/database";
import {
  POSITION_COLORS,
  getPositionGroup,
  getPlayerInitials,
  getPlayerAvatarGradient,
  getCountryCode,
} from "../../lib/constants";
import { ArrowRightLeft, GripVertical } from "lucide-react";

interface BenchListProps {
  benchPlayers: PlayerWithStats[];
  selectedSlotIndex: number | null;
  selectedSlotRole: string | null;
  onSwapWithBench: (benchPlayerId: string) => void;
}

export default function BenchList({
  benchPlayers,
  selectedSlotIndex,
  selectedSlotRole,
  onSwapWithBench,
}: BenchListProps) {
  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ type: "bench", playerId })
    );
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="card p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between border-b border-[#223254] pb-3">
        <div>
          <h3 className="font-bold text-white text-base">Substitutes & Bench</h3>
          <p className="text-xs text-white/50">
            {benchPlayers.length} reserve players available · Drag onto pitch
          </p>
        </div>
        {selectedSlotIndex !== null && (
          <span translate="no" className="badge bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] uppercase font-bold animate-pulse">
            Selecting for {selectedSlotRole}
          </span>
        )}
      </div>

      {benchPlayers.length === 0 ? (
        <div className="p-8 text-center text-white/40 text-sm">
          All squad players are currently in the starting XI.
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[520px] pr-1">
          {benchPlayers.map((player) => {
            const group = getPositionGroup(player.preferred_position);
            const colors = POSITION_COLORS[group];
            const initials = getPlayerInitials(player.full_name);
            const [gradStart, gradEnd] = getPlayerAvatarGradient(player.full_name);
            const ovr = player.stats?.ovr_end ?? player.stats?.ovr_start ?? 75;
            const countryCode = getCountryCode(player.nationality);
            const isInjured = player.stats?.is_injured ?? false;

            return (
              <div
                key={player.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, player.id)}
                onClick={() => {
                  if (selectedSlotIndex !== null) {
                    onSwapWithBench(player.id);
                  }
                }}
                className={clsx(
                  "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 group cursor-grab active:cursor-grabbing select-none",
                  selectedSlotIndex !== null
                    ? "border-amber-400/40 bg-amber-500/5 hover:border-amber-400 hover:bg-amber-500/10 shadow-md"
                    : "border-[#223254] bg-[#0b111e]/80 hover:border-white/20 hover:bg-[#141e33]"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GripVertical size={16} className="text-white/20 group-hover:text-white/50 flex-shrink-0" />

                  {/* Player Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 border border-white/10"
                    style={{ background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})` }}
                  >
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-white text-sm truncate group-hover:text-amber-300 transition-colors">
                        {player.full_name}
                      </p>
                      {isInjured && (
                        <span className="text-[9px] text-rose-400 font-bold bg-rose-500/20 px-1 py-0.2 rounded flex-shrink-0">
                          INJ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span translate="no" className={clsx("badge text-[9px] font-bold px-1.5 py-0.2 rounded uppercase", colors.badge)}>
                        {player.preferred_position}
                      </span>
                      {countryCode && (
                        <img
                          src={`https://flagcdn.com/w40/${countryCode}.png`}
                          alt={player.nationality ?? ""}
                          className="w-4 h-3 object-cover rounded-[2px] shadow-sm flex-shrink-0"
                        />
                      )}
                      {player.age && (
                        <span className="text-[11px] text-white/50">{player.age}y</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* OVR Rating & Swap Action */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-pitch-700/80 border border-pitch-600 flex items-center justify-center font-mono font-black text-amber-300 text-sm shadow-sm">
                    {ovr}
                  </div>
                  {selectedSlotIndex !== null && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSwapWithBench(player.id);
                      }}
                      className="btn-primary text-xs py-1.5 px-2.5 rounded-lg flex items-center gap-1 shadow-md"
                    >
                      <ArrowRightLeft size={12} /> Swap
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

