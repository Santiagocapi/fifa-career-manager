// ============================================================
// src/components/profile/RatingChart.tsx
// Rating or market value season by season (Recharts). Each
// point is the end-of-season figure, or the starting one while
// the season is still open.
// ============================================================

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BadgeDollarSign, Gauge } from 'lucide-react';
import type { PlayerSeasonStats } from '../../types/database';
import { formatValue } from '../../lib/constants';
import SegmentedTabs from '../ui/SegmentedTabs';

type Metric = 'ovr' | 'value';

const METRICS: Record<Metric, { color: string; format: (value: number) => string; label: string }> = {
  ovr: { color: 'var(--color-neon)', format: (v) => String(v), label: 'Media' },
  value: { color: 'var(--color-electric)', format: (v) => formatValue(v), label: 'Valor' },
};

export default function RatingChart({ seasons }: { seasons: PlayerSeasonStats[] }) {
  const [metric, setMetric] = useState<Metric>('ovr');
  const { color, format, label } = METRICS[metric];

  const data = seasons
    .map((row) => ({
      season: row.season.year_label,
      value: metric === 'ovr' ? row.ovr_end ?? row.ovr_start : row.market_value_end ?? row.market_value_start,
    }))
    .filter((point): point is { season: string; value: number } => point.value != null);

  return (
    <section className="card flex flex-col p-4 sm:p-5" aria-labelledby="evolution-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="evolution-title" className="section-title">
          Evolución
        </h2>
        <SegmentedTabs
          ariaLabel="Dato de la gráfica"
          value={metric}
          onChange={setMetric}
          className="!p-0.5"
          items={[
            { value: 'ovr', label: 'Media', icon: Gauge },
            { value: 'value', label: 'Valor', icon: BadgeDollarSign },
          ]}
        />
      </div>

      {data.length < 2 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-center text-sm text-white/40">
          La evolución aparecerá cuando el jugador cumpla su segunda temporada en el club.
        </p>
      ) : (
        <div className="mt-4 h-[200px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: metric === 'value' ? 0 : -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="season" tick={{ fill: 'var(--chart-text)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={metric === 'ovr' ? [(min: number) => Math.max(min - 3, 1), (max: number) => Math.min(max + 3, 99)] : [0, 'auto']}
                allowDecimals={false}
                tickFormatter={format}
                tick={{ fill: 'var(--chart-text)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: 'var(--chart-grid)' }}
                contentStyle={{ background: 'var(--chart-tooltip)', border: '1px solid var(--chart-grid)', borderRadius: 12 }}
                labelStyle={{ color: 'white', fontWeight: 700 }}
                formatter={(value) => [format(Number(value)), label]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
