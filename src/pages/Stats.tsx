// ============================================================
// src/pages/Stats.tsx
// Performance stats, Match Logger (Opponent, Score, MVP),
// Head-to-Head (H2H) records vs Opponents, and Leaderboards.
// ============================================================

import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { usePlayers } from '../hooks/usePlayers';
import { useMatches } from '../hooks/useMatches';
import { POSITION_COLORS, getPositionGroup } from '../lib/constants';
import { BarChart2, Plus, Loader2, Trophy, Swords, Star, Calendar, Check, X, Shield, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { clsx } from 'clsx';

interface PlayerMatchPerformance {
  player_id: string;
  goals: number;
  assists: number;
  yellow_card: boolean;
  red_card: boolean;
  clean_sheet: boolean;
}

export default function Stats() {
  const { activeCareer, activeSeason } = useAppStore();
  const { players, loading: playersLoading, refetch: refetchPlayers } = usePlayers(
    activeCareer?.id ?? null,
    activeSeason?.id ?? null
  );

  const { matches, h2hRecords, loading: matchesLoading, logMatch, deleteMatch } = useMatches(
    activeSeason?.id ?? null,
    activeCareer?.id ?? null
  );

  const [logging, setLogging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Match Form state
  const [opponent, setOpponent] = useState('');
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [mvpPlayerId, setMvpPlayerId] = useState<string>('');
  const [playerEvents, setPlayerEvents] = useState<Record<string, PlayerMatchPerformance>>({});

  const handleOpenModal = () => {
    setOpponent('');
    setTeamScore(0);
    setOpponentScore(0);
    setMvpPlayerId('');
    // Initialize empty event state for each player
    const initialEvents: Record<string, PlayerMatchPerformance> = {};
    players.forEach(p => {
      initialEvents[p.id] = {
        player_id: p.id,
        goals: 0,
        assists: 0,
        yellow_card: false,
        red_card: false,
        clean_sheet: false,
      };
    });
    setPlayerEvents(initialEvents);
    setLogging(true);
  };

  const updatePlayerEvent = (playerId: string, field: keyof PlayerMatchPerformance, value: any) => {
    setPlayerEvents(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
  };

  const handleLogMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim()) return;

    setSubmitting(true);
    // Filter only players who had any event (goals, assists, cards, clean sheet, or participated)
    const activeEvents = Object.values(playerEvents).filter(
      e => e.goals > 0 || e.assists > 0 || e.yellow_card || e.red_card || e.clean_sheet
    );

    const success = await logMatch({
      opponent: opponent.trim(),
      team_score: Number(teamScore) || 0,
      opponent_score: Number(opponentScore) || 0,
      mvp_player_id: mvpPlayerId || null,
      playerEvents: activeEvents,
    });

    if (success) {
      refetchPlayers();
      setLogging(false);
    }
    setSubmitting(false);
  };

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

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Match Logger & Performance</h1>
          <p className="text-white/50 text-sm mt-1">{activeSeason?.year_label ?? 'No active season'}</p>
        </div>
        <button onClick={handleOpenModal} className="btn-primary" disabled={!activeSeason}>
          <Plus size={16} /> Log Match
        </button>
      </div>

      {/* Match Logger Modal */}
      {logging && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-pitch-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-400/10 border border-neon-400/20 flex items-center justify-center">
                  <Swords size={20} className="text-neon-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Log Match Details</h3>
                  <p className="text-white/40 text-xs">Record score, opponent, MVP & player stats</p>
                </div>
              </div>
              <button onClick={() => setLogging(false)} className="btn-ghost p-2"><X size={18} /></button>
            </div>

            <form onSubmit={handleLogMatch} className="flex flex-col gap-6">
              {/* Match Score & Opponent */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-pitch-900/60 border border-pitch-700">
                <div className="form-group">
                  <label className="form-label">Opponent (Rival) *</label>
                  <input
                    required
                    placeholder="e.g. Real Madrid"
                    value={opponent}
                    onChange={e => setOpponent(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Goals</label>
                  <input
                    type="number"
                    min={0}
                    value={teamScore}
                    onChange={e => setTeamScore(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Opponent Goals</label>
                  <input
                    type="number"
                    min={0}
                    value={opponentScore}
                    onChange={e => setOpponentScore(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Match MVP */}
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <Star size={14} className="text-amber-400" /> Match MVP (Player of the Match)
                </label>
                <select value={mvpPlayerId} onChange={e => setMvpPlayerId(e.target.value)} className="w-full">
                  <option value="">Select MVP (Optional)</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.preferred_position})</option>
                  ))}
                </select>
              </div>

              {/* Player Events Table */}
              <div>
                <h4 className="font-semibold text-white text-sm mb-3">Player Performances in Match</h4>
                <div className="border border-pitch-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-pitch-900 sticky top-0 border-b border-pitch-700">
                      <tr>
                        <th className="p-2 text-left text-white/50">Player</th>
                        <th className="p-2 text-center text-white/50">⚽ Goals</th>
                        <th className="p-2 text-center text-white/50">🅰️ Assists</th>
                        <th className="p-2 text-center text-white/50">🟨 YC</th>
                        <th className="p-2 text-center text-white/50">🟥 RC</th>
                        <th className="p-2 text-center text-white/50">🧤 CS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pitch-700/50">
                      {players.map(p => {
                        const ev = playerEvents[p.id] || { goals: 0, assists: 0, yellow_card: false, red_card: false, clean_sheet: false };
                        return (
                          <tr key={p.id} className="hover:bg-pitch-800/40">
                            <td className="p-2 font-medium text-white">
                              {p.full_name} <span className="text-[10px] text-white/40">({p.preferred_position})</span>
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number" min={0} max={10} value={ev.goals}
                                onChange={e => updatePlayerEvent(p.id, 'goals', Number(e.target.value))}
                                className="w-12 text-center py-1 px-1 text-xs"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number" min={0} max={10} value={ev.assists}
                                onChange={e => updatePlayerEvent(p.id, 'assists', Number(e.target.value))}
                                className="w-12 text-center py-1 px-1 text-xs"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox" checked={ev.yellow_card}
                                onChange={e => updatePlayerEvent(p.id, 'yellow_card', e.target.checked)}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox" checked={ev.red_card}
                                onChange={e => updatePlayerEvent(p.id, 'red_card', e.target.checked)}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox" checked={ev.clean_sheet}
                                onChange={e => updatePlayerEvent(p.id, 'clean_sheet', e.target.checked)}
                                className="w-4 h-4 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center py-3">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Save Match & Update Stats
                </button>
                <button type="button" onClick={() => setLogging(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Two-Column Grid: H2H Records + Match History Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Head-to-Head (H2H) Records Table */}
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Swords size={16} className="text-neon-400" />
            Head-to-Head (H2H) vs Opponents
          </h3>
          {h2hRecords.length === 0 ? (
            <p className="text-white/30 text-sm py-4 text-center">No match history logged yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-pitch-700">
                    <th className="pb-2 text-left text-white/40">Opponent</th>
                    <th className="pb-2 text-center text-white/40">P</th>
                    <th className="pb-2 text-center text-neon-400">W</th>
                    <th className="pb-2 text-center text-amber-400">D</th>
                    <th className="pb-2 text-center text-red-400">L</th>
                    <th className="pb-2 text-right text-white/40">Score Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pitch-700/40">
                  {h2hRecords.map(r => (
                    <tr key={r.opponent} className="hover:bg-pitch-700/20">
                      <td className="py-2.5 font-bold text-white">{r.opponent}</td>
                      <td className="py-2.5 text-center text-white/70">{r.matchesPlayed}</td>
                      <td className="py-2.5 text-center font-bold text-neon-400">{r.wins}</td>
                      <td className="py-2.5 text-center text-amber-400">{r.draws}</td>
                      <td className="py-2.5 text-center text-red-400">{r.losses}</td>
                      <td className="py-2.5 text-right font-mono text-white/60">
                        {r.goalsFor} : {r.goalsAgainst}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Matches Log Feed */}
        <div className="card p-5">
          <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-electric-400" />
            Recent Match History
          </h3>
          {matches.length === 0 ? (
            <p className="text-white/30 text-sm py-4 text-center">No matches recorded this season</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {matches.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-pitch-900/60 border border-pitch-700">
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0',
                      m.result === 'win' && 'bg-neon-400/20 text-neon-400 border border-neon-400/30',
                      m.result === 'draw' && 'bg-amber-400/20 text-amber-400 border border-amber-400/30',
                      m.result === 'loss' && 'bg-red-400/20 text-red-400 border border-red-400/30'
                    )}>
                      {m.result.toUpperCase().charAt(0)}
                    </span>
                    <div>
                      <p className="font-bold text-white text-sm">vs {m.opponent}</p>
                      {m.mvp_player && (
                        <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                          <Star size={10} /> MVP: {m.mvp_player.full_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-black text-white">
                      {m.team_score} - {m.opponent_score}
                    </span>
                    <button onClick={() => deleteMatch(m.id)} className="btn-danger p-1 text-xs">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

      {/* Full Season Stats Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-pitch-700">
          <h3 className="font-semibold text-white">Full Season Player Leaderboard</h3>
        </div>
        {playersLoading ? (
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
