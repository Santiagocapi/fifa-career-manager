// ============================================================
// src/pages/Squad.tsx
// Squad management: view, add, edit players & tenure tracking.
// ============================================================

import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { usePlayers } from '../hooks/usePlayers';
import { POSITIONS, POSITION_COLORS, getPositionGroup, formatValue, formatWage, getPlayerInitials, getPlayerAvatarGradient, dollarsToCents, centsToDollars, getCountryFlag } from '../lib/constants';
import { Plus, Search, Filter, TrendingUp, TrendingDown, Edit2, UserX, Loader2, X, Calendar, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { clsx } from 'clsx';
import type { CreatePlayerDto, PlayerPosition, PlayerWithStats } from '../types/database';

interface PlayerFormData {
  full_name: string;
  preferred_position: PlayerPosition;
  nationality: string;
  age: number;
  joined_year: number;
  ovr_start: number;
  market_value_start: number;
  salary: number;
}

export default function Squad() {
  const { activeCareer, activeSeason } = useAppStore();
  const { players, loading, addPlayer, updatePlayer, updateStats, deactivatePlayer } = usePlayers(
    activeCareer?.id ?? null,
    activeSeason?.id ?? null
  );

  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithStats | null>(null);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<PlayerFormData>();

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !filterGroup || getPositionGroup(p.preferred_position) === filterGroup;
    return matchesSearch && matchesFilter;
  });

  const openAddForm = () => {
    reset({
      full_name: '',
      preferred_position: 'CM',
      nationality: '',
      age: 21,
      joined_year: new Date().getFullYear(),
      ovr_start: 75,
      market_value_start: 5000000,
      salary: 15000,
    });
    setEditingPlayer(null);
    setShowForm(true);
  };

  const openEditForm = (player: PlayerWithStats) => {
    setEditingPlayer(player);
    reset({
      full_name: player.full_name,
      preferred_position: player.preferred_position,
      nationality: player.nationality || '',
      age: player.age || 21,
      joined_year: player.joined_year || new Date().getFullYear(),
      ovr_start: player.stats?.ovr_start || 75,
      market_value_start: centsToDollars(player.stats?.market_value_start),
      salary: centsToDollars(player.stats?.salary),
    });
    setShowForm(true);
  };

  const onSubmit = async (data: PlayerFormData) => {
    if (!activeCareer) return;

    if (editingPlayer) {
      // Edit existing player
      await updatePlayer(editingPlayer.id, {
        full_name: data.full_name,
        preferred_position: data.preferred_position,
        nationality: data.nationality || null,
        age: data.age || null,
        joined_year: data.joined_year || new Date().getFullYear(),
      });

      if (activeSeason && editingPlayer.stats) {
        await updateStats(editingPlayer.id, activeSeason.id, {
          ovr_start: data.ovr_start,
          market_value_start: dollarsToCents(data.market_value_start),
          salary: dollarsToCents(data.salary),
        });
      }
    } else {
      // Create new player
      const playerDto: CreatePlayerDto = {
        career_id: activeCareer.id,
        full_name: data.full_name,
        preferred_position: data.preferred_position,
        nationality: data.nationality || null,
        age: data.age || null,
        joined_year: data.joined_year || new Date().getFullYear(),
        date_of_birth: null,
        photo_url: null,
        is_active: true,
      };
      await addPlayer(playerDto, {
        ovr_start: data.ovr_start,
        market_value_start: data.market_value_start,
        salary: data.salary,
      });
    }

    reset();
    setEditingPlayer(null);
    setShowForm(false);
  };

  const positionGroups = ['GK', 'DEF', 'MID', 'FWD'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Squad</h1>
          <p className="text-white/50 text-sm mt-1">
            {players.length} players · {activeSeason?.year_label ?? 'No active season'}
          </p>
        </div>
        <button onClick={openAddForm} className="btn-primary">
          <Plus size={16} /> Add Player
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players..."
            className="pl-10 w-full"
          />
        </div>
        <div className="flex gap-2">
          {positionGroups.map(group => (
            <button
              key={group}
              onClick={() => setFilterGroup(filterGroup === group ? null : group)}
              className={clsx(
                'badge cursor-pointer transition-all',
                filterGroup === group
                  ? POSITION_COLORS[group].badge
                  : 'bg-pitch-700 text-white/50 border-pitch-600 hover:text-white'
              )}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Add / Edit Player Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                {editingPlayer ? 'Edit Player Details' : 'Add New Player'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-2">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group col-span-2">
                  <label className="form-label">Full Name *</label>
                  <input placeholder="Lionel Messi" {...register('full_name', { required: 'Required' })} />
                  {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Position *</label>
                  <select {...register('preferred_position', { required: 'Required' })} className="w-full">
                    <option value="">Select position</option>
                    {POSITIONS.map(p => (
                      <option key={p.value} value={p.value}>{p.label} ({p.value})</option>
                    ))}
                  </select>
                  {errors.preferred_position && <p className="form-error">{errors.preferred_position.message}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Nationality</label>
                  <input placeholder="Argentina" {...register('nationality')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" min={14} max={50} placeholder="21" {...register('age', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Joined Year</label>
                  <input type="number" min={2000} max={2060} placeholder="2024" {...register('joined_year', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label className="form-label">OVR (Start of Season)</label>
                  <input type="number" min={1} max={99} placeholder="75" {...register('ovr_start', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Market Value ($)</label>
                  <input type="number" min={0} placeholder="5000000" {...register('market_value_start', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weekly Wage ($)</label>
                  <input type="number" min={0} placeholder="15000" {...register('salary', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : editingPlayer ? <Save size={16} /> : <Plus size={16} />}
                  {editingPlayer ? 'Save Changes' : 'Add Player'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Player Grid — grouped by position (GK → DEF → MID → FWD) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : (() => {
        // Sort players by position group order, then by position code within group
        const GROUP_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
        const GROUP_LABELS: Record<string, string> = {
          GK: 'Goalkeepers',
          DEF: 'Defenders',
          MID: 'Midfielders',
          FWD: 'Forwards',
        };

        const sorted = [...filteredPlayers].sort((a, b) => {
          const ga = GROUP_ORDER[getPositionGroup(a.preferred_position)] ?? 9;
          const gb = GROUP_ORDER[getPositionGroup(b.preferred_position)] ?? 9;
          if (ga !== gb) return ga - gb;
          return a.preferred_position.localeCompare(b.preferred_position);
        });

        // Group players — only insert section headers when no filter is active
        const showSectionHeaders = !filterGroup;
        const rendered: JSX.Element[] = [];
        let lastGroup = '';
        let animIdx = 0;

        for (const player of sorted) {
          const group = getPositionGroup(player.preferred_position);
          const colors = POSITION_COLORS[group];
          const initials = getPlayerInitials(player.full_name);
          const [gradStart, gradEnd] = getPlayerAvatarGradient(player.full_name);
          const ovrGrowth = player.stats
            ? (player.stats.ovr_end ?? player.stats.ovr_start ?? 0) - (player.stats.ovr_start ?? 0)
            : null;
          const flag = getCountryFlag(player.nationality);

          // Insert section header when group changes
          if (showSectionHeaders && group !== lastGroup) {
            lastGroup = group;
            const groupCount = sorted.filter(p => getPositionGroup(p.preferred_position) === group).length;
            rendered.push(
              <div key={`header-${group}`} className="col-span-full flex items-center gap-3 mt-2 first:mt-0">
                <span className={clsx('badge text-xs font-bold', colors.badge)}>
                  {group}
                </span>
                <span className="text-sm font-semibold text-white/60">{GROUP_LABELS[group]}</span>
                <span className="text-xs text-white/30">({groupCount})</span>
                <div className="flex-1 h-px bg-pitch-700" />
              </div>
            );
          }

          rendered.push(
            <div
              key={player.id}
              className="card p-4 flex flex-col gap-3 animate-fade-in group hover:border-white/10 transition-all relative"
              style={{ animationDelay: `${animIdx++ * 30}ms` }}
            >
              {/* Edit Button */}
              <button
                onClick={() => openEditForm(player)}
                className="absolute top-3 right-3 btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Edit Player"
              >
                <Edit2 size={14} />
              </button>

              {/* Card top: avatar + position + OVR */}
              <div className="flex items-start gap-3 pr-6">
                {/* Dynamic Avatar */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 border border-white/10"
                  style={{ background: `linear-gradient(135deg, ${gradStart}40, ${gradEnd}40)` }}
                >
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{player.full_name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={clsx('badge text-[10px]', colors.badge)}>
                      {player.preferred_position}
                    </span>
                    {player.age && (
                      <span className="text-xs text-white/70 font-medium">{player.age} yrs</span>
                    )}
                    {flag && player.nationality && (
                      <span className="text-sm" title={player.nationality}>{flag}</span>
                    )}
                    {player.joined_year && (
                      <span className="text-[10px] text-neon-400/80 bg-neon-400/10 px-1.5 py-0.5 rounded font-mono">
                        Since {player.joined_year}
                      </span>
                    )}
                  </div>
                </div>

                {/* OVR */}
                {player.stats?.ovr_start && (
                  <div className="flex flex-col items-center">
                    <span className="ovr-badge text-sm">
                      {player.stats.ovr_end ?? player.stats.ovr_start}
                    </span>
                    {ovrGrowth !== null && ovrGrowth !== 0 && (
                      <span className={clsx(
                        'text-[10px] font-bold flex items-center gap-0.5 mt-0.5',
                        ovrGrowth > 0 ? 'text-neon-400' : 'text-red-400'
                      )}>
                        {ovrGrowth > 0
                          ? <TrendingUp size={10} />
                          : <TrendingDown size={10} />
                        }
                        {ovrGrowth > 0 ? '+' : ''}{ovrGrowth}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Stats row */}
              {player.stats && (
                <div className="grid grid-cols-4 gap-1 pt-2 border-t border-pitch-700">
                  {[
                    { label: 'G', value: player.stats.goals },
                    { label: 'A', value: player.stats.assists },
                    { label: 'MP', value: player.stats.matches_played },
                    { label: 'YC', value: player.stats.yellow_cards },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-xs font-bold text-white">{value}</p>
                      <p className="text-[10px] text-white/40">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Value & Wage */}
              {(player.stats?.market_value_start || player.stats?.salary) && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-pitch-700">
                  <div>
                    <span className="text-white/40 text-[10px] uppercase tracking-wider block">Valuation</span>
                    <span className="text-white/80 font-medium">
                      {formatValue(player.stats?.market_value_end ?? player.stats?.market_value_start)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 text-[10px] uppercase tracking-wider block">Weekly Wage</span>
                    <span className="text-neon-400 font-medium">
                      {formatWage(player.stats?.salary)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (sorted.length === 0) {
          rendered.push(
            <div key="empty" className="col-span-full card p-12 text-center">
              <p className="text-white/30">No players found</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rendered}
          </div>
        );
      })()}
    </div>
  );
}
