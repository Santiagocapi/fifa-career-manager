// ============================================================
// src/components/scouting/ScoutFormSheet.tsx
// Add a player to a scouting list. On the sell list you can pick
// someone from your squad to pre-fill their details.
// ============================================================

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Loader2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlayerWithStats, ScoutingListType } from '../../types/database';
import { SCOUTING_LIST_TYPES, dollarsToCents, formatValue } from '../../lib/constants';
import Sheet from '../ui/Sheet';
import Field from '../ui/Field';
import Flag from '../player/Flag';
import PositionPicker from '../player/PositionPicker';

export interface ScoutFormData {
  list_type: ScoutingListType;
  full_name: string;
  position: string;
  nationality: string;
  current_club: string;
  current_ovr: number;
  estimated_value: number;
  notes: string;
}

interface ScoutFormSheetProps {
  open: boolean;
  defaultList: ScoutingListType;
  squad: PlayerWithStats[];
  clubName: string;
  onClose: () => void;
  onSubmit: (data: ScoutFormData) => Promise<void>;
}

const blankForm = (list: ScoutingListType): ScoutFormData => ({
  list_type: list,
  full_name: '',
  position: '',
  nationality: '',
  current_club: '',
  current_ovr: Number.NaN,
  estimated_value: Number.NaN,
  notes: '',
});

export default function ScoutFormSheet({ open, defaultList, squad, clubName, onClose, onSubmit }: ScoutFormSheetProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScoutFormData>({ defaultValues: blankForm(defaultList) });

  useEffect(() => {
    if (open) reset(blankForm(defaultList));
  }, [open, defaultList, reset]);

  const listType = watch('list_type');
  const nationality = watch('nationality');
  const estimatedValue = watch('estimated_value');

  // Sell list: copy the details of a squad player
  const fillFromSquad = (playerId: string) => {
    const player = squad.find((p) => p.id === playerId);
    if (!player) return;
    setValue('full_name', player.full_name, { shouldValidate: true });
    setValue('position', player.preferred_position);
    setValue('nationality', player.nationality ?? '');
    setValue('current_club', clubName);
    setValue('current_ovr', player.stats?.ovr_end ?? player.stats?.ovr_start ?? Number.NaN);
    const value = player.stats?.market_value_end ?? player.stats?.market_value_start;
    setValue('estimated_value', value != null ? value / 100 : Number.NaN);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Añadir al seguimiento"
      closeOnBackdrop={false}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" form="scout-form" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Añadir
          </button>
        </div>
      }
    >
      <form id="scout-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Controller
          control={control}
          name="list_type"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Lista" className="field">
              <span className="field-label">Lista</span>
              <div className="grid grid-cols-2 gap-2">
                {SCOUTING_LIST_TYPES.map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={field.value === value}
                    onClick={() => field.onChange(value)}
                    className={clsx(
                      'flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors active:scale-[0.98]',
                      field.value === value
                        ? 'border-neon-400/50 bg-neon-400/10 text-white'
                        : 'border-pitch-600 bg-pitch-800 text-white/60'
                    )}
                  >
                    <Icon size={16} className={color} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        />

        {listType === 'sell' && squad.length > 0 && (
          <Field label="Jugador de tu plantilla" hint="Rellena sus datos automáticamente.">
            <select defaultValue="" onChange={(e) => fillFromSquad(e.target.value)}>
              <option value="" disabled>
                Elige un jugador…
              </option>
              {squad.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.preferred_position}) · {p.stats?.ovr_end ?? p.stats?.ovr_start ?? '–'}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Nombre" required error={errors.full_name?.message}>
          <input
            data-autofocus
            autoComplete="off"
            placeholder="Franco Mastantuono"
            {...register('full_name', {
              required: 'Escribe el nombre del jugador',
              validate: (v) => v.trim() !== '' || 'Escribe el nombre del jugador',
            })}
          />
        </Field>

        <Controller
          control={control}
          name="position"
          render={({ field }) => <PositionPicker value={field.value} onChange={field.onChange} />}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nacionalidad">
            <div className="relative">
              <input autoComplete="off" placeholder="Argentina" className="pr-10" {...register('nationality')} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <Flag nationality={nationality} />
              </span>
            </div>
          </Field>
          <Field label="Media" error={errors.current_ovr?.message}>
            <input
              type="number"
              inputMode="numeric"
              placeholder="84"
              {...register('current_ovr', {
                valueAsNumber: true,
                min: { value: 1, message: 'Entre 1 y 99' },
                max: { value: 99, message: 'Entre 1 y 99' },
              })}
            />
          </Field>
        </div>

        <Field label="Club actual" hint="Déjalo vacío si es agente libre.">
          <input autoComplete="off" placeholder="River Plate" {...register('current_club')} />
        </Field>

        <Field
          label="Valor estimado ($)"
          hint={
            Number.isFinite(estimatedValue) && estimatedValue > 0
              ? `= ${formatValue(dollarsToCents(estimatedValue))}`
              : 'En dólares, sin puntos'
          }
        >
          <input
            type="number"
            inputMode="numeric"
            placeholder="45000000"
            {...register('estimated_value', { valueAsNumber: true, min: 0 })}
          />
        </Field>

        <Field label="Notas">
          <textarea rows={3} placeholder="Cláusula, potencial, cuándo queda libre…" className="resize-none" {...register('notes')} />
        </Field>
      </form>
    </Sheet>
  );
}
