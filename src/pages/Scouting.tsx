// ============================================================
// src/pages/Scouting.tsx
// Transfer hub: 4-column Kanban scouting board.
// ============================================================

import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useScouting } from '../hooks/useScouting';
import { SCOUTING_LIST_TYPES, formatValue } from '../lib/constants';
import { Plus, Loader2, X, Trash2, Star, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { clsx } from 'clsx';
import type { ScoutingListType, CreateScoutingEntryDto } from '../types/database';

interface ScoutFormData {
  full_name: string;
  position: string;
  nationality: string;
  current_club: string;
  current_ovr: number;
  estimated_value: number;
  list_type: ScoutingListType;
  notes: string;
}

export default function Scouting() {
  const { activeCareer } = useAppStore();
  const { byList, loading, addEntry, moveEntry, deleteEntry } = useScouting(activeCareer?.id ?? null);
  const [showForm, setShowForm] = useState(false);
  const [defaultList, setDefaultList] = useState<ScoutingListType>('target');

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ScoutFormData>();

  const openForm = (list: ScoutingListType) => {
    setDefaultList(list);
    setShowForm(true);
  };

  const onSubmit = async (data: ScoutFormData) => {
    if (!activeCareer) return;
    const dto: CreateScoutingEntryDto = {
      career_id: activeCareer.id,
      full_name: data.full_name,
      position: data.position || null,
      nationality: data.nationality || null,
      current_club: data.current_club || null,
      current_ovr: data.current_ovr || null,
      estimated_value: data.estimated_value ? data.estimated_value * 100 : null,
      list_type: data.list_type,
      notes: data.notes || null,
    };
    await addEntry(dto);
    reset();
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Transfer Hub</h1>
          <p className="text-white/50 text-sm mt-1">Your scouting board & watchlists</p>
        </div>
        <button onClick={() => openForm('target')} className="btn-primary">
          <Plus size={16} /> Add Scout Target
        </button>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">Add Scout Target</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-2"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group col-span-2">
                  <label className="form-label">Player Name *</label>
                  <input placeholder="Lamine Yamal" {...register('full_name', { required: true })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input placeholder="LW" {...register('position')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nationality</label>
                  <input placeholder="Spain" {...register('nationality')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Club</label>
                  <input placeholder="FC Barcelona" {...register('current_club')} />
                </div>
                <div className="form-group">
                  <label className="form-label">OVR</label>
                  <input type="number" min={1} max={99} placeholder="82" {...register('current_ovr', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Est. Value ($)</label>
                  <input type="number" placeholder="45000000" {...register('estimated_value', { valueAsNumber: true })} />
                </div>
                <div className="form-group">
                  <label className="form-label">List</label>
                  <select defaultValue={defaultList} {...register('list_type')} className="w-full">
                    {SCOUTING_LIST_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea rows={2} placeholder="Left footer, great dribbling..." {...register('notes')} className="resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {SCOUTING_LIST_TYPES.map(listType => {
            const entries = byList[listType.value];
            return (
              <div key={listType.value} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={clsx('text-lg', listType.color)}>{listType.emoji}</span>
                    <h3 className="font-semibold text-white text-sm">{listType.label}</h3>
                    <span className="badge bg-pitch-700 text-white/50 border-pitch-600 text-[10px]">
                      {entries.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openForm(listType.value)}
                    className="text-white/30 hover:text-white transition-colors"
                    title={`Add to ${listType.label}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[100px]">
                  {entries.map(entry => (
                    <div key={entry.id} className="card p-3 group hover:border-white/10 transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-white text-sm">{entry.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {entry.position && (
                              <span className="text-[10px] text-white/40 bg-pitch-700 px-1.5 py-0.5 rounded">
                                {entry.position}
                              </span>
                            )}
                            {entry.nationality && (
                              <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                                <Globe size={9} /> {entry.nationality}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {entry.current_ovr && (
                            <span className="ovr-badge text-xs w-9 h-9">{entry.current_ovr}</span>
                          )}
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="btn-danger p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {entry.current_club && (
                        <p className="text-xs text-white/40 mb-1">{entry.current_club}</p>
                      )}
                      {entry.estimated_value && (
                        <p className="text-xs text-neon-400 font-medium">{formatValue(entry.estimated_value)}</p>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-white/30 mt-2 italic line-clamp-2">{entry.notes}</p>
                      )}

                      {/* Move to different list */}
                      <div className="flex gap-1 mt-2 pt-2 border-t border-pitch-700 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                        {SCOUTING_LIST_TYPES
                          .filter(t => t.value !== listType.value)
                          .map(t => (
                            <button
                              key={t.value}
                              onClick={() => moveEntry(entry.id, t.value)}
                              className="text-[10px] text-white/40 hover:text-white transition-colors px-1.5 py-0.5 rounded bg-pitch-700 hover:bg-pitch-600"
                              title={`Move to ${t.label}`}
                            >
                              → {t.emoji}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  ))}

                  {entries.length === 0 && (
                    <div
                      className="border-2 border-dashed border-pitch-700 rounded-xl p-4 text-center cursor-pointer hover:border-pitch-600 transition-colors"
                      onClick={() => openForm(listType.value)}
                    >
                      <p className="text-white/20 text-xs">No players here yet</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
