// ============================================================
// src/components/matches/GoalsChart.tsx
// Top 10 goal scorers with their assists (Recharts).
// Colors come from CSS variables defined in index.css.
// ============================================================

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PlayerWithStats } from '../../types/database';

export default function GoalsChart({ players }: { players: PlayerWithStats[] }) {
  const data = players
    .filter((p) => (p.stats?.goals ?? 0) > 0 || (p.stats?.assists ?? 0) > 0)
    .sort((a, b) => (b.stats?.goals ?? 0) - (a.stats?.goals ?? 0))
    .slice(0, 10)
    .map((p) => ({
      name: p.full_name.split(' ').pop() ?? p.full_name,
      goles: p.stats?.goals ?? 0,
      asistencias: p.stats?.assists ?? 0,
    }));

  if (data.length === 0) {
    return <p className="py-4 text-center text-sm text-white/40">Aún no hay goles ni asistencias.</p>;
  }

  return (
    <div>
      <div className="h-[240px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={3} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--chart-text)', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis allowDecimals={false} tick={{ fill: 'var(--chart-text)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--chart-cursor)' }}
              contentStyle={{ background: 'var(--chart-tooltip)', border: '1px solid var(--chart-grid)', borderRadius: 12 }}
              labelStyle={{ color: 'white', fontWeight: 700 }}
            />
            <Bar dataKey="goles" fill="var(--color-neon)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="asistencias" fill="var(--color-electric)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs text-white/55">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-neon-400" /> Goles
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-electric-400" /> Asistencias
        </span>
      </div>
    </div>
  );
}
