'use client';

import { useCallback } from 'react';
import { adminApi } from '@/modules/admin/api';
import { useToast } from '@/shared/components';
import { useDictionaries } from '@/shared/hooks';

export function useServiceDictionaries(loadData: () => Promise<void>) {
  const { toast } = useToast();
  const { invalidateDictionaries } = useDictionaries();

  const createSpecies = useCallback(
    async (data: { name: string; color?: string | null; iconKey?: string | null } | string): Promise<void> => {
      await adminApi.createSpecies(data);
      await invalidateDictionaries(['species']);
      await loadData();
      const name = typeof data === 'string' ? data : data.name;
      toast('Вид добавлен', name);
    },
    [invalidateDictionaries, loadData, toast]
  );

  const updateSpecies = useCallback(
    async (
      id: string,
      data: { name?: string; color?: string | null; iconKey?: string | null } | string
    ): Promise<void> => {
      await adminApi.updateSpecies(id, data);
      await invalidateDictionaries(['species']);
      await loadData();
      const name = typeof data === 'string' ? data : data.name;
      toast('Вид обновлён', name);
    },
    [invalidateDictionaries, loadData, toast]
  );

  const deleteSpecies = useCallback(
    async (id: string): Promise<void> => {
      await adminApi.deleteSpecies(id);
      await invalidateDictionaries(['species']);
      await loadData();
      toast('Вид удалён');
    },
    [invalidateDictionaries, loadData, toast]
  );

  const saveSpecialization = useCallback(
    async (
      data: { name: string; description?: string; color?: string | null },
      id?: string
    ): Promise<void> => {
      if (id) await adminApi.updateSpecialization(id, data);
      else await adminApi.createSpecialization(data);
      await invalidateDictionaries(['specializations']);
      await loadData();
      toast('Специализация сохранена', data.name);
    },
    [invalidateDictionaries, loadData, toast]
  );

  const deleteSpecialization = useCallback(
    async (id: string): Promise<void> => {
      await adminApi.deleteSpecialization(id);
      await invalidateDictionaries(['specializations']);
      await loadData();
      toast('Специализация удалена');
    },
    [invalidateDictionaries, loadData, toast]
  );

  return {
    createSpecies,
    updateSpecies,
    deleteSpecies,
    saveSpecialization,
    deleteSpecialization,
  };
}
