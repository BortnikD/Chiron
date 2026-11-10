'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet } from '@/modules/client/types';
import type { Service, Veterinarian, Specialization, Species } from '@/modules/clinic/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';

/**
 * Хук загрузки справочников и инициализации выбранных сущностей записи.
 */
export function useBookingData(
  initialServiceId: string | null,
  initialVetId: string | null,
  onSetStep: (step: number) => void,
  initialPetId?: string | null,
  initialSlot?: string | null
) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isAnyVet, setIsAnyVet] = useState<boolean>(true);
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);

  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [loadingServices, setLoadingServices] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const onSetStepRef = useRef(onSetStep);
  onSetStepRef.current = onSetStep;
  const didInitRef = useRef(false);
  const loadedSpeciesIdRef = useRef<string | null | undefined>(undefined);
  const selectedPetRef = useRef<Pet | null>(null);
  selectedPetRef.current = selectedPet;

  const reloadData = useCallback(() => {
    setReloadTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);
    setDataError(null);

    Promise.all([
      clientApi.getPets({ isArchived: false }),
      clinicApi.getVeterinarians(),
      clinicApi.getSpecializations(),
      clinicApi.getSpecies(),
    ])
      .then(async ([petsData, vetsData, specData, spData]) => {
        if (cancelled) return;
        const safePets = (Array.isArray(petsData) ? petsData : []).filter((p) => !p.isArchived);
        const safeVets = Array.isArray(vetsData) ? vetsData : [];

        const rawMatchedVet = initialVetId
          ? safeVets.find((v) => v.id === initialVetId) ?? null
          : null;

        let resolvedPet: Pet | null = null;
        if (!didInitRef.current) {
          if (initialPetId) {
            resolvedPet = safePets.find((p) => p.id === initialPetId) ?? safePets[0] ?? null;
          } else if (rawMatchedVet && Array.isArray(rawMatchedVet.speciesIds)) {
            resolvedPet =
              safePets.find((p) => rawMatchedVet.speciesIds!.includes(p.speciesId)) ??
              safePets[0] ??
              null;
          } else {
            resolvedPet = safePets[0] ?? null;
          }
        } else {
          const prevPet = selectedPetRef.current;
          resolvedPet =
            (prevPet ? safePets.find((p) => p.id === prevPet.id) : null) ?? safePets[0] ?? null;
        }

        const targetSpeciesId = resolvedPet?.speciesId ?? null;
        const svcData = await clinicApi.getServices(undefined, targetSpeciesId ?? undefined);
        if (cancelled) return;

        const safeSvc = Array.isArray(svcData) ? svcData : [];
        loadedSpeciesIdRef.current = targetSpeciesId;

        setPets(safePets);
        setServices(safeSvc);
        setVeterinarians(safeVets);
        setSpecializations(Array.isArray(specData) ? specData : []);
        setSpeciesList(Array.isArray(spData) ? spData : []);

        if (didInitRef.current) {
          setSelectedPet(resolvedPet);
          setSelectedService((prev) =>
            prev ? safeSvc.find((s) => s.id === prev.id) ?? null : null
          );
          return;
        }
        didInitRef.current = true;

        if (resolvedPet) {
          setSelectedPet(resolvedPet);
        }

        const matchedService = initialServiceId
          ? safeSvc.find((s) => s.id === initialServiceId) ?? null
          : null;
        if (matchedService) {
          setSelectedService(matchedService);
        }

        const matchedVet =
          rawMatchedVet &&
          rawMatchedVet.isActive !== false &&
          (!matchedService?.specializationId ||
            rawMatchedVet.specializationId === matchedService.specializationId) &&
          (!resolvedPet ||
            !Array.isArray(rawMatchedVet.speciesIds) ||
            rawMatchedVet.speciesIds.includes(resolvedPet.speciesId))
            ? rawMatchedVet
            : null;
        if (matchedVet) {
          setSelectedVet(matchedVet);
          setIsAnyVet(false);
        }

        if (resolvedPet && matchedService && (matchedVet || initialSlot)) {
          onSetStepRef.current(3);
        } else if (resolvedPet && matchedService) {
          onSetStepRef.current(2);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDataError(formatApiError(err, 'Не удалось загрузить справочники записи'));
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialServiceId, initialVetId, initialPetId, initialSlot, reloadTick]);

  const selectedSpeciesId = selectedPet?.speciesId ?? null;

  useEffect(() => {
    if (!didInitRef.current) return;
    if (loadedSpeciesIdRef.current === selectedSpeciesId) return;

    let cancelled = false;
    setLoadingServices(true);
    setDataError(null);

    clinicApi
      .getServices(undefined, selectedSpeciesId ?? undefined)
      .then((svcData) => {
        if (cancelled) return;
        loadedSpeciesIdRef.current = selectedSpeciesId;
        const safeSvc = Array.isArray(svcData) ? svcData : [];
        setServices(safeSvc);
        setSelectedService((prev) =>
          prev ? safeSvc.find((s) => s.id === prev.id) ?? null : null
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDataError(formatApiError(err, 'Не удалось загрузить услуги для выбранного вида'));
      })
      .finally(() => {
        if (!cancelled) setLoadingServices(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSpeciesId]);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  return {
    pets,
    services,
    veterinarians,
    specializations,
    speciesList,
    selectedPet,
    setSelectedPet,
    selectedService,
    setSelectedService,
    isAnyVet,
    setIsAnyVet,
    selectedVet,
    setSelectedVet,
    loadingData,
    loadingServices,
    dataError,
    reloadData,
    specsMap,
    speciesMap,
  };
}
