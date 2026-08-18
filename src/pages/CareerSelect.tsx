// ============================================================
// src/pages/CareerSelect.tsx
// Career selection screen — first thing you see after login.
// Lists all careers and lets you create new ones.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Trophy, Globe, Loader2, Trash2 } from 'lucide-react';
import { useCareers } from '../hooks/useCareers';
import { useAppStore } from '../store/useAppStore';
import type { Career, CreateCareerDto } from '../types/database';
import { clsx } from 'clsx';

interface CareerFormData {
  club_name: string;
  manager_name: string;
  league: string;
  country: string;
}

export default function CareerSelect() {
  const { careers, loading, error, createCareer, deleteCareer } = useCareers();
  const { setActiveCareer, setActiveSeason } = useAppStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CareerFormData>();

  const handleSelectCareer = (career: Career) => {
    setActiveCareer(career);
    setActiveSeason(null); // Will be set by useSeasons hook
    navigate('/dashboard');
  };

  const onSubmit = async (data: CareerFormData) => {
    const dto: CreateCareerDto = {
      club_name: data.club_name,
      manager_name: data.manager_name,
      league: data.league || null,
      country: data.country || null,
    };
    const career = await createCareer(dto);
    if (career) {
      setActiveCareer(career);
      reset();
      setShowForm(false);
      navigate('/dashboard');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Don't trigger career select
    if (!confirm('Delete this career? This cannot be undone.')) return;
    setDeleting(id);
    await deleteCareer(id);
    setDeleting(null);
  };

  return (
    <div className="min-h-screen bg-pitch-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-black text-white mb-2">
            Your <span className="text-neon-glow">Careers</span>
          </h1>
          <p className="text-white/50">Select a career to continue, or start a new one.</p>
        </div>

        {/* Career list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-neon-400" size={32} />
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {careers.map((career, i) => (
              <div
                key={career.id}
                onClick={() => handleSelectCareer(career)}
                className="card-hover p-5 cursor-pointer group animate-fade-in flex items-center gap-4"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Club badge (initials) */}
                <div className="w-14 h-14 rounded-xl bg-neon-400/10 border border-neon-400/20
                                flex items-center justify-center text-xl font-black text-neon-400
                                group-hover:bg-neon-400/20 transition-colors flex-shrink-0">
                  {career.club_name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{career.club_name}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    {career.league && (
                      <span className="flex items-center gap-1 text-xs text-white/50">
                        <Trophy size={11} /> {career.league}
                      </span>
                    )}
                    {career.country && (
                      <span className="flex items-center gap-1 text-xs text-white/50">
                        <Globe size={11} /> {career.country}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/30 mt-0.5">Manager: {career.manager_name}</p>
                </div>

                <button
                  onClick={(e) => handleDelete(e, career.id)}
                  disabled={deleting === career.id}
                  className="btn-danger opacity-0 group-hover:opacity-100 transition-opacity p-2"
                  title="Delete career"
                >
                  {deleting === career.id
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Trash2 size={16} />}
                </button>
              </div>
            ))}

            {careers.length === 0 && !showForm && (
              <div className="card p-12 text-center">
                <Trophy size={48} className="text-white/20 mx-auto mb-4" />
                <h3 className="text-white/50 font-medium">No careers yet</h3>
                <p className="text-white/30 text-sm mt-1">Create your first coaching career below</p>
              </div>
            )}
          </div>
        )}

        {/* New Career Form */}
        {showForm ? (
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="font-bold text-white mb-4">New Career</h3>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Club Name *</label>
                  <input
                    placeholder="FC Barcelona"
                    {...register('club_name', { required: 'Required' })}
                  />
                  {errors.club_name && <p className="form-error">{errors.club_name.message}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">Manager Name *</label>
                  <input
                    placeholder="Your name"
                    {...register('manager_name', { required: 'Required' })}
                  />
                  {errors.manager_name && <p className="form-error">{errors.manager_name.message}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">League</label>
                  <input placeholder="La Liga" {...register('league')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input placeholder="Spain" {...register('country')} />
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create Career
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="btn-primary w-full justify-center py-3">
            <Plus size={18} />
            New Career
          </button>
        )}
      </div>
    </div>
  );
}
