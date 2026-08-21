// ============================================================
// src/pages/Scouting.tsx
// Scouting & Transfer Hub with 4 Watchlists (Wonderkids, Targets,
// Free Agents, Sell List), Squad Player Auto-Fill, Search & Sign to Club.
// ============================================================

import React, { useState, useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import { useScouting } from "../hooks/useScouting";
import { usePlayers } from "../hooks/usePlayers";
import { SCOUTING_LIST_TYPES, formatValue } from "../lib/constants";
import ScoutCard from "../components/scouting/ScoutCard";
import {
  Plus,
  Loader2,
  X,
  Search,
  UserPlus,
  Compass,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { clsx } from "clsx";
import type {
  ScoutingListType,
  CreateScoutingEntryDto,
  ScoutingEntry,
} from "../types/database";

interface ScoutFormData {
  full_name: string;
  position: string;
  nationality: string;
  current_club: string;
  current_ovr: number;
  estimated_value: number;
  list_type: ScoutingListType;
  notes: string;
}

export default function Scouting() {
  const { activeCareer, activeSeason } = useAppStore();
  const { entries, byList, loading, addEntry, moveEntry, deleteEntry, signToSquad } =
    useScouting(activeCareer?.id ?? null);
  const { players, refetch: refetchPlayers } = usePlayers(
    activeCareer?.id ?? null,
    activeSeason?.id ?? null
  );

  const [showForm, setShowForm] = useState(false);
  const [defaultList, setDefaultList] = useState<ScoutingListType>("target");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Sign to Squad modal state
  const [signingEntry, setSigningEntry] = useState<ScoutingEntry | null>(null);
  const [signingWage, setSigningWage] = useState<number>(25000);
  const [signingSubmitting, setSigningSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<ScoutFormData>({
    defaultValues: {
      list_type: "target",
    },
  });

  const watchListType = watch("list_type");

  const openForm = (list: ScoutingListType) => {
    setDefaultList(list);
    setValue("list_type", list);
    setShowForm(true);
  };

  // When user picks an existing squad player for "sell list"
  const handleSelectSquadPlayerForSell = (squadPlayerId: string) => {
    const found = players.find((p) => p.id === squadPlayerId);
    if (found) {
      setValue("full_name", found.full_name);
      setValue("position", found.preferred_position);
      setValue("nationality", found.nationality ?? "");
      setValue("current_club", activeCareer?.club_name ?? "My Club");
      const ovr = found.stats?.ovr_end ?? found.stats?.ovr_start ?? 75;
      const val = found.stats?.market_value_end ?? found.stats?.market_value_start ?? 0;
      setValue("current_ovr", ovr);
      setValue("estimated_value", val / 100);
    }
  };

  const onSubmit = async (data: ScoutFormData) => {
    if (!activeCareer) return;
    const dto: CreateScoutingEntryDto = {
      career_id: activeCareer.id,
      full_name: data.full_name,
      position: data.position || null,
      nationality: data.nationality || null,
      current_club: data.current_club || null,
      current_ovr: data.current_ovr || null,
      estimated_value: data.estimated_value ? data.estimated_value * 100 : null,
      list_type: data.list_type,
      notes: data.notes || null,
    };
    await addEntry(dto);
    reset();
    setShowForm(false);
  };

  const handleConfirmSignPlayer = async () => {
    if (!signingEntry || !activeSeason) return;
    setSigningSubmitting(true);
    const wageCents = signingWage * 100;
    const success = await signToSquad(signingEntry, activeSeason.id, wageCents);
    if (success) {
      refetchPlayers();
      setSigningEntry(null);
    }
    setSigningSubmitting(false);
  };

  // Filter entries by search query & category tab
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        searchQuery === "" ||
        e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.position && e.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.current_club && e.current_club.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategoryFilter === "all" || e.list_type === selectedCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [entries, searchQuery, selectedCategoryFilter]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Compass size={28} className="text-amber-400" /> Scouting & Transfer Hub
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Watchlists, Wonderkids, Free Agents & Squad Transfer List
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Search bar */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search target by name or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#141e33] border border-[#223254] text-white text-xs rounded-xl pl-9 pr-3 py-2 w-full focus:outline-none focus:border-amber-400/50"
            />
          </div>

          <button onClick={() => openForm("target")} className="btn-primary flex-shrink-0">
            <Plus size={16} /> Add Scout Target
          </button>
        </div>
      </div>

      {/* Category Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategoryFilter("all")}
          className={clsx(
            "px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer",
            selectedCategoryFilter === "all"
              ? "bg-amber-400 text-slate-950 shadow-md font-black"
              : "bg-[#141e33] text-white/60 hover:text-white border border-[#223254]"
          )}
        >
          All Watchlists ({entries.length})
        </button>

        {SCOUTING_LIST_TYPES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategoryFilter(cat.value)}
            className={clsx(
              "px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              selectedCategoryFilter === cat.value
                ? "bg-amber-400 text-slate-950 shadow-md font-black"
                : "bg-[#141e33] text-white/60 hover:text-white border border-[#223254]"
            )}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            <span className="badge bg-white/10 text-white text-[10px] ml-1">
              {byList[cat.value]?.length ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Add Scout Target Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b border-pitch-700 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Sparkles size={20} className="text-amber-400" /> Add Scout Target / Watchlist Item
              </h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-2">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {/* Category list selector */}
              <div className="form-group">
                <label className="form-label">Watchlist Category *</label>
                <select
                  defaultValue={defaultList}
                  {...register("list_type")}
                  className="w-full bg-pitch-900 border border-pitch-700 text-white rounded-xl p-2.5 text-sm font-bold"
                >
                  {SCOUTING_LIST_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-pitch-900">
                      {t.emoji} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* If Category is SELL LIST, show dropdown of existing squad players! */}
              {watchListType === "sell" && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 flex flex-col gap-2">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus size={14} /> Select Player from Your Squad to Sell
                  </label>
                  <select
                    onChange={(e) => handleSelectSquadPlayerForSell(e.target.value)}
                    className="w-full bg-[#0b111e] border border-amber-400/40 text-white rounded-xl p-2 text-xs font-bold"
                  >
                    <option value="">-- Choose Squad Member --</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id} className="bg-pitch-900 text-white">
                        {p.full_name} ({p.preferred_position}) — OVR:{" "}
                        {p.stats?.ovr_end ?? p.stats?.ovr_start ?? 75}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-white/50">
                    Selecting a squad player auto-fills their details into the sell list entry.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group col-span-2">
                  <label className="form-label">Player Full Name *</label>
                  <input
                    placeholder="e.g. Lamine Yamal"
                    {...register("full_name", { required: true })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Position</label>
                  <select
                    {...register("position")}
                    className="w-full bg-pitch-900 border border-pitch-700 text-white rounded-xl p-2.5 text-sm"
                  >
                    <option value="ST">ST (Striker)</option>
                    <option value="CF">CF (Center Forward)</option>
                    <option value="LW">LW (Left Wing)</option>
                    <option value="RW">RW (Right Wing)</option>
                    <option value="CAM">CAM (Attacking Mid)</option>
                    <option value="CM">CM (Central Mid)</option>
                    <option value="CDM">CDM (Defensive Mid)</option>
                    <option value="LM">LM (Left Mid)</option>
                    <option value="RM">RM (Right Mid)</option>
                    <option value="LB">LB (Left Back)</option>
                    <option value="RB">RB (Right Back)</option>
                    <option value="CB">CB (Center Back)</option>
                    <option value="LWB">LWB (Left Wing Back)</option>
                    <option value="RWB">RWB (Right Wing Back)</option>
                    <option value="GK">GK (Goalkeeper)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Nationality</label>
                  <input placeholder="e.g. Spain" {...register("nationality")} />
                </div>

                <div className="form-group">
                  <label className="form-label">Current Club</label>
                  <input placeholder="e.g. FC Barcelona" {...register("current_club")} />
                </div>

                <div className="form-group">
                  <label className="form-label">OVR Rating</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    placeholder="84"
                    {...register("current_ovr", { valueAsNumber: true })}
                  />
                </div>

                <div className="form-group col-span-2">
                  <label className="form-label">Estimated Market Value ($)</label>
                  <input
                    type="number"
                    placeholder="45000000"
                    {...register("estimated_value", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Scout Notes</label>
                <textarea
                  rows={2}
                  placeholder="Incredible dribbling, high potential, release clause..."
                  {...register("notes")}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Save Scout Target
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Sign to Squad Modal */}
      {signingEntry && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in flex flex-col gap-4 border-amber-400/40">
            <div className="flex items-center justify-between border-b border-pitch-700 pb-3">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <UserPlus size={20} className="text-amber-400" /> Sign Player to Active Squad
              </h3>
              <button onClick={() => setSigningEntry(null)} className="btn-ghost p-2">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white text-base">
                  {signingEntry.full_name}
                </span>
                <span className="badge bg-amber-400 text-slate-950 font-bold uppercase">
                  {signingEntry.position || "CM"}
                </span>
              </div>
              <p className="text-xs text-white/70">
                {signingEntry.current_club ?? "Free Agent"} · {signingEntry.nationality} · OVR:{" "}
                <span className="font-mono font-bold text-amber-300">
                  {signingEntry.current_ovr ?? 75}
                </span>
              </p>
              <p className="text-xs text-emerald-400 font-mono font-bold">
                Valuation:{" "}
                {signingEntry.estimated_value
                  ? formatValue(signingEntry.estimated_value)
                  : "$5.0M"}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Weekly Wage ($ / week)</label>
              <input
                type="number"
                value={signingWage}
                onChange={(e) => setSigningWage(Number(e.target.value))}
                className="w-full bg-pitch-900 border border-pitch-700 text-white rounded-xl p-2.5 font-mono font-bold"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={handleConfirmSignPlayer}
                disabled={signingSubmitting}
                className="btn-primary flex-1 justify-center py-2.5 shadow-lg"
              >
                {signingSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Confirm Signing
              </button>
              <button onClick={() => setSigningEntry(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Watchlists Layout: Kanban Board columns */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : selectedCategoryFilter !== "all" ? (
        // Grid View for Single Filtered Category
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEntries.map((entry) => (
            <ScoutCard
              key={entry.id}
              entry={entry}
              onMove={moveEntry}
              onDelete={deleteEntry}
              onSignPlayer={(e) => setSigningEntry(e)}
            />
          ))}
          {filteredEntries.length === 0 && (
            <div className="col-span-full card p-12 text-center text-white/30 text-sm">
              No scout targets found in this list.
            </div>
          )}
        </div>
      ) : (
        // 4-Column Kanban Board for All Categories
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {SCOUTING_LIST_TYPES.map((listCat) => {
            const catEntries = filteredEntries.filter(
              (e) => e.list_type === listCat.value
            );

            return (
              <div
                key={listCat.value}
                className="flex flex-col gap-3 card p-4 bg-[#0b111e]/80 border-[#223254]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-[#223254] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{listCat.emoji}</span>
                    <h3 className="font-extrabold text-white text-sm">
                      {listCat.label}
                    </h3>
                    <span className="badge bg-pitch-700 text-white/70 border-pitch-600 font-mono font-bold text-[10px]">
                      {catEntries.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openForm(listCat.value)}
                    className="btn-ghost p-1 text-white/50 hover:text-white"
                    title={`Add to ${listCat.label}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Column Scout Cards */}
                <div className="flex flex-col gap-3 min-h-[120px]">
                  {catEntries.map((entry) => (
                    <ScoutCard
                      key={entry.id}
                      entry={entry}
                      onMove={moveEntry}
                      onDelete={deleteEntry}
                      onSignPlayer={(e) => setSigningEntry(e)}
                    />
                  ))}

                  {catEntries.length === 0 && (
                    <div
                      onClick={() => openForm(listCat.value)}
                      className="border-2 border-dashed border-[#223254] hover:border-amber-400/40 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                    >
                      <p className="text-white/30 text-xs font-medium">
                        + Add target to {listCat.label}
                      </p>
                    </div>
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
