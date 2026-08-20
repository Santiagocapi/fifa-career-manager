// ============================================================
// src/store/useTacticsStore.ts
// Zustand store for persisting formation selection and starting XI
// lineup per season ID.
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FormationScheme } from "../types/database";

interface TacticsState {
  // Mapping of seasonId -> chosen formation scheme
  formations: Record<string, FormationScheme>;
  // Mapping of seasonId -> array of 11 player IDs (or empty slots)
  lineups: Record<string, (string | null)[]>;

  setFormation: (seasonId: string, scheme: FormationScheme) => void;
  setLineup: (seasonId: string, playerIds: (string | null)[]) => void;
  swapPitchSlots: (seasonId: string, indexA: number, indexB: number) => void;
  setPitchSlot: (seasonId: string, slotIndex: number, playerId: string | null) => void;
  clearLineup: (seasonId: string) => void;
}

export const useTacticsStore = create<TacticsState>()(
  persist(
    (set) => ({
      formations: {},
      lineups: {},

      setFormation: (seasonId, scheme) =>
        set((state) => ({
          formations: { ...state.formations, [seasonId]: scheme },
        })),

      setLineup: (seasonId, playerIds) =>
        set((state) => ({
          lineups: { ...state.lineups, [seasonId]: playerIds },
        })),

      swapPitchSlots: (seasonId, indexA, indexB) =>
        set((state) => {
          const current = [...(state.lineups[seasonId] ?? Array(11).fill(null))];
          const temp = current[indexA];
          current[indexA] = current[indexB];
          current[indexB] = temp;
          return { lineups: { ...state.lineups, [seasonId]: current } };
        }),

      setPitchSlot: (seasonId, slotIndex, playerId) =>
        set((state) => {
          const current = [...(state.lineups[seasonId] ?? Array(11).fill(null))];
          current[slotIndex] = playerId;
          return { lineups: { ...state.lineups, [seasonId]: current } };
        }),

      clearLineup: (seasonId) =>
        set((state) => {
          const newMap = { ...state.lineups };
          delete newMap[seasonId];
          return { lineups: newMap };
        }),
    }),
    {
      name: "fifa-tactics-storage",
    }
  )
);

