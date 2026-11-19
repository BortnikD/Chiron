'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet } from '@/modules/client/types';
import type { Service, Veterinarian, Specialization, Species } from '@/modules/clinic/types';
import { formatApiError, registerSpecializationColors, toIdNameMap } from '@/shared/lib';
import { useDictionaries } from '@/shared/hooks';

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
  initialIntent?: string | null,
  initialSpeciesId?: string | null
) {
  const {
    veterinarians: dictVets,
    specializations: dictSpecializations,
    species: dictSpecies,
  } = useDictionaries();

  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);

  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [serviceSpeciesIds, setServiceSpeciesIds] = useState<string[] | null>(null);
  const [isServiceLocked, setIsServiceLocked] = useState<boolean>(
    Boolean(initialServiceId || initialIntent === 'vaccination')
  );
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
  const initialServiceIdRef = useRef(initialServiceId);
  initialServiceIdRef.current = initialServiceId;
  const initKey = `${initialServiceId ?? ''}|${initialVetId ?? ''}|${initialPetId ?? ''}|${initialSlot ?? ''}|${initialIntent ?? ''}|${initialSpeciesId ?? ''}`;
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

    clientApi.getPets()
      .then(async (petsData) => {
        if (cancelled) return;
        const vetsData = dictVets.length > 0 ? dictVets : await clinicApi.getVeterinarians();
        const specData = dictSpecializations.length > 0 ? dictSpecializations : await clinicApi.getSpecializations();
        if (Array.isArray(specData)) {
          registerSpecializationColors(specData);
        }
        const spData = dictSpecies.length > 0 ? dictSpecies : await clinicApi.getSpecies();
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

        // Если в URL передана конкретная услуга, проверяем допустимые виды животных для неё
        let svcSpeciesFilter: string[] | null = null;
        if (initialServiceId) {
          const svcLinks = await clinicApi.getServiceSpecies(initialServiceId).catch(() => []);
          if (cancelled) return;
          if (Array.isArray(svcLinks) && svcLinks.length > 0) {
            svcSpeciesFilter = svcLinks.map((l) => l.speciesId);
          }
        }
        setServiceSpeciesIds(svcSpeciesFilter);

        const isSpeciesCompatible = (speciesId: string) => {
          if (vetSpeciesFilter && !vetSpeciesFilter.includes(speciesId)) return false;
          if (svcSpeciesFilter && !svcSpeciesFilter.includes(speciesId)) return false;
          return true;
        };

        let resolvedPet: Pet | null = null;
        if (isFreshInit) {
          if (initialPetId) {
            const candidate = activePets.find((p) => p.id === initialPetId) ?? null;
            if (candidate && isSpeciesCompatible(candidate.speciesId)) {
              resolvedPet = candidate;
            } else if (!vetSpeciesFilter && !svcSpeciesFilter) {
              resolvedPet = activePets[0] ?? null;
            }
          } else if (initialSpeciesId) {
            const candidate = activePets.find((p) => p.speciesId === initialSpeciesId) ?? null;
            if (candidate) {
              resolvedPet = candidate;
            } else if (vetSpeciesFilter || svcSpeciesFilter) {
              resolvedPet = activePets.find((p) => isSpeciesCompatible(p.speciesId)) ?? null;
            } else {
              resolvedPet = activePets[0] ?? null;
            }
          } else if (vetSpeciesFilter || svcSpeciesFilter) {
            resolvedPet = activePets.find((p) => isSpeciesCompatible(p.speciesId)) ?? null;
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

        let safeSvc = Array.isArray(svcData) ? svcData : [];
        loadedSpeciesIdRef.current = targetSpeciesId;

        let matchedService = initialServiceId
          ? safeSvc.find((s) => s.id === initialServiceId) ?? null
          : initialIntent === 'vaccination'
            ? findVaccinationService(safeSvc)
            : null;

        if (!matchedService && initialServiceId) {
          const fallbackSvc = await clinicApi.getServiceById(initialServiceId).catch(() => null);
          if (cancelled) return;
          if (fallbackSvc && fallbackSvc.isActive !== false) {
            matchedService = fallbackSvc;
            if (!safeSvc.some((s) => s.id === fallbackSvc.id)) {
              safeSvc = [fallbackSvc, ...safeSvc];
            }
          }
        }

        setPets(safePets);
        setServices(safeSvc);
        setVeterinarians(normalizedVets);
        setSpecializations(Array.isArray(specData) ? specData : []);
        setSpeciesList(Array.isArray(spData) ? spData : []);

        if (!isFreshInit) {
          setSelectedPet(resolvedPet);
          setSelectedService((prev) =>
            prev ? safeSvc.find((s) => s.id === prev.id) ?? prev : null
          );
          return;
        }
        lastInitKeyRef.current = initKey;

        setSelectedPet(resolvedPet);
        setSelectedService(matchedService);
        setSelectedServices(matchedService ? [matchedService] : []);
        setIsServiceLocked(Boolean(matchedService && (initialServiceId || initialIntent === 'vaccination')));

        const vetHasSpec = (v: Veterinarian, specId?: string | null) => {
          if (!specId) return true;
          if (v.specializationIds && v.specializationIds.length > 0) {
            return v.specializationIds.includes(specId);
          }
          return v.specializationId === specId;
        };

        const matchedVet =
          rawMatchedVet &&
          rawMatchedVet.isActive !== false &&
          vetHasSpec(rawMatchedVet, matchedService?.specializationId)
            ? rawMatchedVet
            : null;
        if (matchedVet) {
          setSelectedVet(matchedVet);
          setIsAnyVet(false);
        } else {
          setSelectedVet(null);
          setIsAnyVet(true);
        }

        // Если конкретный питомец был явно передан в URL (например, из карточки питомца `?petId=...`):
        // переходим сразу на следующий незаполненный шаг.
        // Если же переход был из каталога услуг (`?serviceId=...&slot=...`), то пользователя ВСЕГДА
        // оставляем на Шаге 1 («Кого записываем?»), чтобы он мог выбрать или подтвердить нужного питомца.
        if (initialPetId && resolvedPet) {
          if (matchedService && (matchedVet || initialSlot)) {
            onSetStepRef.current(4);
          } else if (matchedService) {
            onSetStepRef.current(3);
          } else {
            onSetStepRef.current(2);
          }
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
          if (initialServiceIdRef.current) {
            const byInitId = safeSvc.find((s) => s.id === initialServiceIdRef.current);
            if (byInitId) return byInitId;
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

  const toggleService = useCallback((svc: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === svc.id);
      if (exists) {
        const next = prev.filter((s) => s.id !== svc.id);
        setSelectedService(next[0] || null);
        return next;
      }
      // По правилу OpenAPI: все запланированные услуги одной записи должны относиться к одной специализации
      if (prev.length > 0 && prev[0].specializationId !== svc.specializationId) {
        // При клике на услугу другой специализации переключаем комплекс на новую услугу
        setSelectedService(svc);
        return [svc];
      }
      if (prev.length >= 20) return prev;
      const next = [...prev, svc];
      setSelectedService(next[0] || null);
      return next;
    });
  }, []);

  const selectSingleService = useCallback((svc: Service | null) => {
    setSelectedService(svc);
    setSelectedServices(svc ? [svc] : []);
  }, []);

  const removeService = useCallback((serviceId: string) => {
    setSelectedServices((prev) => {
      const next = prev.filter((s) => s.id !== serviceId);
      setSelectedService(next[0] || null);
      return next;
    });
  }, []);

  const clearServices = useCallback(() => {
    setSelectedServices([]);
    setSelectedService(null);
  }, []);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);
  const vetsMap = useMemo(
    () => Object.fromEntries(veterinarians.map((v) => [v.id, v])),
    [veterinarians]
  );

  return {
    pets,
    setPets,
    services,
    veterinarians,
    specializations,
    speciesList,
    selectedPet,
    setSelectedPet,
    selectedService,
    setSelectedService,
    selectedServices,
    setSelectedServices,
    toggleService,
    selectSingleService,
    removeService,
    clearServices,
    serviceSpeciesIds,
    setServiceSpeciesIds,
    isServiceLocked,
    setIsServiceLocked,
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
