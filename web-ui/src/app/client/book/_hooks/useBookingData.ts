'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet } from '@/modules/client/types';
import type { Service, Veterinarian, Specialization, Species } from '@/modules/clinic/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';

const VACCINATION_SERVICE_ID = '5eed0003-0000-0000-0000-000000000002';

/**
 * Определяет, является ли услуга вакцинацией.
 */
export function isVaccinationService(service: Service | null | undefined): boolean {
  if (!service) return false;
  return service.id === VACCINATION_SERVICE_ID || /вакцин|привив/i.test(service.name);
}

function findVaccinationService(services: Service[]): Service | null {
  return (
    services.find((s) => s.id === VACCINATION_SERVICE_ID) ??
    services.find((s) => /вакцин|привив/i.test(s.name)) ??
    null
  );
}

/**
 * Хук загрузки справочников и инициализации выбранных сущностей мастера записи.
 */
export function useBookingData(
  initialServiceId: string | null,
  initialVetId: string | null,
  onSetStep: (step: number) => void,
  initialPetId?: string | null,
  initialSlot?: string | null,
  initialIntent?: string | null
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
  const initialIntentRef = useRef(initialIntent);
  initialIntentRef.current = initialIntent;
  const initKey = `${initialServiceId ?? ''}|${initialVetId ?? ''}|${initialPetId ?? ''}|${initialSlot ?? ''}|${initialIntent ?? ''}`;
  const lastInitKeyRef = useRef<string | null>(null);
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
    const isFreshInit = lastInitKeyRef.current !== initKey;

    Promise.all([
      clientApi.getPets(),
      clinicApi.getVeterinarians(),
      clinicApi.getSpecializations(),
      clinicApi.getSpecies(),
    ])
      .then(async ([petsData, vetsData, specData, spData]) => {
        if (cancelled) return;
        const rawPets = Array.isArray(petsData) ? petsData : [];
        const safePets = rawPets.slice().sort((a, b) => Number(a.isArchived) - Number(b.isArchived));
        const activePets = safePets.filter((p) => !p.isArchived);
        const safeVets = Array.isArray(vetsData) ? vetsData : [];

        const rawMatchedVetFound = initialVetId
          ? safeVets.find((v) => v.id === initialVetId) ?? null
          : null;

        let rawMatchedVet = rawMatchedVetFound;
        if (
          rawMatchedVetFound &&
          rawMatchedVetFound.isActive !== false &&
          !Array.isArray(rawMatchedVetFound.speciesIds)
        ) {
          const perms = await clinicApi
            .getVetSpeciesPermissions(rawMatchedVetFound.id)
            .catch(() => []);
          if (cancelled) return;
          rawMatchedVet = {
            ...rawMatchedVetFound,
            speciesIds: Array.isArray(perms) ? perms.map((p) => p.speciesId) : [],
          };
        }

        const normalizedVets = rawMatchedVet
          ? safeVets.map((v) => (v.id === rawMatchedVet!.id ? rawMatchedVet! : v))
          : safeVets;

        const vetSpeciesFilter =
          rawMatchedVet &&
          rawMatchedVet.isActive !== false &&
          Array.isArray(rawMatchedVet.speciesIds) &&
          rawMatchedVet.speciesIds.length > 0
            ? rawMatchedVet.speciesIds
            : null;

        let resolvedPet: Pet | null = null;
        if (isFreshInit) {
          if (initialPetId) {
            const candidate = activePets.find((p) => p.id === initialPetId) ?? null;
            if (
              candidate &&
              (!vetSpeciesFilter || vetSpeciesFilter.includes(candidate.speciesId))
            ) {
              resolvedPet = candidate;
            } else if (!vetSpeciesFilter) {
              resolvedPet = activePets[0] ?? null;
            }
          } else if (vetSpeciesFilter) {
            resolvedPet =
              activePets.find((p) => vetSpeciesFilter.includes(p.speciesId)) ?? null;
          } else {
            resolvedPet = activePets[0] ?? null;
          }
        } else {
          const prevPet = selectedPetRef.current;
          resolvedPet =
            (prevPet ? activePets.find((p) => p.id === prevPet.id) : null) ??
            activePets[0] ??
            null;
        }

        const targetSpeciesId = resolvedPet?.speciesId ?? null;
        const svcData = await clinicApi.getServices(undefined, targetSpeciesId ?? undefined);
        if (cancelled) return;

        const safeSvc = Array.isArray(svcData) ? svcData : [];
        loadedSpeciesIdRef.current = targetSpeciesId;

        setPets(safePets);
        setServices(safeSvc);
        setVeterinarians(normalizedVets);
        setSpecializations(Array.isArray(specData) ? specData : []);
        setSpeciesList(Array.isArray(spData) ? spData : []);

        if (!isFreshInit) {
          setSelectedPet(resolvedPet);
          setSelectedService((prev) =>
            prev ? safeSvc.find((s) => s.id === prev.id) ?? null : null
          );
          return;
        }
        lastInitKeyRef.current = initKey;

        setSelectedPet(resolvedPet);

        const matchedService = initialServiceId
          ? safeSvc.find((s) => s.id === initialServiceId) ?? null
          : initialIntent === 'vaccination'
            ? findVaccinationService(safeSvc)
            : null;
        setSelectedService(matchedService);

        const matchedVet =
          rawMatchedVet &&
          rawMatchedVet.isActive !== false &&
          (!matchedService?.specializationId ||
            rawMatchedVet.specializationId === matchedService.specializationId)
            ? rawMatchedVet
            : null;
        if (matchedVet) {
          setSelectedVet(matchedVet);
          setIsAnyVet(false);
        } else {
          setSelectedVet(null);
          setIsAnyVet(true);
        }

        const hasSingleActivePet = activePets.length === 1;
        if (resolvedPet && matchedService && (matchedVet || initialSlot)) {
          onSetStepRef.current(4);
        } else if (
          resolvedPet &&
          matchedService &&
          (initialServiceId || initialPetId || hasSingleActivePet)
        ) {
          onSetStepRef.current(3);
        } else if (initialPetId && resolvedPet) {
          onSetStepRef.current(2);
        } else {
          onSetStepRef.current(1);
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
  }, [initKey, initialServiceId, initialVetId, initialPetId, initialSlot, initialIntent, reloadTick]);

  const selectedSpeciesId = selectedPet?.speciesId ?? null;

  useEffect(() => {
    if (lastInitKeyRef.current === null) return;
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
        setSelectedService((prev) => {
          if (prev) {
            const matched = safeSvc.find((s) => s.id === prev.id);
            if (matched) return matched;
          }
          return initialIntentRef.current === 'vaccination'
            ? findVaccinationService(safeSvc)
            : null;
        });
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
  const vetsMap = useMemo(
    () => Object.fromEntries(veterinarians.map((v) => [v.id, v])),
    [veterinarians]
  );

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
    vetsMap,
  };
}
