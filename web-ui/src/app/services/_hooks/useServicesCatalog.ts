'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clinicApi } from '@/modules/clinic/api';
import type {
  AvailableSlotResponse,
  Service,
  ServiceSpecies,
  Specialization,
  Species,
  Veterinarian,
} from '@/modules/clinic/types';
import { SPEC_TONES, formatApiError, getMoscowTodayIso, toIdNameMap } from '@/shared/lib';
import type { ServiceSortOption } from '../_components/types';

export function useServicesCatalog(openParam: string | null, specParam: string | null = null) {
  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [selectedSpec, setSelectedSpec] = useState('ALL');
  const [selectedSpecies, setSelectedSpecies] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ServiceSortOption>('default');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceSpeciesList, setServiceSpeciesList] = useState<ServiceSpecies[]>([]);
  const [activeSpeciesTab, setActiveSpeciesTab] = useState('');
  const [nearestSlots, setNearestSlots] = useState<AvailableSlotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const appliedOpenRef = useRef<string | null>(null);
  const appliedSpecRef = useRef<string | null>(null);

  const reload = useCallback(() => {
    setReloadTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      clinicApi.getSpecializations(),
      clinicApi.getSpecies(),
      clinicApi.getVeterinarians(),
    ])
      .then(([spec, sp, vets]) => {
        if (cancelled) return;
        setSpecializations(Array.isArray(spec) ? spec : []);
        setSpeciesList(Array.isArray(sp) ? sp : []);
        setVeterinarians(Array.isArray(vets) ? vets : []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(formatApiError(err, 'Не удалось загрузить справочники каталога'));
      });

    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const speciesFilter = selectedSpecies !== 'ALL' ? selectedSpecies : undefined;
    clinicApi
      .getServices(undefined, speciesFilter)
      .then((svc) => {
        if (cancelled) return;
        const safeServices = Array.isArray(svc) ? svc : [];
        setServices(safeServices);
        setSelectedService((prev) =>
          prev ? safeServices.find((item) => item.id === prev.id) ?? null : null
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(formatApiError(err, 'Не удалось загрузить список услуг'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSpecies, reloadTick]);

  useEffect(() => {
    if (!specParam) {
      appliedSpecRef.current = null;
      return;
    }
    if (specializations.length === 0 || appliedSpecRef.current === specParam) return;
    const match = specializations.find(
      (s) => s.id === specParam || SPEC_TONES[s.id] === specParam
    );
    if (match) {
      appliedSpecRef.current = specParam;
      setSelectedSpec(match.id);
    }
  }, [specParam, specializations]);

  useEffect(() => {
    if (!openParam || services.length === 0 || appliedOpenRef.current === openParam) return;
    const found = services.find((s) => s.id === openParam);
    if (found) {
      appliedOpenRef.current = openParam;
      setSelectedService(found);
    }
  }, [openParam, services]);

  const selectedServiceId = selectedService?.id ?? null;

  useEffect(() => {
    if (!selectedServiceId) {
      setServiceSpeciesList([]);
      setNearestSlots([]);
      return;
    }

    let cancelled = false;
    setServiceSpeciesList([]);
    setNearestSlots([]);
    clinicApi
      .getServiceSpecies(selectedServiceId)
      .then((res) => {
        if (cancelled) return;
        setServiceSpeciesList(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!cancelled) setServiceSpeciesList([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedServiceId]);

  useEffect(() => {
    if (!selectedServiceId) return;
    if (selectedSpecies !== 'ALL') {
      const allowed =
        serviceSpeciesList.length === 0 ||
        serviceSpeciesList.some((item) => item.speciesId === selectedSpecies);
      if (allowed) {
        setActiveSpeciesTab(selectedSpecies);
        return;
      }
    }
    if (serviceSpeciesList.length > 0) {
      setActiveSpeciesTab((prev) =>
        serviceSpeciesList.some((item) => item.speciesId === prev)
          ? prev
          : serviceSpeciesList[0].speciesId
      );
    } else if (speciesList.length > 0) {
      setActiveSpeciesTab((prev) =>
        speciesList.some((item) => item.id === prev) ? prev : speciesList[0].id
      );
    }
  }, [selectedServiceId, selectedSpecies, serviceSpeciesList, speciesList]);

  useEffect(() => {
    if (!selectedServiceId || !activeSpeciesTab) return;
    let cancelled = false;
    const today = getMoscowTodayIso(0);
    const in3Days = getMoscowTodayIso(3);

    clinicApi
      .findAvailableSlots({
        serviceId: selectedServiceId,
        speciesId: activeSpeciesTab,
        from: today,
        to: in3Days,
      })
      .then((res) => {
        if (!cancelled) setNearestSlots(Array.isArray(res) ? res.slice(0, 8) : []);
      })
      .catch(() => {
        if (!cancelled) setNearestSlots([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedServiceId, activeSpeciesTab]);

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const hasFilters =
    selectedSpec !== 'ALL' ||
    selectedSpecies !== 'ALL' ||
    searchQuery.trim() !== '' ||
    sortBy !== 'default';

  const resetFilters = () => {
    setSelectedSpec('ALL');
    setSelectedSpecies('ALL');
    setSearchQuery('');
    setSortBy('default');
  };

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const result = services.filter(
      (s) =>
        (selectedSpec === 'ALL' || s.specializationId === selectedSpec) &&
        (s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)))
    );
    if (sortBy === 'price-asc') {
      return [...result].sort(
        (a, b) => (a.effectivePrice ?? a.basePrice ?? 0) - (b.effectivePrice ?? b.basePrice ?? 0)
      );
    }
    if (sortBy === 'price-desc') {
      return [...result].sort(
        (a, b) => (b.effectivePrice ?? b.basePrice ?? 0) - (a.effectivePrice ?? a.basePrice ?? 0)
      );
    }
    if (sortBy === 'duration-asc') {
      return [...result].sort(
        (a, b) =>
          (a.effectiveDurationMin ?? a.baseDurationMin ?? 30) -
          (b.effectiveDurationMin ?? b.baseDurationMin ?? 30)
      );
    }
    if (sortBy === 'duration-desc') {
      return [...result].sort(
        (a, b) =>
          (b.effectiveDurationMin ?? b.baseDurationMin ?? 30) -
          (a.effectiveDurationMin ?? a.baseDurationMin ?? 30)
      );
    }
    return result;
  }, [services, selectedSpec, searchQuery, sortBy]);

  return {
    specializations,
    speciesList,
    veterinarians,
    selectedSpec,
    setSelectedSpec,
    selectedSpecies,
    setSelectedSpecies,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    selectedService,
    setSelectedService,
    serviceSpeciesList,
    activeSpeciesTab,
    setActiveSpeciesTab,
    nearestSlots,
    loading,
    error,
    reload,
    specsMap,
    speciesMap,
    hasFilters,
    resetFilters,
    filteredServices,
  };
}
