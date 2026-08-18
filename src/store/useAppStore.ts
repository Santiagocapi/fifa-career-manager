// ============================================================
// src/store/useAppStore.ts
// Global application state using Zustand.
//
// WHY ZUSTAND?
// Imagine you're on the Tactics page. You need to know
// "which season is active?". That data lives in the Squad page.
// Without a global store, you'd have to pass that data as props
// through 10 components — called "prop drilling". It's messy.
//
// Zustand solves this: any component anywhere can call
// useAppStore() and get or set the active career/season
// without props at all.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Career, Season } from '../types/database';

interface AppState {
  // ---- Active Career ----
  // The career the user is currently viewing/editing.
  // Null means they haven't selected one yet (redirect to career select).
  activeCareer: Career | null;
  setActiveCareer: (career: Career | null) => void;

  // ---- Active Season ----
  // The season within the active career being viewed.
  // Always the most recent open season by default.
  activeSeason: Season | null;
  setActiveSeason: (season: Season | null) => void;

  // ---- UI State ----
  // Whether the sidebar is collapsed (for space on small screens)
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // ---- Reset ----
  // Called when user logs out
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  // persist() middleware saves the store to localStorage automatically.
  // This means activeCareer survives a page refresh.
  persist(
    (set) => ({
      // Initial state
      activeCareer: null,
      activeSeason: null,
      sidebarCollapsed: false,

      // Actions — these are functions that update state
      setActiveCareer: (career) => set({ activeCareer: career }),
      setActiveSeason: (season) => set({ activeSeason: season }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      reset: () => set({
        activeCareer: null,
        activeSeason: null,
        sidebarCollapsed: false,
      }),
    }),
    {
      name: 'fifa-career-manager-store', // localStorage key
      // Only persist these specific fields (not UI state like loading)
      partialize: (state) => ({
        activeCareer: state.activeCareer,
        activeSeason: state.activeSeason,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
