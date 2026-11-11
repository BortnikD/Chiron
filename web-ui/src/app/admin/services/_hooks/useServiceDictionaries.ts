'use client';

import { useCallback } from 'react';
import { adminApi } from '@/modules/admin/api';
import { useToast } from '@/shared/components';

export function useServiceDictionaries(loadData: () => Promise<void>) {
  const { toast } = useToast();

  const createSpecies = useCallback(
    async (name: string): Promise<void> => {
      await adminApi.createSpecies(name);
      await loadData();
      toast('Вид добавлен', name);
    },
    [loadData, toast]
  );

  const updateSpecies = useCallback(
    async (id: string, name: string): Promise<void> => {
      await adminApi.updateSpecies(id, name);
      await loadData();
      toast('Вид переименован', name);
    },
    [loadData, toast]
  );

  const deleteSpecies = useCallback(
    async (id: string): Promise<void> => {
      await adminApi.deleteSpecies(id);
      await loadData();
      toast('Вид удалён');
    },
    [loadData, toast]
  );

  const saveSpecialization = useCallback(
    async (data: { name: string; description: string }, id?: string): Promise<void> => {
      if (id) await adminApi.updateSpecialization(id, data);
      else await adminApi.createSpecialization(data);
      await loadData();
      toast('Специализация сохранена', data.name);
    },
    [loadData, toast]
  );

  const deleteSpecialization = useCallback(
    async (id: string): Promise<void> => {
      await adminApi.deleteSpecialization(id);
      await loadData();
      toast('Специализация удалена');
    },
    [loadData, toast]
  );

  return {
    createSpecies,
    updateSpecies,
    deleteSpecies,
    saveSpecialization,
    deleteSpecialization,
  };
}
