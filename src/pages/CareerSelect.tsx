// ============================================================
// src/pages/CareerSelect.tsx
// Career selection screen — first thing you see after login.
// Lists all careers and lets you create new ones.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Trophy, Loader2, Trash2, MapPin, UserRound } from 'lucide-react';
import { useCareers } from '../hooks/useCareers';
import { useAppStore } from '../store/useAppStore';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import InlineAlert from '../components/ui/InlineAlert';
import Sheet from '../components/ui/Sheet';
import Field from '../components/ui/Field';
import ClubCrest from '../components/ui/ClubCrest';
import { useConfirm } from '../components/ui/confirm';
import type { Career, CreateCareerDto } from '../types/database';

interface CareerFormData {
  club_name: string;
  manager_name: string;
  league: string;
  country: string;
}

export default function CareerSelect() {
  const { careers, loading, error, createCareer, deleteCareer } = useCareers();
  const { activeCareer, setActiveCareer, setActiveSeason } = useAppStore();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CareerFormData>();

  const handleSelectCareer = (career: Career) => {
    setActiveCareer(career);
    setActiveSeason(null); // Will be set by useSeasons hook
    navigate('/dashboard');
  };

  const openForm = () => {
    reset();
    setShowForm(true);
  };

  const onSubmit = async (data: CareerFormData) => {
    const dto: CreateCareerDto = {
      club_name: data.club_name.trim(),
      manager_name: data.manager_name.trim(),
      league: data.league.trim() || null,
      country: data.country.trim() || null,
    };
    const career = await createCareer(dto);
    if (career) {
      setActiveCareer(career);
      setActiveSeason(null);
      reset();
      setShowForm(false);
      navigate('/dashboard');
    }
  };

  const handleDelete = async (career: Career) => {
    const confirmed = await confirm({
      title: `¿Eliminar ${career.club_name}?`,
      description: 'Se borrarán sus temporadas, jugadores, partidos y trofeos. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar carrera',
      tone: 'danger',
    });
    if (!confirmed) return;

    setDeleting(career.id);
    await deleteCareer(career.id);
    if (activeCareer?.id === career.id) {
      setActiveCareer(null);
      setActiveSeason(null);
    }
    setDeleting(null);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Mis carreras"
        subtitle="Elige con qué club seguir o empieza una nueva."
        primaryAction={{ label: 'Nueva carrera', icon: Plus, onClick: openForm }}
      />

      {error && !showForm && <InlineAlert>{error}</InlineAlert>}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton h-[88px] rounded-2xl" />
          ))}
        </div>
      ) : careers.length === 0 ? (
        <EmptyState
          className="card"
          icon={Trophy}
          title="Todavía no tienes carreras"
          description="Crea tu primera carrera para registrar plantilla, partidos y trofeos."
          action={
            <button type="button" onClick={openForm} className="btn-primary">
              <Plus size={18} /> Crear carrera
            </button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {careers.map((career) => {
            const isActive = activeCareer?.id === career.id;
            return (
              <li key={career.id} className="card-interactive relative flex items-center gap-3.5 p-4">
                {/* Whole card opens the career; the delete button sits above it */}
                <button
                  type="button"
                  onClick={() => handleSelectCareer(career)}
                  aria-label={`Abrir la carrera de ${career.club_name}`}
                  className="absolute inset-0 rounded-2xl"
                />
                <ClubCrest name={career.club_name} size={42} />
                <div className="pointer-events-none min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-bold text-white">{career.club_name}</h2>
                    {isActive && (
                      <span className="badge flex-shrink-0 border-neon-400/30 bg-neon-400/10 text-neon-300">Activa</span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-white/55">
                    <MapPin size={12} className="flex-shrink-0" />
                    {[career.league, career.country].filter(Boolean).join(' · ') || 'Sin liga'}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-white/40">
                    <UserRound size={12} className="flex-shrink-0" />
                    {career.manager_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(career)}
                  disabled={deleting === career.id}
                  aria-label={`Eliminar la carrera de ${career.club_name}`}
                  className="icon-btn relative z-10 text-white/35 hover:bg-red-500/10 hover:text-red-300"
                >
                  {deleting === career.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nueva carrera"
        description="Solo necesitas el club y tu nombre; lo demás es opcional."
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" form="career-form" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Crear carrera
            </button>
          </div>
        }
      >
        <form id="career-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          {error && <InlineAlert className="sm:col-span-2">{error}</InlineAlert>}
          <Field label="Club" required error={errors.club_name?.message}>
            <input
              data-autofocus
              autoComplete="off"
              placeholder="Racing Club"
              {...register('club_name', { required: 'Escribe el nombre del club', validate: (v) => v.trim() !== '' || 'Escribe el nombre del club' })}
            />
          </Field>
          <Field label="Entrenador" required error={errors.manager_name?.message}>
            <input
              autoComplete="name"
              placeholder="Tu nombre"
              {...register('manager_name', { required: 'Escribe tu nombre', validate: (v) => v.trim() !== '' || 'Escribe tu nombre' })}
            />
          </Field>
          <Field label="Liga">
            <input autoComplete="off" placeholder="Liga Profesional" {...register('league')} />
          </Field>
          <Field label="País">
            <input autoComplete="country-name" placeholder="Argentina" {...register('country')} />
          </Field>
        </form>
      </Sheet>
    </div>
  );
}
