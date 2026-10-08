// ============================================================
// src/pages/Scouting.tsx
// Transfer market: four watchlists (wonderkids, targets, free
// agents, sell list), search, and signing scouted players into
// the active squad.
// ============================================================

import { useMemo, useState } from 'react';
import { Plus, Search, SearchX, Telescope } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { useScouting } from '../hooks/useScouting';
import { usePlayers } from '../hooks/usePlayers';
import { SCOUTING_LIST_TYPES, dollarsToCents } from '../lib/constants';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import InlineAlert from '../components/ui/InlineAlert';
import SegmentedTabs, { type TabItem } from '../components/ui/SegmentedTabs';
import { useConfirm } from '../components/ui/confirm';
import ScoutCard from '../components/scouting/ScoutCard';
import ScoutFormSheet, { type ScoutFormData } from '../components/scouting/ScoutFormSheet';
import SignPlayerSheet from '../components/scouting/SignPlayerSheet';
import type { CreateScoutingEntryDto, ScoutingEntry, ScoutingListType } from '../types/database';

type ListFilter = ScoutingListType | 'all';

export default function Scouting() {
  const { activeCareer, activeSeason } = useAppStore();
  const { entries, byList, loading, error, addEntry, moveEntry, deleteEntry, signToSquad } = useScouting(
    activeCareer?.id ?? null
  );
  const { players, refetch: refetchPlayers } = usePlayers(activeCareer?.id ?? null, activeSeason?.id ?? null);
  const confirm = useConfirm();

  const [listFilter, setListFilter] = useState<ListFilter>('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formList, setFormList] = useState<ScoutingListType>('target');
  const [signingEntry, setSigningEntry] = useState<ScoutingEntry | null>(null);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((e) =>
      [e.full_name, e.position, e.current_club, e.nationality].some((field) => field?.toLowerCase().includes(query))
    );
  }, [entries, search]);

  const openForm = (list: ScoutingListType) => {
    setFormList(list);
    setFormOpen(true);
  };

  const handleAdd = async (data: ScoutFormData) => {
    if (!activeCareer) return;
    const dto: CreateScoutingEntryDto = {
      career_id: activeCareer.id,
      full_name: data.full_name.trim(),
      position: data.position || null,
      nationality: data.nationality.trim() || null,
      current_club: data.current_club.trim() || null,
      current_ovr: Number.isFinite(data.current_ovr) ? data.current_ovr : null,
      estimated_value: Number.isFinite(data.estimated_value) && data.estimated_value > 0 ? dollarsToCents(data.estimated_value) : null,
      list_type: data.list_type,
      notes: data.notes.trim() || null,
    };
    const created = await addEntry(dto);
    if (created) {
      setFormOpen(false);
      setListFilter((current) => (current === 'all' ? current : created.list_type));
    }
  };

  const handleDelete = async (entry: ScoutingEntry) => {
    const confirmed = await confirm({
      title: `¿Quitar a ${entry.full_name}?`,
      description: 'Solo se elimina de tu seguimiento; no afecta a tu plantilla.',
      confirmLabel: 'Quitar',
      tone: 'danger',
    });
    if (confirmed) await deleteEntry(entry.id);
  };

  const handleSign = async (entry: ScoutingEntry, wageCents: number) => {
    if (!activeSeason) return;
    const signed = await signToSquad(entry, activeSeason.id, wageCents);
    if (signed) {
      refetchPlayers();
      setSigningEntry(null);
    }
  };

  const tabs: TabItem<ListFilter>[] = [
    { value: 'all', label: 'Todas', count: entries.length },
    ...SCOUTING_LIST_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon, count: byList[t.value].length })),
  ];

  const renderCards = (list: ScoutingEntry[]) =>
    list.map((entry) => (
      <ScoutCard
        key={entry.id}
        entry={entry}
        onMove={moveEntry}
        onDelete={handleDelete}
        onSignPlayer={activeSeason ? setSigningEntry : undefined}
      />
    ));

  const visibleLists = listFilter === 'all' ? SCOUTING_LIST_TYPES : SCOUTING_LIST_TYPES.filter((t) => t.value === listFilter);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Mercado"
        subtitle="Sigue promesas, objetivos, agentes libres y jugadores a vender."
        primaryAction={{
          label: 'Añadir jugador',
          icon: Plus,
          onClick: () => openForm(listFilter === 'all' ? 'target' : listFilter),
        }}
      />

      {error && <InlineAlert>{error}</InlineAlert>}
      {!activeSeason && entries.length > 0 && (
        <InlineAlert tone="info">Crea una temporada en Inicio para poder fichar jugadores.</InlineAlert>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative sm:max-w-sm">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, club o posición"
            aria-label="Buscar en el seguimiento"
            className="pl-11"
          />
        </div>
        <SegmentedTabs
          ariaLabel="Listas de seguimiento"
          value={listFilter}
          onChange={setListFilter}
          items={tabs}
        />
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-48 rounded-2xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          className="card"
          icon={Telescope}
          title="Tu lista de seguimiento está vacía"
          description="Apunta promesas, objetivos de fichaje o jugadores que quieras vender."
          action={
            <button type="button" onClick={() => openForm('target')} className="btn-primary">
              <Plus size={18} /> Añadir jugador
            </button>
          }
        />
      ) : search.trim() && filteredEntries.length === 0 ? (
        <EmptyState className="card" icon={SearchX} title="Nadie coincide con la búsqueda" description="Prueba con otro nombre, club o posición." />
      ) : (
        <div className={clsx('grid items-start gap-5', listFilter === 'all' && 'xl:grid-cols-4 xl:gap-4')}>
          {visibleLists.map((list) => {
            const listEntries = filteredEntries.filter((e) => e.list_type === list.value);
            const Icon = list.icon;
            if (listFilter === 'all' && search.trim() && listEntries.length === 0) return null;
            return (
              <section key={list.value} aria-labelledby={`list-${list.value}`} className="flex flex-col gap-3">
                {listFilter === 'all' && (
                  <div className="flex items-center gap-2">
                    <Icon size={18} className={list.color} />
                    <h2 id={`list-${list.value}`} className="font-bold text-white">
                      {list.label}
                    </h2>
                    <span className="text-xs text-white/40">{listEntries.length}</span>
                    <button
                      type="button"
                      onClick={() => openForm(list.value)}
                      aria-label={`Añadir a ${list.label}`}
                      className="icon-btn ml-auto h-9 w-9"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                )}
                {listFilter !== 'all' && (
                  <h2 id={`list-${list.value}`} className="sr-only">
                    {list.label}
                  </h2>
                )}

                {listEntries.length > 0 ? (
                  <div className={clsx('grid gap-3', listFilter === 'all' ? 'sm:grid-cols-2 xl:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')}>
                    {renderCards(listEntries)}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openForm(list.value)}
                    className="flex min-h-[5rem] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pitch-600 px-4 text-sm font-medium text-white/45 transition-colors hover:border-neon-400/40 hover:text-white/70"
                  >
                    <Plus size={16} /> Añadir a {list.label.toLowerCase()}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}

      <ScoutFormSheet
        open={formOpen}
        defaultList={formList}
        squad={players}
        clubName={activeCareer?.club_name ?? ''}
        onClose={() => setFormOpen(false)}
        onSubmit={handleAdd}
      />

      <SignPlayerSheet
        entry={signingEntry}
        seasonLabel={activeSeason?.year_label ?? ''}
        onClose={() => setSigningEntry(null)}
        onConfirm={handleSign}
      />
    </div>
  );
}
