// ============================================================
// src/pages/Stats.tsx
// Performance stats, Match Logger & Editor (Opponent, Competition,
// Score, MVP, Player Events), Head-to-Head (H2H) records, and Leaderboards.
// ============================================================

import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { usePlayers } from '../hooks/usePlayers';
import { useMatches } from '../hooks/useMatches';
import { POSITION_COLORS, getPositionGroup } from '../lib/constants';
import { BarChart2, Plus, Minus, Loader2, Trophy, Swords, Star, Calendar, Check, X, Shield, Trash2, Edit2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { clsx } from 'clsx';
import type { MatchWithDetails } from '../types/database';

interface PlayerMatchPerformance {
  player_id: string;
  goals: number;
  assists: number;
  yellow_card: boolean;
  red_card: boolean;
  clean_sheet: boolean;
  injured: boolean;
}

const COMPETITIONS = ['League', 'Domestic Cup', 'Champions League', 'Europa League', 'Super Cup', 'Friendly'];

export default function Stats() {
  const { activeCareer, activeSeason } = useAppStore();
  const { players, loading: playersLoading, refetch: refetchPlayers, toggleInjured } = usePlayers(
    activeCareer?.id ?? null,
    activeSeason?.id ?? null
  );

  const { matches, h2hRecords, loading: matchesLoading, logMatch, updateMatch, deleteMatch } = useMatches(
    activeSeason?.id ?? null,
    activeCareer?.id ?? null
  );


  const [logging, setLogging] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchWithDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Match Form state
  const [opponent, setOpponent] = useState('');
  const [competition, setCompetition] = useState('League');
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [mvpPlayerId, setMvpPlayerId] = useState<string>('');
  const [playerEvents, setPlayerEvents] = useState<Record<string, PlayerMatchPerformance>>({});

  const handleOpenAddModal = () => {
    setEditingMatch(null);
    setOpponent('');
    setCompetition('League');
    setTeamScore(0);
    setOpponentScore(0);
    setMvpPlayerId('');
    // Initialize event state — pre-mark injured players from their persistent is_injured flag
    const initialEvents: Record<string, PlayerMatchPerformance> = {};
    players.forEach(p => {
      initialEvents[p.id] = {
        player_id: p.id,
        goals: 0,
        assists: 0,
        yellow_card: false,
        red_card: false,
        clean_sheet: false,
        injured: p.stats?.is_injured ?? false,
      };
    });
    setPlayerEvents(initialEvents);
    setLogging(true);
  };

  const handleOpenEditModal = (match: MatchWithDetails) => {
    setEditingMatch(match);
    setOpponent(match.opponent);
    setCompetition(match.competition || 'League');
    setTeamScore(match.team_score);
    setOpponentScore(match.opponent_score);
    setMvpPlayerId(match.mvp_player_id || '');

    // Populate events map from existing match events
    const eventsMap: Record<string, PlayerMatchPerformance> = {};
    players.forEach(p => {
      const existingEv = match.events.find(e => e.player_id === p.id);
      eventsMap[p.id] = {
        player_id: p.id,
        goals: existingEv?.goals || 0,
        assists: existingEv?.assists || 0,
        yellow_card: existingEv?.yellow_card || false,
        red_card: existingEv?.red_card || false,
        clean_sheet: existingEv?.clean_sheet || false,
        injured: existingEv?.injured || false,
      };
    });
    setPlayerEvents(eventsMap);
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

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim()) return;

    setSubmitting(true);
    // Send all player events so every non-injured player gets +1 match played
    const allEvents = Object.values(playerEvents);

    const payload = {
      opponent: opponent.trim(),
      competition: competition || 'League',
      team_score: Number(teamScore) || 0,
      opponent_score: Number(opponentScore) || 0,
      mvp_player_id: mvpPlayerId || null,
      playerEvents: allEvents,
    };

    let success = false;
    if (editingMatch) {
      success = await updateMatch(editingMatch.id, payload);
    } else {
      success = await logMatch(payload);
    }

    if (success) {
      refetchPlayers();
      setLogging(false);
      setEditingMatch(null);
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

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Delete this match? Player statistics from this match will be reverted.')) return;
    await deleteMatch(matchId);
    refetchPlayers();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Match Logger & Performance</h1>
          <p className="text-white/50 text-sm mt-1">{activeSeason?.year_label ?? 'No active season'}</p>
        </div>
        <button onClick={handleOpenAddModal} className="btn-primary" disabled={!activeSeason}>
          <Plus size={16} /> Log Match
        </button>
      </div>

      {/* Match Logger / Editor Modal */}
      {logging && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-pitch-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon-400/10 border border-neon-400/20 flex items-center justify-center">
                  <Swords size={20} className="text-neon-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {editingMatch ? 'Edit Match Details' : 'Log Match Details'}
                  </h3>
                  <p className="text-white/40 text-xs">Record score, opponent, competition, MVP & player stats</p>
                </div>
              </div>
              <button onClick={() => setLogging(false)} className="btn-ghost p-2"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveMatch} className="flex flex-col gap-6">
              {/* Match Score, Opponent & Competition */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-pitch-900/60 border border-pitch-700">
                <div className="form-group md:col-span-2">
                  <label className="form-label">Opponent (Rival) *</label>
                  <input
                    required
                    placeholder="e.g. Real Madrid"
                    value={opponent}
                    onChange={e => setOpponent(e.target.value)}
                  />
                </div>
                <div className="form-group md:col-span-2">
                  <label className="form-label">Competition</label>
                  <select value={competition} onChange={e => setCompetition(e.target.value)} className="w-full">
                    {COMPETITIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group md:col-span-2">
                  <label className="form-label">Your Goals</label>
                  <input
                    type="number"
                    min={0}
                    value={teamScore}
                    onChange={e => setTeamScore(Number(e.target.value))}
                  />
                </div>
                <div className="form-group md:col-span-2">
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
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white text-sm">Player Performances in Match</h4>
                  <span className="text-[11px] text-white/40">🚑 Injured players are pre-marked from squad status</span>
                </div>
                <div className="border border-pitch-700 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-pitch-900 sticky top-0 border-b border-pitch-700">
                      <tr>
                        <th className="p-2 text-left text-white/50">Player</th>
                        <th className="p-2 text-center text-white/50">⚽ G</th>
                        <th className="p-2 text-center text-white/50">🅰️ A</th>
                        <th className="p-2 text-center text-white/50">🟨</th>
                        <th className="p-2 text-center text-white/50">🟥</th>
                        <th className="p-2 text-center text-white/50">🧤</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pitch-700/50">
                      {players.map(p => {
                        const ev = playerEvents[p.id] || { goals: 0, assists: 0, yellow_card: false, red_card: false, clean_sheet: false, injured: false };
                        return (
                          <tr key={p.id} className={clsx('transition-colors', ev.injured ? 'opacity-40 bg-red-950/10' : 'hover:bg-pitch-800/40')}>
                            <td className="p-2 font-medium text-white">
                              <div className="flex items-center gap-1.5">
                                {ev.injured && <span className="text-[9px] text-red-400 font-bold bg-red-400/10 px-1 py-0.5 rounded">INJ</span>}
                                <span className="truncate max-w-[90px]">{p.full_name}</span>
                                <span className="text-[9px] text-white/30">({p.preferred_position})</span>
                              </div>
                            </td>

                            {/* Goals: - [n] + */}
                            <td className="p-1.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" disabled={ev.injured || ev.goals <= 0}
                                  onClick={() => updatePlayerEvent(p.id, 'goals', Math.max(0, ev.goals - 1))}
                                  className="w-6 h-6 rounded-md bg-pitch-700 hover:bg-pitch-600 text-white/60 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                  <Minus size={10} />
                                </button>
                                <span className={clsx('w-5 text-center font-bold', ev.goals > 0 ? 'text-neon-400' : 'text-white/30')}>
                                  {ev.goals}
                                </span>
                                <button type="button" disabled={ev.injured}
                                  onClick={() => updatePlayerEvent(p.id, 'goals', ev.goals + 1)}
                                  className="w-6 h-6 rounded-md bg-pitch-700 hover:bg-neon-400/20 text-white/60 hover:text-neon-400 flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                  <Plus size={10} />
                                </button>
                              </div>
                            </td>

                            {/* Assists: - [n] + */}
                            <td className="p-1.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" disabled={ev.injured || ev.assists <= 0}
                                  onClick={() => updatePlayerEvent(p.id, 'assists', Math.max(0, ev.assists - 1))}
                                  className="w-6 h-6 rounded-md bg-pitch-700 hover:bg-pitch-600 text-white/60 hover:text-white flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                  <Minus size={10} />
                                </button>
                                <span className={clsx('w-5 text-center font-bold', ev.assists > 0 ? 'text-electric-400' : 'text-white/30')}>
                                  {ev.assists}
                                </span>
                                <button type="button" disabled={ev.injured}
                                  onClick={() => updatePlayerEvent(p.id, 'assists', ev.assists + 1)}
                                  className="w-6 h-6 rounded-md bg-pitch-700 hover:bg-electric-400/20 text-white/60 hover:text-electric-400 flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                                  <Plus size={10} />
                                </button>
                              </div>
                            </td>

                            {/* Yellow Card toggle */}
                            <td className="p-1.5 text-center">
                              <button type="button" disabled={ev.injured}
                                onClick={() => updatePlayerEvent(p.id, 'yellow_card', !ev.yellow_card)}
                                className={clsx(
                                  'w-7 h-7 rounded-md flex items-center justify-center mx-auto text-xs font-bold transition-all disabled:opacity-20 disabled:cursor-not-allowed',
                                  ev.yellow_card ? 'bg-amber-400 text-pitch-900' : 'bg-pitch-700 text-white/30 hover:bg-amber-400/20 hover:text-amber-400'
                                )}>
                                🟨
                              </button>
                            </td>

                            {/* Red Card toggle */}
                            <td className="p-1.5 text-center">
                              <button type="button" disabled={ev.injured}
                                onClick={() => updatePlayerEvent(p.id, 'red_card', !ev.red_card)}
                                className={clsx(
                                  'w-7 h-7 rounded-md flex items-center justify-center mx-auto text-xs font-bold transition-all disabled:opacity-20 disabled:cursor-not-allowed',
                                  ev.red_card ? 'bg-red-500 text-white' : 'bg-pitch-700 text-white/30 hover:bg-red-500/20 hover:text-red-400'
                                )}>
                                🟥
                              </button>
                            </td>

                            {/* Clean Sheet toggle */}
                            <td className="p-1.5 text-center">
                              <button type="button" disabled={ev.injured}
                                onClick={() => updatePlayerEvent(p.id, 'clean_sheet', !ev.clean_sheet)}
                                className={clsx(
                                  'w-7 h-7 rounded-md flex items-center justify-center mx-auto text-xs font-bold transition-all disabled:opacity-20 disabled:cursor-not-allowed',
                                  ev.clean_sheet ? 'bg-neon-400/20 text-neon-400 border border-neon-400/40' : 'bg-pitch-700 text-white/30 hover:bg-neon-400/10 hover:text-neon-400'
                                )}>
                                🧤
                              </button>
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
                  {editingMatch ? 'Save Changes' : 'Save Match & Update Stats'}
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
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              {matches.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-pitch-900/60 border border-pitch-700 group hover:border-white/10 transition-all">
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
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm">vs {m.opponent}</p>
                        {m.competition && (
                          <span className="text-[10px] text-white/50 bg-pitch-700 px-1.5 py-0.5 rounded font-mono">
                            {m.competition}
                          </span>
                        )}
                      </div>
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
                    <button
                      onClick={() => handleOpenEditModal(m)}
                      className="btn-ghost p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit Match"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteMatch(m.id)}
                      className="btn-danger p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Match"
                    >
                      <Trash2 size={13} />
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
        <div className="p-4 border-b border-pitch-700 flex items-center justify-between">
          <h3 className="font-semibold text-white">Full Season Player Leaderboard</h3>
          <span className="text-[11px] text-white/40">Toggle 🚑 INJ to mark a player as injured (auto-skips future matches)</span>
        </div>
        {playersLoading ? (
          <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-neon-400" size={24} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pitch-700">
                  {['Player', 'Pos', 'MP', 'G', 'A', 'YC', 'RC', 'CS', '🚑'].map(h => (
                    <th key={h} className={clsx(
                      'px-4 py-3 text-left text-xs uppercase tracking-wider font-medium',
                      h === '🚑' ? 'text-red-400' : 'text-white/40'
                    )}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((player, i) => {
                  const colors = POSITION_COLORS[getPositionGroup(player.preferred_position)];
                  const isInjured = player.stats?.is_injured ?? false;
                  return (
                    <tr key={player.id} className={clsx(
                      'border-b border-pitch-700/50 transition-colors',
                      isInjured
                        ? 'bg-red-950/10 opacity-60'
                        : i % 2 === 0 ? 'bg-pitch-800/30 hover:bg-pitch-700/30' : 'hover:bg-pitch-700/30'
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleInjured(player.id, !isInjured)}
                          disabled={!player.stats}
                          title={isInjured ? 'Mark as available' : 'Mark as injured'}
                          className={clsx(
                            'w-7 h-7 rounded-lg flex items-center justify-center transition-all text-sm disabled:opacity-30 disabled:cursor-not-allowed',
                            isInjured
                              ? 'bg-red-500/30 border border-red-500/50 text-red-400'
                              : 'bg-pitch-700 border border-pitch-600 text-white/20 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10'
                          )}
                        >
                          🚑
                        </button>
                      </td>
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
