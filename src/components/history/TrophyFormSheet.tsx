// ============================================================
// src/components/history/TrophyFormSheet.tsx
// Add a trophy or an individual award to a season.
// ============================================================

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Loader2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlayerWithStats, TrophyType } from '../../types/database';
import { TROPHY_TYPES } from '../../lib/constants';
import Sheet from '../ui/Sheet';
import Field from '../ui/Field';
import { TrophyIcon } from './TrophyIcons';

export interface TrophyFormData {
  trophy_name: string;
  trophy_type: TrophyType;
  recipient_id: string;
}

interface TrophyFormSheetProps {
  open: boolean;
  seasonLabel: string;
  players: PlayerWithStats[];
  onClose: () => void;
  onSubmit: (data: TrophyFormData) => Promise<void>;
}

const emptyForm: TrophyFormData = { trophy_name: '', trophy_type: 'league', recipient_id: '' };

export default function TrophyFormSheet({ open, seasonLabel, players, onClose, onSubmit }: TrophyFormSheetProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TrophyFormData>({ defaultValues: emptyForm });

  useEffect(() => {
    if (open) reset(emptyForm);
  }, [open, reset]);

  const trophyType = watch('trophy_type');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Añadir trofeo"
      description={`Temporada ${seasonLabel}`}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" form="trophy-form" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Añadir
          </button>
        </div>
      }
    >
      <form id="trophy-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Controller
          control={control}
          name="trophy_type"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Tipo" className="field">
              <span className="field-label">Tipo</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TROPHY_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={field.value === value}
                    onClick={() => field.onChange(value)}
                    className={clsx(
                      'flex min-h-[3rem] items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-sm font-semibold transition-colors active:scale-[0.98]',
                      field.value === value
                        ? 'border-amber-400/60 bg-amber-400/10 text-white'
                        : 'border-pitch-600 bg-pitch-800 text-white/60'
                    )}
                  >
                    <TrophyIcon type={value === 'individual' ? 'ballon_dor' : value} size={26} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        <Field
          label={trophyType === 'individual' ? 'Nombre del premio' : 'Nombre del trofeo'}
          required
          error={errors.trophy_name?.message}
          hint={trophyType === 'individual' ? 'Por ejemplo: Balón de Oro, Bota de Oro o Guante de Oro.' : undefined}
        >
          <input
            data-autofocus
            autoComplete="off"
            placeholder={trophyType === 'individual' ? 'Bota de Oro' : 'Copa Libertadores'}
            {...register('trophy_name', {
              required: 'Escribe el nombre',
              validate: (v) => v.trim() !== '' || 'Escribe el nombre',
            })}
          />
        </Field>

        {trophyType === 'individual' && (
          <Field label="Ganador">
            <select {...register('recipient_id')}>
              <option value="">Sin asignar</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.preferred_position})
                </option>
              ))}
            </select>
          </Field>
        )}
      </form>
    </Sheet>
  );
}
