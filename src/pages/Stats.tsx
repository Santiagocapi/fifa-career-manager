// ============================================================
// src/pages/Stats.tsx
// Match logger + performance charts.
// Phase 4 — Full implementation coming after Tactics.
// ============================================================

import { useAppStore } from '../store/useAppStore';
import { usePlayers } from '../hooks/usePlayers';
import { BarChart2, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { POSITION_COLORS, getPositionGroup } from '../lib/constants';
import { clsx } from 'clsx';

interface MatchLogData {
  player_id: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheets: number;
  played: boolean;
}

export default function Stats() {
  const { activeCareer, activeSeason } = useAppStore();
  const { players, loading, logMatchStats } = usePlayers(
    activeCareer?.id ?? null,
    activeSeason?.id ?? null
  );
  const [logging, setLogging] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<MatchLogData>();

  // Prepare chart data: top 10 players by goals
  const chartData = [...players]
    .filter(p => (p.stats?.goals ?? 0) > 0 || (p.stats?.assists ?? 0) > 0)
    .sort((a, b) => (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0))
    .slice(0, 10)
    .map(p => ({
      name: p.full_name.split(' ').pop() ?? p.full_name,
      goals: p.stats?.goals ?? 0,
      assists: p.stats?.assists ?? 0,
    }));

  const onSubmit = async (data: MatchLogData) => {
    if (!activeSeason) return;
    await logMatchStats(data.player_id, activeSeason.id, {
      goals: Number(data.goals) || 0,
      assists: Number(data.assists) || 0,
      yellowCards: Number(data.yellow_cards) || 0,
      redCards: Number(data.red_cards) || 0,
      cleanSheets: Number(data.clean_sheets) || 0,
      played: data.played,
    });
    reset();
    setLogging(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Performance Stats</h1>
          <p className="text-white/50 text-sm mt-1">{activeSeason?.year_label ?? 'No active season'}</p>
        </div>
        <button onClick={() => setLogging(true)} className="btn-primary">
          <Plus size={16} /> Log Match
        </button>
      </div>

      {/* Match Logger Modal */}
      {logging && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in">
            <h3 className="font-bold text-white text-lg mb-5">Log Match Performance</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Player *</label>
                <select {...register('player_id', { required: true })} className="w-full">
                  <option value="">Select player</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.preferred_position})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="played" {...register('played')} className="w-4 h-4" />
                <label htmlFor="played" className="form-label cursor-pointer">Match Played (+1)</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'goals', label: '⚽ Goals' },
                  { name: 'assists', label: '🅰️ Assists' },
                  { name: 'yellow_cards', label: '🟨 Yellow Cards' },
                  { name: 'red_cards', label: '🟥 Red Cards' },
                  { name: 'clean_sheets', label: '🧤 Clean Sheets' },
                ].map(f => (
                  <div key={f.name} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input type="number" min={0} defaultValue={0}
                      {...register(f.name as keyof MatchLogData)} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                </button>
                <button type="button" onClick={() => setLogging(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goals + Assists Chart */}
      {chartData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-white mb-4">Goals & Assists Leaders</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#ffffff60', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff60', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12 }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Bar dataKey="goals" fill="#00ff87" radius={[4, 4, 0, 0]} />
              <Bar dataKey="assists" fill="#00c8ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-3">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <div className="w-3 h-3 rounded-sm bg-neon-400" /> Goals
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <div className="w-3 h-3 rounded-sm bg-electric-400" /> Assists
            </div>
          </div>
        </div>
      )}

      {/* Player Stats Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-pitch-700">
          <h3 className="font-semibold text-white">Season Stats</h3>
        </div>
        {loading ? (
          <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-neon-400" size={24} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pitch-700">
                  {['Player', 'Pos', 'MP', 'G', 'A', 'YC', 'RC', 'CS'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-white/40 uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((player, i) => {
                  const colors = POSITION_COLORS[getPositionGroup(player.preferred_position)];
                  return (
                    <tr key={player.id} className={clsx(
                      'border-b border-pitch-700/50 hover:bg-pitch-700/30 transition-colors',
                      i % 2 === 0 ? 'bg-pitch-800/30' : ''
                    )}>
                      <td className="px-4 py-3 font-medium text-white">{player.full_name}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge text-[10px]', colors.badge)}>{player.preferred_position}</span>
                      </td>
                      <td className="px-4 py-3 text-white/70">{player.stats?.matches_played ?? 0}</td>
                      <td className="px-4 py-3 text-neon-400 font-bold">{player.stats?.goals ?? 0}</td>
                      <td className="px-4 py-3 text-electric-400 font-bold">{player.stats?.assists ?? 0}</td>
                      <td className="px-4 py-3 text-amber-400">{player.stats?.yellow_cards ?? 0}</td>
                      <td className="px-4 py-3 text-red-400">{player.stats?.red_cards ?? 0}</td>
                      <td className="px-4 py-3 text-white/50">{player.stats?.clean_sheets ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {players.length === 0 && (
              <p className="text-center text-white/30 py-8">No players in this season yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
