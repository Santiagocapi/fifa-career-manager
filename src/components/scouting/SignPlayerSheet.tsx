// ============================================================
// src/components/scouting/SignPlayerSheet.tsx
// Confirm signing a scouted player into the active squad.
// ============================================================

import { useEffect, useState } from 'react';
import { CircleCheck, Loader2 } from 'lucide-react';
import type { ScoutingEntry } from '../../types/database';
import { dollarsToCents, formatValue, formatWage } from '../../lib/constants';
import Sheet from '../ui/Sheet';
import Field from '../ui/Field';
import PlayerAvatar from '../player/PlayerAvatar';
import PositionBadge from '../player/PositionBadge';
import OvrBadge from '../player/OvrBadge';
import Flag from '../player/Flag';

interface SignPlayerSheetProps {
  entry: ScoutingEntry | null;
  seasonLabel: string;
  onClose: () => void;
  /** Weekly wage in cents */
  onConfirm: (entry: ScoutingEntry, wageCents: number) => Promise<void>;
}

const DEFAULT_WAGE = 25_000;

export default function SignPlayerSheet({ entry, seasonLabel, onClose, onConfirm }: SignPlayerSheetProps) {
  const [wage, setWage] = useState(DEFAULT_WAGE);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (entry) setWage(DEFAULT_WAGE);
  }, [entry]);

  const handleConfirm = async () => {
    if (!entry) return;
    setSubmitting(true);
    await onConfirm(entry, dollarsToCents(Number.isFinite(wage) ? wage : 0));
    setSubmitting(false);
  };

  return (
    <Sheet
      open={entry !== null}
      onClose={onClose}
      title="Fichar jugador"
      description={`Se añadirá a la plantilla de la temporada ${seasonLabel}.`}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirm} disabled={submitting} className="btn-primary flex-1">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CircleCheck size={18} />}
            Confirmar fichaje
          </button>
        </div>
      }
    >
      {entry && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-neon-400/25 bg-neon-400/5 p-3.5">
            <PlayerAvatar name={entry.full_name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-white" translate="no">
                {entry.full_name}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                <PositionBadge position={entry.position || 'CM'} />
                <Flag nationality={entry.nationality} />
                <span>{entry.current_club ?? 'Agente libre'}</span>
              </p>
              <p className="mt-1 text-xs text-white/50">
                Valor:{' '}
                <span className="font-semibold text-emerald-300">
                  {entry.estimated_value ? formatValue(entry.estimated_value) : 'sin dato'}
                </span>
              </p>
            </div>
            <OvrBadge ovr={entry.current_ovr ?? 75} size="lg" />
          </div>

          <Field
            label="Salario semanal ($)"
            hint={Number.isFinite(wage) && wage > 0 ? `= ${formatWage(dollarsToCents(wage))}` : 'En dólares por semana'}
          >
            <input
              type="number"
              inputMode="numeric"
              value={Number.isFinite(wage) ? wage : ''}
              onChange={(e) => setWage(e.target.valueAsNumber)}
              placeholder="25000"
            />
          </Field>
        </div>
      )}
    </Sheet>
  );
}
