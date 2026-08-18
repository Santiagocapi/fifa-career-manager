// ============================================================
// src/pages/History.tsx
// Trophy cabinet + season archive.
// ============================================================

import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useSeasons } from '../hooks/useSeasons';
import { useTrophies } from '../hooks/useTrophies';
import { usePlayers } from '../hooks/usePlayers';
import { TROPHY_TYPES, formatValue } from '../lib/constants';
import { Trophy, Plus, X, Loader2, Calendar, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { clsx } from 'clsx';
import type { TrophyType, CreateTrophyDto } from '../types/database';

interface TrophyFormData {
  trophy_name: string;
  trophy_type: TrophyType;
  icon: string;
}

export default function History() {
  const { activeCareer, activeSeason } = useAppStore();
  const { seasons, loading: seasonsLoading } = useSeasons(activeCareer?.id ?? null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [showTrophyForm, setShowTrophyForm] = useState(false);

  // View selected season or active season
  const viewingSeasonId = selectedSeasonId ?? activeSeason?.id ?? null;
  const viewingSeason = seasons.find(s => s.id === viewingSeasonId);

  const { trophies, addTrophy, deleteTrophy } = useTrophies(viewingSeasonId);
  const { players: seasonPlayers } = usePlayers(activeCareer?.id ?? null, viewingSeasonId);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<TrophyFormData>();

  const onSubmit = async (data: TrophyFormData) => {
    if (!viewingSeasonId) return;
    const dto: CreateTrophyDto = {
      season_id: viewingSeasonId,
      trophy_name: data.trophy_name,
      trophy_type: data.trophy_type,
      icon: data.icon || '🏆',
    };
    await addTrophy(dto);
    reset();
    setShowTrophyForm(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">History</h1>
          <p className="text-white/50 text-sm mt-1">Trophy cabinet & season archives</p>
        </div>
        <button
          onClick={() => setShowTrophyForm(true)}
          className="btn-primary"
          disabled={!viewingSeasonId}
        >
          <Plus size={16} /> Add Trophy
        </button>
      </div>

      {/* Trophy Form Modal */}
      {showTrophyForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Add Trophy</h3>
              <button onClick={() => setShowTrophyForm(false)} className="btn-ghost p-2"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Trophy Name *</label>
                <input placeholder="Champions League" {...register('trophy_name', { required: true })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select {...register('trophy_type', { required: true })} className="w-full">
                    {TROPHY_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Icon (emoji)</label>
                  <input placeholder="🏆" {...register('icon')} />
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add Trophy
                </button>
                <button type="button" onClick={() => setShowTrophyForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Season Timeline */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-neon-400" />
              Seasons
            </h3>
            {seasonsLoading ? (
              <div className="skeleton h-24 rounded-xl" />
            ) : (
              <div className="flex flex-col gap-2">
                {seasons.slice().reverse().map(season => (
                  <button
                    key={season.id}
                    onClick={() => setSelectedSeasonId(season.id === viewingSeasonId ? null : season.id)}
                    className={clsx(
                      'w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm',
                      viewingSeasonId === season.id
                        ? 'bg-neon-400/10 border border-neon-400/30 text-neon-400'
                        : 'hover:bg-pitch-700/50 text-white/60 hover:text-white border border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Season {season.season_number}</span>
                      <span className={clsx(
                        'badge text-[10px]',
                        season.is_closed
                          ? 'bg-white/5 text-white/30 border-white/10'
                          : 'bg-neon-400/10 text-neon-400 border-neon-400/20'
                      )}>
                        {season.is_closed ? 'Done' : 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">{season.year_label}</p>
                  </button>
                ))}
                {seasons.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-4">No seasons yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Season Detail */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {viewingSeason ? (
            <>
              {/* Trophy Shelf */}
              <div className="card p-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy size={16} className="text-amber-400" />
                  Trophies — {viewingSeason.year_label}
                </h3>
                {trophies.length === 0 ? (
                  <p className="text-white/30 text-sm">No trophies this season</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {trophies.map(trophy => (
                      <div key={trophy.id} className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all">
                        <span className="text-2xl">{trophy.icon ?? '🏆'}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{trophy.trophy_name}</p>
                          <p className="text-xs text-white/40 capitalize">{trophy.trophy_type}</p>
                        </div>
                        <button
                          onClick={() => deleteTrophy(trophy.id)}
                          className="btn-danger p-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Season Player Snapshot */}
              <div className="card p-5">
                <h3 className="font-semibold text-white mb-4">Player Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-pitch-700">
                        {['Player', 'OVR', 'Growth', 'Goals', 'Assists', 'Value'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs text-white/40 uppercase tracking-wider font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {seasonPlayers.map((player) => {
                        const growth = player.stats
                          ? (player.stats.ovr_end ?? player.stats.ovr_start ?? 0) - (player.stats.ovr_start ?? 0)
                          : null;
                        return (
                          <tr key={player.id} className="border-b border-pitch-700/50 hover:bg-pitch-700/20">
                            <td className="px-3 py-2 font-medium text-white">{player.full_name}</td>
                            <td className="px-3 py-2 text-white/70">{player.stats?.ovr_end ?? player.stats?.ovr_start ?? '—'}</td>
                            <td className="px-3 py-2">
                              {growth !== null && growth !== 0 ? (
                                <span className={clsx('font-bold text-xs', growth > 0 ? 'text-neon-400' : 'text-red-400')}>
                                  {growth > 0 ? '+' : ''}{growth}
                                </span>
                              ) : <span className="text-white/30">—</span>}
                            </td>
                            <td className="px-3 py-2 text-neon-400 font-bold">{player.stats?.goals ?? 0}</td>
                            <td className="px-3 py-2 text-electric-400 font-bold">{player.stats?.assists ?? 0}</td>
                            <td className="px-3 py-2 text-white/50 text-xs">{formatValue(player.stats?.market_value_end ?? player.stats?.market_value_start)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {seasonPlayers.length === 0 && (
                    <p className="text-center text-white/30 py-6 text-sm">No players found for this season</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center gap-3">
              <Trophy size={40} className="text-white/20" />
              <p className="text-white/40 text-sm">Select a season from the left to view its history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
