// ============================================================
// src/pages/Dashboard.tsx
// Career overview dashboard with key stats at a glance.
// ============================================================

import { useAppStore } from '../store/useAppStore';
import { usePlayers } from '../hooks/usePlayers';
import { useSeasons } from '../hooks/useSeasons';
import { useTrophies } from '../hooks/useTrophies';
import { formatValue } from '../lib/constants';
import { Users, Trophy, TrendingUp, Star, Plus, Calendar, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { clsx } from 'clsx';

export default function Dashboard() {
  const { activeCareer, activeSeason } = useAppStore();
  const { players, loading: playersLoading } = usePlayers(activeCareer?.id ?? null, activeSeason?.id ?? null);
  const { seasons, createSeason, loading: seasonsLoading } = useSeasons(activeCareer?.id ?? null);
  const { trophies } = useTrophies(activeSeason?.id ?? null);
  const navigate = useNavigate();
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ year_label: string }>();

  if (!activeCareer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Star size={48} className="text-white/20" />
        <p className="text-white/50 text-lg">No career selected</p>
        <button onClick={() => navigate('/careers')} className="btn-primary">
          <Plus size={16} /> Select or Create a Career
        </button>
      </div>
    );
  }

  // Computed stats
  const totalGoals = players.reduce((sum, p) => sum + (p.stats?.goals ?? 0), 0);
  const totalAssists = players.reduce((sum, p) => sum + (p.stats?.assists ?? 0), 0);
  const avgOvr = players.length
    ? Math.round(players.reduce((sum, p) => sum + (p.stats?.ovr_start ?? 75), 0) / players.length)
    : 0;

  const topScorer = [...players].sort((a, b) => (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0))[0];

  const handleCreateSeason = async (data: { year_label: string }) => {
    await createSeason(data.year_label);
    reset();
    setShowSeasonForm(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">
            {activeCareer.club_name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {activeCareer.league && (
              <span className="text-sm text-white/50">{activeCareer.league}</span>
            )}
            {activeSeason && (
              <>
                <span className="text-white/20">·</span>
                <span className="badge bg-neon-400/10 text-neon-400 border-neon-400/20">
                  Season {activeSeason.season_number} — {activeSeason.year_label}
                </span>
                {activeSeason.is_closed && (
                  <span className="badge bg-white/5 text-white/30 border-white/10">Closed</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* New Season button */}
        {!activeSeason && (
          <button onClick={() => setShowSeasonForm(true)} className="btn-primary">
            <Calendar size={16} /> Start Season
          </button>
        )}
      </div>

      {/* Season form */}
      {showSeasonForm && (
        <div className="glass-card p-4 animate-fade-in">
          <form onSubmit={handleSubmit(handleCreateSeason)} className="flex items-end gap-3">
            <div className="form-group flex-1">
              <label className="form-label">Season Year</label>
              <input
                placeholder="e.g. 2025/2026"
                {...register('year_label', { required: true })}
              />
            </div>
            <button type="submit" className="btn-primary">Create</button>
            <button type="button" onClick={() => setShowSeasonForm(false)} className="btn-secondary">Cancel</button>
          </form>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Squad Size', value: players.length, icon: Users, color: 'text-blue-400' },
          { label: 'Season Goals', value: totalGoals, icon: Star, color: 'text-neon-400' },
          { label: 'Season Assists', value: totalAssists, icon: TrendingUp, color: 'text-electric-400' },
          { label: 'Trophies', value: trophies.length, icon: Trophy, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card group card-hover">
            <div className="flex items-center justify-between mb-2">
              <span className="stat-label">{label}</span>
              <Icon size={18} className={clsx(color, 'opacity-60 group-hover:opacity-100 transition-opacity')} />
            </div>
            {playersLoading
              ? <div className="skeleton h-8 w-16 rounded" />
              : <span className={clsx('stat-value text-3xl', color)}>{value}</span>
            }
          </div>
        ))}
      </div>

      {/* Two-column: Top Scorer + Season history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Scorer card */}
        <div className="card p-5">
          <h3 className="font-semibold text-white/70 text-sm uppercase tracking-wider mb-4">
            Top Scorer This Season
          </h3>
          {playersLoading ? (
            <div className="skeleton h-16 rounded-xl" />
          ) : topScorer && topScorer.stats ? (
            <div className="flex items-center gap-4">
              <PlayerAvatar name={topScorer.full_name} position={topScorer.preferred_position} size="lg" />
              <div>
                <p className="font-bold text-white text-lg">{topScorer.full_name}</p>
                <p className="text-white/50 text-sm">{topScorer.preferred_position}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-neon-400 font-bold">{topScorer.stats.goals} <span className="text-white/40 font-normal text-xs">goals</span></span>
                  <span className="text-electric-400 font-bold">{topScorer.stats.assists} <span className="text-white/40 font-normal text-xs">assists</span></span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/30 text-sm">No match data logged yet</p>
          )}
        </div>

        {/* Past seasons */}
        <div className="card p-5">
          <h3 className="font-semibold text-white/70 text-sm uppercase tracking-wider mb-4">
            Season History
          </h3>
          {seasonsLoading ? (
            <div className="skeleton h-16 rounded-xl" />
          ) : seasons.length === 0 ? (
            <p className="text-white/30 text-sm">No seasons yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {seasons.slice().reverse().map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-pitch-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">
                      Season {s.season_number} — {s.year_label}
                    </p>
                  </div>
                  <span className={clsx(
                    'badge text-xs',
                    s.is_closed
                      ? 'bg-white/5 text-white/30 border-white/10'
                      : 'bg-neon-400/10 text-neon-400 border-neon-400/20'
                  )}>
                    {s.is_closed ? 'Closed' : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Manage Squad', icon: Users, to: '/squad' },
          { label: 'Set Lineup', icon: Star, to: '/tactics' },
          { label: 'Log Match', icon: TrendingUp, to: '/stats' },
          { label: 'Scout Players', icon: Trophy, to: '/scouting' },
        ].map(({ label, icon: Icon, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            className="card-hover p-4 flex flex-col items-center gap-2 text-center cursor-pointer"
          >
            <Icon size={22} className="text-neon-400" />
            <span className="text-sm font-medium text-white/80">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Inline mini PlayerAvatar for this page
function PlayerAvatar({ name, position, size = 'md' }: { name: string; position: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'md' ? 'w-10 h-10' : 'w-8 h-8 text-xs';
  return (
    <div className={clsx(
      sizeClass,
      'rounded-xl bg-gradient-to-br from-neon-400/20 to-electric-400/20',
      'border border-white/10 flex items-center justify-center font-bold text-white flex-shrink-0'
    )}>
      {initials}
    </div>
  );
}
