// ============================================================
// src/components/tactics/PitchBoard.tsx
// Interactive Tactical Pitch Component with SVG markings,
// enlarged player cards, native Drag & Drop, and translate="no" guards.
// ============================================================

import React, { useState } from "react";
import { clsx } from "clsx";
import type { FormationScheme, PlayerWithStats } from "../../types/database";
import { FORMATION_SLOTS, type PitchSlotDef } from "./formationPositions";
import {
  POSITION_COLORS,
  getPlayerInitials,
  getPlayerAvatarGradient,
  getCountryCode,
} from "../../lib/constants";
import { ArrowLeftRight } from "lucide-react";

interface PitchBoardProps {
  scheme: FormationScheme;
  startingXI: (PlayerWithStats | null)[];
  selectedSlotIndex: number | null;
  onSelectSlot: (index: number) => void;
  onSwapSlots: (indexA: number, indexB: number) => void;
  onDropBenchPlayer?: (pitchSlotIndex: number, benchPlayerId: string) => void;
}

export default function PitchBoard({
  scheme,
  startingXI,
  selectedSlotIndex,
  onSelectSlot,
  onSwapSlots,
  onDropBenchPlayer,
}: PitchBoardProps) {
  const slots: PitchSlotDef[] = FORMATION_SLOTS[scheme] ?? FORMATION_SLOTS["4-3-3"];
  const [draggedPitchIndex, setDraggedPitchIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleSlotClick = (index: number) => {
    if (selectedSlotIndex === null) {
      onSelectSlot(index);
    } else if (selectedSlotIndex === index) {
      onSelectSlot(-1);
    } else {
      onSwapSlots(selectedSlotIndex, index);
      onSelectSlot(-1);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPitchIndex(index);
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "pitch", index }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggedPitchIndex(null);

    const rawData = e.dataTransfer.getData("text/plain");
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (data.type === "pitch") {
        if (data.index !== targetIndex) {
          onSwapSlots(data.index, targetIndex);
        }
      } else if (data.type === "bench" && onDropBenchPlayer) {
        onDropBenchPlayer(targetIndex, data.playerId);
      }
    } catch (err) {
      console.error("Drag drop parse error:", err);
    }
  };

  return (
    <div className="relative w-full aspect-[3/4.6] sm:aspect-[4/3.2] min-h-[580px] sm:min-h-[620px] rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-[0_12px_45px_rgba(0,0,0,0.85)] bg-gradient-to-b from-[#071c0e] via-[#0c2f18] to-[#071c0e]">
      {/* Field Grass Texture Lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none flex flex-col">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "flex-1 w-full",
              i % 2 === 0 ? "bg-white/10" : "bg-transparent"
            )}
          />
        ))}
      </div>

      {/* SVG Tactical Field Markings */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none stroke-white/30 stroke-[1.8]"
        fill="none"
        viewBox="0 0 300 440"
        preserveAspectRatio="none"
      >
        {/* Outer Boundary */}
        <rect x="10" y="10" width="280" height="420" rx="8" />

        {/* Center Line & Circle */}
        <line x1="10" y1="220" x2="290" y2="220" />
        <circle cx="150" cy="220" r="38" />
        <circle cx="150" cy="220" r="2.5" fill="white" fillOpacity="0.6" />

        {/* Top Penalty Area */}
        <rect x="65" y="10" width="170" height="72" />
        <rect x="95" y="10" width="110" height="28" />
        <circle cx="150" cy="56" r="2" fill="white" fillOpacity="0.6" />

        {/* Bottom Penalty Area */}
        <rect x="65" y="358" width="170" height="72" />
        <rect x="95" y="402" width="110" height="28" />
        <circle cx="150" cy="384" r="2" fill="white" fillOpacity="0.6" />
      </svg>

      {/* Starting XI Tokens Layer */}
      <div className="absolute inset-0 p-2 sm:p-4">
        {slots.map((slot, index) => {
          const player = startingXI[index];
          const isSelected = selectedSlotIndex === index;
          const isDragOver = dragOverIndex === index;
          const isDragging = draggedPitchIndex === index;

          const group = slot.role.startsWith("G")
            ? "GK"
            : slot.role.includes("B")
            ? "DEF"
            : slot.role.includes("M")
            ? "MID"
            : "FWD";
          const colors = POSITION_COLORS[group];

          const initials = player ? getPlayerInitials(player.full_name) : null;
          const [gradStart, gradEnd] = player
            ? getPlayerAvatarGradient(player.full_name)
            : ["#334155", "#1e293b"];
          const ovr = player
            ? player.stats?.ovr_end ?? player.stats?.ovr_start ?? 75
            : null;
          const countryCode = player ? getCountryCode(player.nationality) : null;

          return (
            <div
              key={index}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => handleSlotClick(index)}
              className={clsx(
                "absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-all duration-200 z-10 group select-none",
                isDragging && "opacity-40 scale-95",
                isDragOver && "scale-115 z-40",
                isSelected ? "scale-110 z-30" : "hover:scale-105"
              )}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              <div
                className={clsx(
                  "relative flex flex-col items-center gap-0.5 p-1.5 sm:p-2.5 rounded-2xl transition-all duration-200",
                  "bg-[#091120]/95 backdrop-blur-md border shadow-2xl min-w-[74px] sm:min-w-[102px]",
                  isDragOver
                    ? "border-amber-300 ring-4 ring-amber-400/50 bg-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.6)]"
                    : isSelected
                    ? "border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                    : player?.stats?.is_injured
                    ? "border-rose-500/60 bg-rose-950/50"
                    : "border-emerald-500/40 hover:border-amber-400/80"
                )}
              >
                {/* Drag / Swap Active Indicator */}
                {isSelected && (
                  <div className="absolute -top-3.5 bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                    <ArrowLeftRight size={10} /> SWAP
                  </div>
                )}

                {/* Token Header: Role Badge + OVR Badge */}
                <div className="flex items-center justify-between w-full gap-1 px-0.5">
                  <span
                    translate="no"
                    className={clsx(
                      "badge text-[9px] sm:text-[11px] font-black px-1.5 py-0.5 rounded-md uppercase shadow-sm tracking-tight",
                      colors.badge
                    )}
                  >
                    {slot.role}
                  </span>
                  {ovr !== null && (
                    <span className="text-[10px] sm:text-xs font-black text-amber-300 font-mono tracking-tight bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20 shadow-sm">
                      {ovr}
                    </span>
                  )}
                </div>

                {/* Enlarged Player Avatar Circle */}
                <div
                  className="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black text-white shadow-lg relative border border-white/20 overflow-hidden my-0.5"
                  style={{
                    background: player
                      ? `linear-gradient(135deg, ${gradStart}, ${gradEnd})`
                      : "#1e293b",
                  }}
                >
                  {player ? (
                    initials
                  ) : (
                    <span className="text-xs text-white/40 font-mono">+</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Player Short Name & Country Flag */}
                <div className="flex items-center justify-center gap-1 w-full max-w-[74px] sm:max-w-[102px]">
                  {countryCode && (
                    <img
                      src={`https://flagcdn.com/w40/${countryCode}.png`}
                      alt={player?.nationality ?? ""}
                      className="w-3.5 h-2.5 sm:w-4 sm:h-3 object-cover rounded-[2px] shadow-sm flex-shrink-0 border border-white/10"
                    />
                  )}
                  <span className="text-[10px] sm:text-xs font-extrabold text-white truncate text-center leading-tight">
                    {player ? player.full_name.split(" ").pop() : "Empty"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

