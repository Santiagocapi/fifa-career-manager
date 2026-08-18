// ============================================================
// src/hooks/useCareers.ts
// CRUD operations for the "careers" table.
//
// PATTERN EXPLAINED:
// Every hook follows the same structure:
//   1. State: data, loading, error
//   2. useEffect: fetch data when the hook mounts
//   3. Actions: create, update, delete functions
//   4. Return: all state + actions as a single object
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Career, CreateCareerDto } from '../types/database';

interface UseCareersReturn {
  careers: Career[];
  loading: boolean;
  error: string | null;
  createCareer: (data: CreateCareerDto) => Promise<Career | null>;
  updateCareer: (id: string, data: Partial<CreateCareerDto>) => Promise<void>;
  deleteCareer: (id: string) => Promise<void>;
  refetch: () => void;
}

export const useCareers = (): UseCareersReturn => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCareers = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Supabase query: SELECT * FROM careers ORDER BY created_at DESC
    // RLS automatically filters: WHERE user_id = auth.uid()
    const { data, error: err } = await supabase
      .from('careers')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setCareers(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  const createCareer = async (dto: CreateCareerDto): Promise<Career | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    const { data, error: err } = await supabase
      .from('careers')
      .insert({
        ...dto,
        user_id: user.id,
      })
      .select()    // Return the inserted row
      .single();   // We expect exactly one row back

    if (err) {
      setError(err.message);
      return null;
    }

    // Optimistic update: add the new career to the local list
    // without waiting for another network request
    setCareers(prev => [data, ...prev]);
    return data;
  };

  const updateCareer = async (id: string, dto: Partial<CreateCareerDto>) => {
    const { error: err } = await supabase
      .from('careers')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (err) {
      setError(err.message);
      return;
    }

    // Update the career in local state
    setCareers(prev => prev.map(c => c.id === id ? { ...c, ...dto } : c));
  };

  const deleteCareer = async (id: string) => {
    const { error: err } = await supabase
      .from('careers')
      .delete()
      .eq('id', id);

    if (err) {
      setError(err.message);
      return;
    }

    setCareers(prev => prev.filter(c => c.id !== id));
  };

  return {
    careers,
    loading,
    error,
    createCareer,
    updateCareer,
    deleteCareer,
    refetch: fetchCareers,
  };
};
