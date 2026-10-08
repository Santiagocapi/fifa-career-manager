// ============================================================
// src/pages/Tactics.tsx
// Tactical board: formation, pitch with the starting XI, line
// ratings and substitutes. The lineup is stored per season in
// useTacticsStore and feeds the match logger's starters.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { usePlayers } from '../hooks/usePlayers';
import { useTacticsStore } from '../store/useTacticsStore';
import { sortPlayersByPosition } from '../lib/constants';
import type { FormationScheme } from '../types/database';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import PitchBoard from '../components/tactics/PitchBoard';
import BenchList from '../components/tactics/BenchList';
import SwapTray from '../components/tactics/SwapTray';
import TeamRatings from '../components/tactics/TeamRatings';
import FormationPicker from '../components/tactics/FormationPicker';
import { buildBestXI, buildStartingXI, computeLineRatings, getSlots } from '../components/tactics/lineup';

export default function Tactics() {
  const { activeCareer, activeSeason } = useAppStore();
  const { players, loading } = usePlayers(activeCareer?.id ?? null, activeSeason?.id ?? null);
  const { formations, lineups, setFormation, setLineup, swapPitchSlots, setPitchSlot } = useTacticsStore();

  const seasonId = activeSeason?.id ?? 'default';
  const currentScheme: FormationScheme = formations[seasonId] ?? '4-3-3 Attack';
  const storedLineup = lineups[seasonId];
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const sortedPlayers = useMemo(() => sortPlayersByPosition(players), [players]);

  const startingXI = useMemo(
    () => buildStartingXI(currentScheme, storedLineup ?? [], sortedPlayers),
    [currentScheme, storedLineup, sortedPlayers]
  );

  // Persist auto-filled slots so the match logger sees the same XI
  useEffect(() => {
    if (players.length === 0) return;
    const ids = startingXI.map((p) => p?.id ?? null);
    const stored = storedLineup ?? [];
    if (ids.some((id, idx) => id !== (stored[idx] ?? null))) setLineup(seasonId, ids);
  }, [players.length, startingXI, storedLineup, seasonId, setLineup]);

  const benchPlayers = useMemo(() => {
    const startingIds = new Set(startingXI.flatMap((p) => (p ? [p.id] : [])));
    return sortedPlayers.filter((p) => !startingIds.has(p.id));
  }, [sortedPlayers, startingXI]);

  const ratings = useMemo(() => computeLineRatings(startingXI), [startingXI]);

  // Escape cancels a pending change on desktop
  useEffect(() => {
    if (selectedSlotIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedSlotIndex(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedSlotIndex]);

  const handleFormationChange = (scheme: FormationScheme) => {
    setFormation(seasonId, scheme);
    setSelectedSlotIndex(null);
  };

  const handleBestXI = () => {
    setLineup(seasonId, buildBestXI(currentScheme, sortedPlayers));
    setSelectedSlotIndex(null);
  };

  const putOnPitch = (slotIndex: number, benchPlayerId: string) => {
    setPitchSlot(seasonId, slotIndex, benchPlayerId);
    setSelectedSlotIndex(null);
  };

  const selectedRole = selectedSlotIndex !== null ? getSlots(currentScheme)[selectedSlotIndex]?.role ?? null : null;

  if (!loading && players.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Tácticas" />
        <EmptyState
          className="card"
          icon={Users}
          title="No hay jugadores para alinear"
          description="Añade jugadores a tu plantilla y aquí podrás armar el once inicial."
          action={
            <Link to="/squad" className="btn-primary">
              Ir a la plantilla
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <PageHeader
        title="Tácticas"
        subtitle={`${activeSeason ? `Temporada ${activeSeason.year_label}` : 'Sin temporada activa'} · Toca un jugador para cambiarlo`}
        actions={
          <button type="button" onClick={handleBestXI} className="btn-secondary" disabled={players.length === 0}>
            <Sparkles size={18} className="text-neon-400" />
            Mejor XI
          </button>
        }
      />

      <FormationPicker value={currentScheme} onChange={handleFormationChange} />

      <TeamRatings ratings={ratings} />

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {loading ? (
            <div className="skeleton mx-auto aspect-[7/10] w-full max-w-[560px] rounded-3xl sm:aspect-[4/5]" />
          ) : (
            <PitchBoard
              scheme={currentScheme}
              startingXI={startingXI}
              selectedSlotIndex={selectedSlotIndex}
              onSelectSlot={setSelectedSlotIndex}
              onSwapSlots={(a, b) => swapPitchSlots(seasonId, a, b)}
              onDropBenchPlayer={putOnPitch}
            />
          )}
        </div>

        <div className="lg:col-span-5">
          <BenchList
            benchPlayers={benchPlayers}
            selectedRole={selectedRole}
            onPick={(playerId) => selectedSlotIndex !== null && putOnPitch(selectedSlotIndex, playerId)}
          />
        </div>
      </div>

      {selectedSlotIndex !== null && selectedRole && (
        <>
          {/* Room so the end of the page can scroll above the tray */}
          <div aria-hidden="true" className="h-44 lg:hidden" />
          <SwapTray
            role={selectedRole}
            currentPlayer={startingXI[selectedSlotIndex]}
            benchPlayers={benchPlayers}
            onPick={(playerId) => putOnPitch(selectedSlotIndex, playerId)}
            onCancel={() => setSelectedSlotIndex(null)}
          />
        </>
      )}
    </div>
  );
}
