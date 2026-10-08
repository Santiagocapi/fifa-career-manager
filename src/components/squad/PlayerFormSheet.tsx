// ============================================================
// src/components/squad/PlayerFormSheet.tsx
// Add / edit a squad player in a bottom sheet. Money is typed in
// dollars and previewed in the app's short format ($5.0M).
// ============================================================

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Loader2, Plus, Save } from 'lucide-react';
import type { PlayerPosition, PlayerWithStats } from '../../types/database';
import { centsToDollars, dollarsToCents, formatValue, formatWage } from '../../lib/constants';
import Sheet from '../ui/Sheet';
import Field from '../ui/Field';
import Switch from '../ui/Switch';
import Flag from '../player/Flag';
import PositionPicker from '../player/PositionPicker';

export interface PlayerFormData {
  full_name: string;
  preferred_position: PlayerPosition;
  nationality: string;
  age: number;
  joined_year: number;
  ovr_start: number;
  market_value_start: number;
  salary: number;
  is_injured: boolean;
}

interface PlayerFormSheetProps {
  open: boolean;
  /** Player being edited, or null to add a new one */
  player: PlayerWithStats | null;
  onClose: () => void;
  onSubmit: (data: PlayerFormData) => Promise<void>;
}

const currentYear = new Date().getFullYear();

const emptyForm: PlayerFormData = {
  full_name: '',
  preferred_position: 'CM',
  nationality: '',
  age: 21,
  joined_year: currentYear,
  ovr_start: 75,
  market_value_start: 5_000_000,
  salary: 15_000,
  is_injured: false,
};

export default function PlayerFormSheet({ open, player, onClose, onSubmit }: PlayerFormSheetProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlayerFormData>({ defaultValues: emptyForm });

  // Load the player (or blank values) every time the sheet opens
  useEffect(() => {
    if (!open) return;
    reset(
      player
        ? {
            full_name: player.full_name,
            preferred_position: player.preferred_position,
            nationality: player.nationality ?? '',
            age: player.age ?? 21,
            joined_year: player.joined_year ?? currentYear,
            ovr_start: player.stats?.ovr_start ?? 75,
            market_value_start: centsToDollars(player.stats?.market_value_start),
            salary: centsToDollars(player.stats?.salary),
            is_injured: player.stats?.is_injured ?? false,
          }
        : emptyForm
    );
  }, [open, player, reset]);

  const nationality = watch('nationality');
  const marketValue = watch('market_value_start');
  const salary = watch('salary');
  const isEditing = player !== null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar jugador' : 'Añadir jugador'}
      description={isEditing ? player.full_name : 'Los datos de temporada se guardan en la temporada activa.'}
      closeOnBackdrop={false}
      footer={
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" form="player-form" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isEditing ? (
              <Save size={18} />
            ) : (
              <Plus size={18} />
            )}
            {isEditing ? 'Guardar' : 'Añadir'}
          </button>
        </div>
      }
    >
      <form id="player-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field label="Nombre" required error={errors.full_name?.message}>
          <input
            data-autofocus
            autoComplete="off"
            placeholder="Julián Romero"
            {...register('full_name', {
              required: 'Escribe el nombre del jugador',
              validate: (v) => v.trim() !== '' || 'Escribe el nombre del jugador',
            })}
          />
        </Field>

        <Controller
          control={control}
          name="preferred_position"
          rules={{ required: 'Elige una posición' }}
          render={({ field, fieldState }) => (
            <PositionPicker value={field.value} onChange={field.onChange} error={fieldState.error?.message} required />
          )}
        />

        <Field label="Nacionalidad" hint="Nombre del país o código (ARG, ESP…)">
          <div className="relative">
            <input autoComplete="off" placeholder="Argentina" className="pr-11" {...register('nationality')} />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
              <Flag nationality={nationality} size="md" />
            </span>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Edad" error={errors.age?.message}>
            <input
              type="number"
              inputMode="numeric"
              placeholder="21"
              {...register('age', {
                valueAsNumber: true,
                min: { value: 14, message: 'Mínimo 14' },
                max: { value: 50, message: 'Máximo 50' },
              })}
            />
          </Field>
          <Field label="Llegó en" error={errors.joined_year?.message}>
            <input
              type="number"
              inputMode="numeric"
              placeholder={String(currentYear)}
              {...register('joined_year', {
                valueAsNumber: true,
                min: { value: 1950, message: 'Año no válido' },
                max: { value: 2100, message: 'Año no válido' },
              })}
            />
          </Field>
        </div>

        <Field label="Media al empezar la temporada" error={errors.ovr_start?.message}>
          <input
            type="number"
            inputMode="numeric"
            placeholder="75"
            {...register('ovr_start', {
              valueAsNumber: true,
              min: { value: 1, message: 'Entre 1 y 99' },
              max: { value: 99, message: 'Entre 1 y 99' },
            })}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Valor de mercado ($)"
            hint={Number.isFinite(marketValue) && marketValue > 0 ? `= ${formatValue(dollarsToCents(marketValue))}` : 'En dólares, sin puntos'}
          >
            <input
              type="number"
              inputMode="numeric"
              placeholder="5000000"
              {...register('market_value_start', { valueAsNumber: true, min: 0 })}
            />
          </Field>
          <Field
            label="Salario semanal ($)"
            hint={Number.isFinite(salary) && salary > 0 ? `= ${formatWage(dollarsToCents(salary))}` : 'En dólares por semana'}
          >
            <input
              type="number"
              inputMode="numeric"
              placeholder="15000"
              {...register('salary', { valueAsNumber: true, min: 0 })}
            />
          </Field>
        </div>

        {isEditing && player.stats && (
          <Controller
            control={control}
            name="is_injured"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-pitch-600 bg-pitch-900 px-3.5 py-2">
                <div>
                  <p className="text-sm font-semibold text-white">Lesionado</p>
                  <p className="text-xs text-white/50">Aparecerá como no disponible al registrar partidos</p>
                </div>
                <Switch checked={field.value} onChange={field.onChange} label="Lesionado" hideLabel tone="red" />
              </div>
            )}
          />
        )}
      </form>
    </Sheet>
  );
}
