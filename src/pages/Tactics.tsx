// ============================================================
// src/pages/Tactics.tsx
// Interactive Tactical Board: Formations, Pitch Canvas,
// Starting XI Management, Team Ratings, and Substitutes Bench.
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import { usePlayers } from "../hooks/usePlayers";
import { useTacticsStore } from "../store/useTacticsStore";
import {
  FORMATIONS,
  getPositionGroup,
  formatValue,
  sortPlayersByPosition,
} from "../lib/constants";
import type { FormationScheme, PlayerWithStats } from "../types/database";
import { FORMATION_SLOTS } from "../components/tactics/formationPositions";
import PitchBoard from "../components/tactics/PitchBoard";
import BenchList from "../components/tactics/BenchList";
import {
  Crosshair,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { clsx } from "clsx";

// Top 5 quick shortcut formations
const QUICK_FORMATIONS: FormationScheme[] = [
  "4-3-3 Attack",
  "4-3-3 Holding",
  "4-2-3-1",
  "4-4-2",
  "3-5-2",
];

export default function Tactics() {
  const { activeCareer, activeSeason } = useAppStore();
  const { players, loading } = usePlayers(
    activeCareer?.id ?? null,
    activeSeason?.id ?? null
  );

  const {
    formations,
    lineups,
    setFormation,
    setLineup,
    swapPitchSlots,
    setPitchSlot,
  } = useTacticsStore();

  const seasonId = activeSeason?.id ?? "default";
  const currentScheme: FormationScheme = formations[seasonId] ?? "4-3-3 Attack";
  const currentLineupIds = useMemo(
    () => lineups[seasonId] ?? Array(11).fill(null),
    [lineups, seasonId]
  );

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // Auto-fill logic for starting XI if slot IDs are unassigned or invalid
  const sortedPlayers = useMemo(() => sortPlayersByPosition(players), [players]);

  const startingXI: (PlayerWithStats | null)[] = useMemo(() => {
    const slots = FORMATION_SLOTS[currentScheme] ?? FORMATION_SLOTS["4-3-3"];
    const assigned: (PlayerWithStats | null)[] = Array(11).fill(null);
    const usedPlayerIds = new Set<string>();

    // 1. Fill assigned IDs if valid
    currentLineupIds.forEach((id, idx) => {
      if (id && idx < 11) {
        const found = players.find((p) => p.id === id);
        if (found) {
          assigned[idx] = found;
          usedPlayerIds.add(found.id);
        }
      }
    });

    // 2. Auto-fill empty slots with available players by position fit
    slots.forEach((slot, idx) => {
      if (!assigned[idx]) {
        const expectedGroup = getPositionGroup(slot.role);
        // Best candidate: matching group & highest OVR
        const candidate = sortedPlayers
          .filter((p) => !usedPlayerIds.has(p.id))
          .sort((a, b) => {
            const groupA = getPositionGroup(a.preferred_position);
            const groupB = getPositionGroup(b.preferred_position);
            const fitA = groupA === expectedGroup ? 100 : 0;
            const fitB = groupB === expectedGroup ? 100 : 0;
            const ovrA = a.stats?.ovr_end ?? a.stats?.ovr_start ?? 0;
            const ovrB = b.stats?.ovr_end ?? b.stats?.ovr_start ?? 0;
            return fitB + ovrB - (fitA + ovrA);
          })[0];

        if (candidate) {
          assigned[idx] = candidate;
          usedPlayerIds.add(candidate.id);
        }
      }
    });

    return assigned;
  }, [currentScheme, currentLineupIds, players, sortedPlayers]);

  // Sync auto-filled starting XI IDs to store if changed
  useEffect(() => {
    if (players.length > 0) {
      const newIds = startingXI.map((p) => p?.id ?? null);
      const isDifferent = newIds.some((id, idx) => id !== currentLineupIds[idx]);
      if (isDifferent) {
        setLineup(seasonId, newIds);
      }
    }
  }, [players, startingXI, currentLineupIds, seasonId, setLineup]);

  // Bench players = players not in starting XI
  const benchPlayers = useMemo(() => {
    const startingIds = new Set(startingXI.filter(Boolean).map((p) => p!.id));
    return sortedPlayers.filter((p) => !startingIds.has(p.id));
  }, [sortedPlayers, startingXI]);

  // Team Ratings Calculation
  const validXI = startingXI.filter((p): p is PlayerWithStats => p !== null);
  const teamOvrAvg =
    validXI.length > 0
      ? Math.round(
          validXI.reduce(
            (sum, p) => sum + (p.stats?.ovr_end ?? p.stats?.ovr_start ?? 75),
            0
          ) / validXI.length
        )
      : 0;

  const defOvrAvg = useMemo(() => {
    const defs = validXI.filter((p) =>
      ["GK", "DEF"].includes(getPositionGroup(p.preferred_position))
    );
    if (defs.length === 0) return teamOvrAvg;
    return Math.round(
      defs.reduce((s, p) => s + (p.stats?.ovr_end ?? p.stats?.ovr_start ?? 75), 0) /
        defs.length
    );
  }, [validXI, teamOvrAvg]);

  const midOvrAvg = useMemo(() => {
    const mids = validXI.filter(
      (p) => getPositionGroup(p.preferred_position) === "MID"
    );
    if (mids.length === 0) return teamOvrAvg;
    return Math.round(
      mids.reduce((s, p) => s + (p.stats?.ovr_end ?? p.stats?.ovr_start ?? 75), 0) /
        mids.length
    );
  }, [validXI, teamOvrAvg]);

  const fwdOvrAvg = useMemo(() => {
    const fwds = validXI.filter(
      (p) => getPositionGroup(p.preferred_position) === "FWD"
    );
    if (fwds.length === 0) return teamOvrAvg;
    return Math.round(
      fwds.reduce((s, p) => s + (p.stats?.ovr_end ?? p.stats?.ovr_start ?? 75), 0) /
        fwds.length
    );
  }, [validXI, teamOvrAvg]);

  const totalXIValue = useMemo(() => {
    return validXI.reduce(
      (s, p) =>
        s +
        (p.stats?.market_value_end ?? p.stats?.market_value_start ?? 0),
      0
    );
  }, [validXI]);

  // Handlers
  const handleFormationChange = (newScheme: FormationScheme) => {
    setFormation(seasonId, newScheme);
    setSelectedSlotIndex(null);
  };

  const handleSwapPitchSlots = (idxA: number, idxB: number) => {
    swapPitchSlots(seasonId, idxA, idxB);
  };

  const handleSwapWithBench = (benchPlayerId: string) => {
    if (selectedSlotIndex !== null) {
      setPitchSlot(seasonId, selectedSlotIndex, benchPlayerId);
      setSelectedSlotIndex(null);
    }
  };

  const handleDropBenchPlayer = (pitchSlotIndex: number, benchPlayerId: string) => {
    setPitchSlot(seasonId, pitchSlotIndex, benchPlayerId);
    setSelectedSlotIndex(null);
  };

  const handleAutoOptimizeXI = () => {
    const slots = FORMATION_SLOTS[currentScheme] ?? FORMATION_SLOTS["4-3-3"];
    const used = new Set<string>();
    const newLineup: (string | null)[] = Array(11).fill(null);

    slots.forEach((slot, idx) => {
      const expectedGroup = getPositionGroup(slot.role);
      const candidate = sortedPlayers
        .filter((p) => !used.has(p.id))
        .sort((a, b) => {
          const fitA = getPositionGroup(a.preferred_position) === expectedGroup ? 100 : 0;
          const fitB = getPositionGroup(b.preferred_position) === expectedGroup ? 100 : 0;
          const ovrA = a.stats?.ovr_end ?? a.stats?.ovr_start ?? 0;
          const ovrB = b.stats?.ovr_end ?? b.stats?.ovr_start ?? 0;
          return fitB + ovrB - (fitA + ovrA);
        })[0];

      if (candidate) {
        newLineup[idx] = candidate.id;
        used.add(candidate.id);
      }
    });

    setLineup(seasonId, newLineup);
    setSelectedSlotIndex(null);
  };

  const selectedSlotRole =
    selectedSlotIndex !== null
      ? FORMATION_SLOTS[currentScheme]?.[selectedSlotIndex]?.role ?? null
      : null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Header & Clean Formation Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Crosshair size={28} className="text-amber-400" /> Tactical Board
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {activeSeason?.year_label ?? "No active season"} · Drag & Drop Players or Select Formations
          </p>
        </div>

        {/* Clean Formation Controls: Best XI + Select Dropdown + Quick Pills */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleAutoOptimizeXI}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-md flex-shrink-0"
            title="Auto-fill Best XI"
          >
            <Sparkles size={14} /> Best XI
          </button>

          {/* Styled Select Dropdown for All 20 Formations */}
          <div className="relative flex-shrink-0" translate="no">
            <select
              value={currentScheme}
              onChange={(e) => handleFormationChange(e.target.value as FormationScheme)}
              className="appearance-none bg-[#141e33] border border-[#223254] text-amber-300 font-extrabold text-xs rounded-xl px-4 py-2 pr-9 cursor-pointer hover:border-amber-400/50 transition-all focus:outline-none focus:ring-1 focus:ring-amber-400/40 shadow-sm"
              translate="no"
            >
              {FORMATIONS.map(({ scheme, label }) => (
                <option key={scheme} value={scheme} className="bg-[#0b111e] text-white">
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
          </div>

          {/* Top 5 Quick Shortcut Pills */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto" translate="no">
            {QUICK_FORMATIONS.map((scheme) => (
              <button
                key={scheme}
                onClick={() => handleFormationChange(scheme)}
                translate="no"
                className={clsx(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                  currentScheme === scheme
                    ? "bg-amber-400 text-slate-950 shadow-md font-black"
                    : "bg-[#141e33]/80 text-white/60 hover:text-white border border-[#223254] hover:border-amber-400/30"
                )}
              >
                {scheme}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team Ratings Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Team OVR */}
        <div className="card p-3 flex items-center gap-3 bg-gradient-to-r from-amber-500/10 via-[#0f172a] to-[#0f172a] border-amber-400/30">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-mono font-black text-lg shadow-inner">
            {teamOvrAvg}
          </div>
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              Team OVR
            </span>
            <span className="text-xs font-medium text-white/70">Starting XI</span>
          </div>
        </div>

        {/* Defense */}
        <div className="card p-3 flex items-center gap-3 border-[#223254]">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-black text-base">
            {defOvrAvg}
          </div>
          <div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
              Defense
            </span>
            <span className="text-xs font-medium text-white/50">GK + DEF</span>
          </div>
        </div>

        {/* Midfield */}
        <div className="card p-3 flex items-center gap-3 border-[#223254]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-black text-base">
            {midOvrAvg}
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
              Midfield
            </span>
            <span className="text-xs font-medium text-white/50">MID Line</span>
          </div>
        </div>

        {/* Attack */}
        <div className="card p-3 flex items-center gap-3 border-[#223254]">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-mono font-black text-base">
            {fwdOvrAvg}
          </div>
          <div>
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
              Attack
            </span>
            <span className="text-xs font-medium text-white/50">FWD Line</span>
          </div>
        </div>

        {/* XI Value */}
        <div className="card p-3 flex items-center gap-3 border-[#223254] col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold text-xs">
            VAL
          </div>
          <div>
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
              XI Valuation
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {formatValue(totalXIValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Pitch Canvas (Left) + Substitutes Bench (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Pitch Canvas */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <PitchBoard
            scheme={currentScheme}
            startingXI={startingXI}
            selectedSlotIndex={selectedSlotIndex}
            onSelectSlot={(idx) => setSelectedSlotIndex(idx < 0 ? null : idx)}
            onSwapSlots={handleSwapPitchSlots}
            onDropBenchPlayer={handleDropBenchPlayer}
          />
        </div>

        {/* Substitutes & Bench Panel */}
        <div className="lg:col-span-5">
          <BenchList
            benchPlayers={benchPlayers}
            selectedSlotIndex={selectedSlotIndex}
            selectedSlotRole={selectedSlotRole}
            onSwapWithBench={handleSwapWithBench}
          />
        </div>
      </div>
    </div>
  );
}

