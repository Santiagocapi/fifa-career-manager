// ============================================================
// src/pages/Squad.tsx
// Squad management: search, filter and sort players, and add or
// edit them from a bottom sheet.
// ============================================================

import { useMemo, useState } from 'react';
import { Plus, Search, SearchX, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { usePlayers } from '../hooks/usePlayers';
import {
  POSITION_GROUPS,
  POSITION_COLORS,
  getPositionGroup,
  sortPlayersByPosition,
  dollarsToCents,
  type PositionGroup,
} from '../lib/constants';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import InlineAlert from '../components/ui/InlineAlert';
import PlayerCard from '../components/squad/PlayerCard';
import PlayerFormSheet, { type PlayerFormData } from '../components/squad/PlayerFormSheet';
import type { CreatePlayerDto, PlayerWithStats } from '../types/database';

type SortKey = 'position' | 'ovr' | 'age' | 'value';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'position', label: 'Posición' },
  { value: 'ovr', label: 'Media' },
  { value: 'age', label: 'Edad' },
  { value: 'value', label: 'Valor' },
];

const currentOvr = (p: PlayerWithStats) => p.stats?.ovr_end ?? p.stats?.ovr_start ?? 0;
const currentValue = (p: PlayerWithStats) => p.stats?.market_value_end ?? p.stats?.market_value_start ?? 0;

// Empty number inputs come back as NaN from react-hook-form
const numberOrNull = (value: number) => (Number.isFinite(value) ? value : null);

export default function Squad() {
  const { activeCareer, activeSeason } = useAppStore();
  const { players, loading, error, addPlayer, updatePlayer, updateStats } = usePlayers(
    activeCareer?.id ?? null,
    activeSeason?.id ?? null
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithStats | null>(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<PositionGroup | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('position');

  const visiblePlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = players.filter(
      (p) =>
        (!query || p.full_name.toLowerCase().includes(query)) &&
        (!groupFilter || getPositionGroup(p.preferred_position) === groupFilter)
    );
    if (sortKey === 'position') return sortPlayersByPosition(filtered);
    const sorted = [...filtered];
    if (sortKey === 'ovr') sorted.sort((a, b) => currentOvr(b) - currentOvr(a));
    if (sortKey === 'age') sorted.sort((a, b) => (a.age ?? 99) - (b.age ?? 99));
    if (sortKey === 'value') sorted.sort((a, b) => currentValue(b) - currentValue(a));
    return sorted;
  }, [players, search, groupFilter, sortKey]);

  const groupCounts = useMemo(() => {
    const counts: Record<PositionGroup, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    players.forEach((p) => counts[getPositionGroup(p.preferred_position)]++);
    return counts;
  }, [players]);

  const openAddSheet = () => {
    setEditingPlayer(null);
    setSheetOpen(true);
  };

  const openEditSheet = (player: PlayerWithStats) => {
    setEditingPlayer(player);
    setSheetOpen(true);
  };

  const handleSubmit = async (data: PlayerFormData) => {
    if (!activeCareer) return;
    const base = {
      full_name: data.full_name.trim(),
      preferred_position: data.preferred_position,
      nationality: data.nationality.trim() || null,
      age: numberOrNull(data.age),
      joined_year: numberOrNull(data.joined_year) ?? new Date().getFullYear(),
    };

    if (editingPlayer) {
      await updatePlayer(editingPlayer.id, base);
      if (activeSeason && editingPlayer.stats) {
        await updateStats(editingPlayer.id, activeSeason.id, {
          ovr_start: numberOrNull(data.ovr_start),
          market_value_start: dollarsOrNull(data.market_value_start),
          salary: dollarsOrNull(data.salary),
          is_injured: data.is_injured,
        });
      }
    } else {
      const playerDto: CreatePlayerDto = {
        ...base,
        career_id: activeCareer.id,
        date_of_birth: null,
        photo_url: null,
        is_active: true,
      };
      await addPlayer(playerDto, {
        ovr_start: numberOrNull(data.ovr_start),
        market_value_start: numberOrNull(data.market_value_start) ?? undefined,
        salary: numberOrNull(data.salary) ?? undefined,
      });
    }

    setSheetOpen(false);
    setEditingPlayer(null);
  };

  const showGroupHeaders = sortKey === 'position' && !groupFilter;
  const hasFilters = search.trim() !== '' || groupFilter !== null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Plantilla"
        subtitle={`${players.length} jugadores · ${activeSeason ? `Temporada ${activeSeason.year_label}` : 'Sin temporada activa'}`}
        primaryAction={{ label: 'Añadir jugador', icon: Plus, onClick: openAddSheet }}
      />

      {error && <InlineAlert>{error}</InlineAlert>}

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jugador"
              aria-label="Buscar jugador"
              className="pl-11"
            />
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Ordenar por"
            className="w-[8.5rem] flex-shrink-0"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar por línea">
          <button type="button" aria-pressed={groupFilter === null} onClick={() => setGroupFilter(null)} className="chip">
            Todos <span className="tabular-nums opacity-60">{players.length}</span>
          </button>
          {POSITION_GROUPS.map((group) => (
            <button
              key={group.value}
              type="button"
              aria-pressed={groupFilter === group.value}
              onClick={() => setGroupFilter(groupFilter === group.value ? null : group.value)}
              className="chip"
            >
              {group.label} <span className="tabular-nums opacity-60">{groupCounts[group.value]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Players */}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-[136px] rounded-2xl" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <EmptyState
          className="card"
          icon={Users}
          title="Tu plantilla está vacía"
          description="Añade a tus jugadores para seguir su media, valor y estadísticas."
          action={
            <button type="button" onClick={openAddSheet} className="btn-primary">
              <Plus size={18} /> Añadir jugador
            </button>
          }
        />
      ) : visiblePlayers.length === 0 ? (
        <EmptyState
          className="card"
          icon={SearchX}
          title="Ningún jugador coincide"
          description="Prueba con otro nombre o quita los filtros."
          action={
            hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setGroupFilter(null);
                }}
                className="btn-secondary"
              >
                Quitar filtros
              </button>
            )
          }
        />
      ) : showGroupHeaders ? (
        <div className="flex flex-col gap-5">
          {POSITION_GROUPS.map((group) => {
            const groupPlayers = visiblePlayers.filter((p) => getPositionGroup(p.preferred_position) === group.value);
            if (groupPlayers.length === 0) return null;
            return (
              <section key={group.value} aria-labelledby={`group-${group.value}`}>
                <h2
                  id={`group-${group.value}`}
                  className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 -mx-4 mb-2 flex items-center gap-2 bg-pitch-900/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 md:static md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-none"
                >
                  <span className={clsx('h-2.5 w-2.5 rounded-full', POSITION_COLORS[group.value].bg, POSITION_COLORS[group.value].border, 'border')} />
                  <span className="text-sm font-bold text-white">{group.label}</span>
                  <span className="text-xs text-white/40">{groupPlayers.length}</span>
                </h2>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {groupPlayers.map((player) => (
                    <PlayerCard key={player.id} player={player} onEdit={openEditSheet} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visiblePlayers.map((player) => (
            <PlayerCard key={player.id} player={player} onEdit={openEditSheet} />
          ))}
        </div>
      )}

      <PlayerFormSheet
        open={sheetOpen}
        player={editingPlayer}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function dollarsOrNull(value: number): number | null {
  const dollars = numberOrNull(value);
  return dollars === null ? null : dollarsToCents(dollars);
}
