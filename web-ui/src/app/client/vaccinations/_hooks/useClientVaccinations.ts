'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet, Vaccination } from '@/modules/client/types';
import { formatApiError, getMoscowDateKey, getMoscowTodayIso, toIdNameMap } from '@/shared/lib';

export interface PetVaccines {
  pet: Pet;
  vaccines: Vaccination[];
}

export interface VaccinationStatusInfo {
  label: string;
  cls: string;
  tone: 'normal' | 'warn' | 'danger';
}

export function getVaccinationStatus(nextDueStr?: string | null): VaccinationStatusInfo {
  if (!nextDueStr) {
    return { label: 'Выполнено', cls: 'badge-accent', tone: 'normal' };
  }

  const [ty, tm, td] = getMoscowTodayIso().split('-').map(Number);
  const todayMs = Date.UTC(ty, tm - 1, td);

  const dueKey = getMoscowDateKey(nextDueStr) || nextDueStr.slice(0, 10);
  const [y, m, d] = dueKey.split('-').map(Number);
  const dueMs = y && m && d ? Date.UTC(y, m - 1, d) : NaN;
  if (Number.isNaN(dueMs)) {
    return { label: 'Выполнено', cls: 'badge-accent', tone: 'normal' };
  }

  const diffDays = Math.ceil((dueMs - todayMs) / 86400000);

  if (diffDays < 0) {
    return { label: 'Просрочена', cls: 'due-over', tone: 'danger' };
  }
  if (diffDays <= 30) {
    return {
      label: diffDays === 0 ? 'Сегодня' : `Через ${diffDays} дн.`,
      cls: 'due-soon',
      tone: 'warn',
    };
  }
  const months = Math.round(diffDays / 30);
  return {
    label: `Через ${months} мес.`,
    cls: 'badge-accent',
    tone: 'normal',
  };
}

export function useClientVaccinations() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petVaccines, setPetVaccines] = useState<PetVaccines[]>([]);
  const [speciesMap, setSpeciesMap] = useState<Record<string, string>>({});
  const [selectedPetId, setSelectedPetId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadAll = useCallback(async (isCancelled?: () => boolean) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [fetchedPets, allVaccines, speciesList] = await Promise.all([
        clientApi.getPets(),
        clientApi.getVaccinations(),
        clinicApi.getSpecies().catch(() => []),
      ]);
      if (!isMountedRef.current || isCancelled?.() || reqId !== requestIdRef.current) return;

      const safePets = Array.isArray(fetchedPets) ? fetchedPets : [];
      const safeVaccines = Array.isArray(allVaccines) ? allVaccines : [];
      setPets(safePets);
      setSpeciesMap(toIdNameMap(Array.isArray(speciesList) ? speciesList : []));

      const vacsByPet: Record<string, Vaccination[]> = {};
      for (const vac of safeVaccines) {
        if (!vacsByPet[vac.petId]) vacsByPet[vac.petId] = [];
        vacsByPet[vac.petId].push(vac);
      }

      setPetVaccines(
        safePets.map((pet) => ({
          pet,
          vaccines: vacsByPet[pet.id] ?? [],
        }))
      );
    } catch (err: unknown) {
      if (!isMountedRef.current || isCancelled?.() || reqId !== requestIdRef.current) return;
      setError(formatApiError(err, 'Не удалось загрузить график вакцинации'));
    } finally {
      if (isMountedRef.current && !isCancelled?.() && reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadAll(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  const reload = useCallback(() => {
    void loadAll();
  }, [loadAll]);

  const { totalCount, overdueCount, soonCount } = useMemo(() => {
    const allVaccines = petVaccines.flatMap((pv) => pv.vaccines);
    let overdue = 0;
    let soon = 0;
    for (const v of allVaccines) {
      const nextDue = v.nextDueOn || v.validUntil;
      if (!nextDue) continue;
      const tone = getVaccinationStatus(nextDue).tone;
      if (tone === 'danger') overdue++;
      else if (tone === 'warn') soon++;
    }
    return { totalCount: allVaccines.length, overdueCount: overdue, soonCount: soon };
  }, [petVaccines]);

  const filteredData = useMemo(
    () => (selectedPetId === 'all' ? petVaccines : petVaccines.filter((pv) => pv.pet.id === selectedPetId)),
    [petVaccines, selectedPetId]
  );

  return {
    pets,
    speciesMap,
    selectedPetId,
    setSelectedPetId,
    loading,
    error,
    reload,
    filteredData,
    totalCount,
    overdueCount,
    soonCount,
  };
}
