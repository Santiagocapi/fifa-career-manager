// ============================================================
// src/pages/Tactics.tsx
// Tactical board with drag & drop player positioning.
// Phase 3 — Full implementation coming after Squad is tested.
// ============================================================

import { useAppStore } from '../store/useAppStore';
import { Crosshair } from 'lucide-react';

export default function Tactics() {
  const { activeSeason } = useAppStore();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-white">Tactical Board</h1>
        <p className="text-white/50 text-sm mt-1">
          {activeSeason?.year_label ?? 'No active season'} · Drag & drop players to set your formation
        </p>
      </div>

      {/* Placeholder — full pitch board in Phase 3 */}
      <div className="card p-12 flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <div className="w-16 h-16 rounded-2xl bg-neon-400/10 border border-neon-400/20 flex items-center justify-center">
          <Crosshair size={32} className="text-neon-400" />
        </div>
        <h3 className="font-bold text-white text-xl">Coming in Phase 3</h3>
        <p className="text-white/40 text-sm text-center max-w-sm">
          The interactive drag & drop tactical pitch board with formation selection and player positioning.
        </p>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '4-5-1'].map(f => (
            <div key={f} className="badge bg-pitch-700 text-white/50 border-pitch-600 justify-center">
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
