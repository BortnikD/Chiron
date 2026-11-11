'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet, Vaccination } from '@/modules/client/types';
import { formatApiError, getMoscowDateKey, getMoscowTodayIso, toIdNameMap } from '@/shared/lib';

export interface PetVaccines {
  pet: Pet;
  vaccines: Vaccination[];
  hasOverdue: boolean;
}

export interface VaccinationStatusInfo {
  label: string;
  cls: 'due-over' | 'due-soon' | 'badge-accent' | 'due-later' | 'due-none';
  tone: 'normal' | 'warn' | 'danger';
}

export function getVaccinationStatus(nextDueStr?: string | null): VaccinationStatusInfo {
  if (!nextDueStr) {
    return { label: 'По показаниям', cls: 'due-none', tone: 'normal' };
  }

  const [ty, tm, td] = getMoscowTodayIso().split('-').map(Number);
  const todayMs = Date.UTC(ty, tm - 1, td);

  const dueKey = getMoscowDateKey(nextDueStr) || nextDueStr.slice(0, 10);
  const [y, m, d] = dueKey.split('-').map(Number);
  const dueMs = y && m && d ? Date.UTC(y, m - 1, d) : NaN;
  if (Number.isNaN(dueMs)) {
    return { label: 'По показаниям', cls: 'due-none', tone: 'normal' };
  }

  const diffDays = Math.ceil((dueMs - todayMs) / 86400000);

  if (diffDays < 0) {
    return { label: 'Просрочена', cls: 'due-over', tone: 'danger' };
  }
  if (diffDays <= 7) {
    return {
      label: diffDays === 0 ? 'Сегодня' : `Через ${diffDays} дн.`,
      cls: 'due-soon',
      tone: 'warn',
    };
  }
  if (diffDays <= 30) {
    return {
      label: `Через ${diffDays} дн.`,
      cls: 'badge-accent',
      tone: 'normal',
    };
  }
  const months = Math.max(1, Math.round(diffDays / 30));
  return {
    label: `Через ${months} мес.`,
    cls: 'due-later',
    tone: 'normal',
  };
}

export function useClientVaccinations(
  initialPetId?: string | null,
  initialSelectedVacId?: string | null
) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petVaccines, setPetVaccines] = useState<PetVaccines[]>([]);
  const [speciesMap, setSpeciesMap] = useState<Record<string, string>>({});
  const [selectedPetId, setSelectedPetIdState] = useState<string>('all');
  const [selectedVac, setSelectedVac] = useState<Vaccination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const didApplyParamsRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setSelectedPetId = useCallback((petId: string) => {
    setSelectedPetIdState(petId);
    setSelectedVac((prev) => (prev && petId !== 'all' && prev.petId !== petId ? null : prev));
  }, []);

  const loadAll = useCallback(
    async (isCancelled?: () => boolean) => {
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

        const safePets = (Array.isArray(fetchedPets) ? fetchedPets : [])
          .slice()
          .sort((a, b) => Number(a.isArchived) - Number(b.isArchived));
        const safeVaccines = Array.isArray(allVaccines) ? allVaccines : [];
        setPets(safePets);
        setSpeciesMap(toIdNameMap(Array.isArray(speciesList) ? speciesList : []));

        const vacsByPet: Record<string, Vaccination[]> = {};
        for (const vac of safeVaccines) {
          if (!vacsByPet[vac.petId]) vacsByPet[vac.petId] = [];
          vacsByPet[vac.petId].push(vac);
        }

        setPetVaccines(
          safePets.map((pet) => {
            const list = (vacsByPet[pet.id] ?? []).slice().sort((a, b) => {
              const aDue = a.nextDueOn || a.validUntil || '9999-12-31';
              const bDue = b.nextDueOn || b.validUntil || '9999-12-31';
              return aDue.localeCompare(bDue);
            });
            const hasOverdue = list.some(
              (v) => getVaccinationStatus(v.nextDueOn || v.validUntil).cls === 'due-over'
            );
            return { pet, vaccines: list, hasOverdue };
          })
        );

        const paramSignature = `${initialPetId ?? ''}::${initialSelectedVacId ?? ''}`;
        if (didApplyParamsRef.current !== paramSignature) {
          didApplyParamsRef.current = paramSignature;
          const matchedVac = initialSelectedVacId
            ? safeVaccines.find((v) => v.id === initialSelectedVacId) ?? null
            : null;
          if (matchedVac) {
            setSelectedVac(matchedVac);
            setSelectedPetIdState(
              initialPetId && safePets.some((p) => p.id === initialPetId)
                ? initialPetId
                : matchedVac.petId
            );
          } else if (initialPetId && safePets.some((p) => p.id === initialPetId)) {
            setSelectedPetIdState(initialPetId);
          }
        } else {
          setSelectedVac((prev) =>
            prev ? safeVaccines.find((v) => v.id === prev.id) ?? null : null
          );
        }
      } catch (err: unknown) {
        if (!isMountedRef.current || isCancelled?.() || reqId !== requestIdRef.current) return;
        setError(formatApiError(err, 'Не удалось загрузить график вакцинации'));
      } finally {
        if (isMountedRef.current && !isCancelled?.() && reqId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [initialPetId, initialSelectedVacId]
  );

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
    () =>
      selectedPetId === 'all'
        ? petVaccines
        : petVaccines.filter((pv) => pv.pet.id === selectedPetId),
    [petVaccines, selectedPetId]
  );

  const petsMap = useMemo(() => Object.fromEntries(pets.map((p) => [p.id, p])), [pets]);

  return {
    pets,
    petsMap,
    petVaccines,
    speciesMap,
    selectedPetId,
    setSelectedPetId,
    selectedVac,
    setSelectedVac,
    loading,
    error,
    reload,
    filteredData,
    totalCount,
    overdueCount,
    soonCount,
  };
}
