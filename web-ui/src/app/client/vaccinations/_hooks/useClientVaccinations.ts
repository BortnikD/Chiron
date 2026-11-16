'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet, Vaccination } from '@/modules/client/types';
import {
  formatApiError,
  getMoscowDateKey,
  getMoscowTodayIso,
  getVaccinationDueInfo,
  toIdNameMap,
} from '@/shared/lib';

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
  const info = getVaccinationDueInfo(nextDueStr);
  let label = info.text;
  if (info.status === 'OVERDUE') label = 'Просрочена';
  else if (info.status === 'TODAY') label = 'Сегодня';
  else if (info.status === 'SOON' || info.status === 'UPCOMING') label = `Через ${info.diffDays} дн.`;
  else if (info.status === 'NONE') label = 'По показаниям';

  return {
    label,
    cls: info.cls as VaccinationStatusInfo['cls'],
    tone: info.tone,
  };
}

export function useClientVaccinations(
  initialPetId?: string | null,
  initialSelectedVacId?: string | null
) {
  const initialPet =
    (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('petId') : null) ||
    initialPetId ||
    'all';
  const [pets, setPets] = useState<Pet[]>([]);
  const [petVaccines, setPetVaccines] = useState<PetVaccines[]>([]);
  const [speciesMap, setSpeciesMap] = useState<Record<string, string>>({});
  const [selectedPetId, setSelectedPetIdState] = useState<string>(initialPet);
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

  const setSelectedPetId = useCallback((id: string) => {
    setSelectedPetIdState(id);
    setSelectedVac((prev) => (prev && id !== 'all' && prev.petId !== id ? null : prev));
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (id && id !== 'all') url.searchParams.set('petId', id);
      else url.searchParams.delete('petId');
      const nextSearch = url.searchParams.toString();
      const currentSearch = window.location.search.replace(/^\?/, '');
      if (nextSearch !== currentSearch) {
        window.history.replaceState(null, '', url.pathname + (nextSearch ? `?${nextSearch}` : '') + url.hash);
      }
    }
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
