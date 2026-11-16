'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clinicApi } from '@/modules/clinic/api';
import type {
  AvailableSlotResponse,
  Service,
  ServiceSpecies,
  Specialization,
  Species,
} from '@/modules/clinic/types';
import {
  SPEC_TONES,
  formatApiError,
  getMoscowTodayIso,
  getSpeciesTone,
  toIdNameMap,
} from '@/shared/lib';
import { SPECIALIZATION_NAMES_RU } from '@/shared/lib';
import type { ServiceSortOption } from '../_components/types';

export function useServicesCatalog(
  openParam: string | null = null,
  specParam: string | null = null,
  speciesParam: string | null = null,
  searchParam: string | null = null,
  sortParam: string | null = null
) {
  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [selectedSpec, setSelectedSpec] = useState(specParam || 'ALL');
  const [selectedSpecies, setSelectedSpecies] = useState(speciesParam || 'ALL');
  const [searchQuery, setSearchQuery] = useState(searchParam || '');
  const [sortBy, setSortBy] = useState<ServiceSortOption>(
    (sortParam as ServiceSortOption) || 'default'
  );
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceSpeciesList, setServiceSpeciesList] = useState<ServiceSpecies[]>([]);
  const [activeSpeciesTab, setActiveSpeciesTab] = useState('');
  const [nearestSlots, setNearestSlots] = useState<AvailableSlotResponse[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const appliedOpenRef = useRef<string | null>(null);
  const appliedSpecRef = useRef<string | null>(null);
  const appliedSpeciesRef = useRef<string | null>(null);
  const isInitialSyncRef = useRef(true);

  const reload = useCallback(() => {
    setReloadTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([clinicApi.getSpecializations(), clinicApi.getSpecies()])
      .then(([spec, sp]) => {
        if (cancelled) return;
        setSpecializations(Array.isArray(spec) ? spec : []);
        setSpeciesList(Array.isArray(sp) ? sp : []);
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
        const safeServices = (Array.isArray(svc) ? svc : []).filter((s) => s.isActive !== false);
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
    if (!speciesParam) {
      appliedSpeciesRef.current = null;
      return;
    }
    if (speciesList.length === 0 || appliedSpeciesRef.current === speciesParam) return;
    const match = speciesList.find(
      (sp) => sp.id === speciesParam || getSpeciesTone(sp.name) === speciesParam
    );
    if (match) {
      appliedSpeciesRef.current = speciesParam;
      setSelectedSpecies(match.id);
    }
  }, [speciesParam, speciesList]);

  useEffect(() => {
    if (!openParam) {
      appliedOpenRef.current = null;
      return;
    }
    if (services.length === 0 || appliedOpenRef.current === openParam) return;
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
      setLoadingSlots(false);
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
    setLoadingSlots(true);
    const today = getMoscowTodayIso(0);
    const in7Days = getMoscowTodayIso(6);

    clinicApi
      .findAvailableSlots({
        serviceId: selectedServiceId,
        speciesId: activeSpeciesTab,
        from: today,
        to: in7Days,
      })
      .then((res) => {
        if (cancelled) return;
        const sorted = (Array.isArray(res) ? [...res] : []).sort((a, b) =>
          a.startAt.localeCompare(b.startAt)
        );
        setNearestSlots(sorted);
      })
      .catch(() => {
        if (!cancelled) setNearestSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedServiceId, activeSpeciesTab]);

  const specsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const sp of specializations) {
      map[sp.id] = SPECIALIZATION_NAMES_RU[sp.name] || SPECIALIZATION_NAMES_RU[sp.id] || sp.name;
    }
    return map;
  }, [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const hasFilters =
    selectedSpec !== 'ALL' ||
    selectedSpecies !== 'ALL' ||
    searchQuery.trim() !== '' ||
    sortBy !== 'default';

  const syncToUrl = useCallback(
    (spec: string, species: string, q: string, sort: ServiceSortOption, openId: string | null) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);

      if (spec && spec !== 'ALL') {
        url.searchParams.set('spec', spec);
      } else {
        url.searchParams.delete('spec');
      }

      if (species && species !== 'ALL') {
        url.searchParams.set('species', species);
      } else {
        url.searchParams.delete('species');
      }

      const trimmedQ = q.trim();
      if (trimmedQ) {
        url.searchParams.set('q', trimmedQ);
        url.searchParams.delete('search');
      } else {
        url.searchParams.delete('q');
        url.searchParams.delete('search');
      }

      if (sort && sort !== 'default') {
        url.searchParams.set('sort', sort);
        url.searchParams.delete('sortBy');
      } else {
        url.searchParams.delete('sort');
        url.searchParams.delete('sortBy');
      }

      if (openId) {
        url.searchParams.set('open', openId);
        url.searchParams.delete('sel');
      } else {
        url.searchParams.delete('open');
        url.searchParams.delete('sel');
      }

      const nextSearch = url.searchParams.toString();
      const currentSearch = window.location.search.replace(/^\?/, '');
      if (nextSearch !== currentSearch) {
        window.history.replaceState(
          null,
          '',
          url.pathname + (nextSearch ? `?${nextSearch}` : '') + url.hash
        );
      }
    },
    []
  );

  useEffect(() => {
    if (isInitialSyncRef.current) {
      isInitialSyncRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      syncToUrl(selectedSpec, selectedSpecies, searchQuery, sortBy, selectedService?.id ?? null);
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedSpec, selectedSpecies, searchQuery, sortBy, selectedService?.id, syncToUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('spec') || 'ALL';
      const sp = params.get('species') || 'ALL';
      const q = params.get('q') || params.get('search') || '';
      const sort = (params.get('sort') || params.get('sortBy') || 'default') as ServiceSortOption;
      const openId = params.get('open') || params.get('sel') || null;

      setSelectedSpec(s);
      setSelectedSpecies(sp);
      setSearchQuery(q);
      setSortBy(sort);
      if (!openId) {
        setSelectedService(null);
      } else {
        setSelectedService(
          (prev) => (prev?.id === openId ? prev : services.find((item) => item.id === openId) ?? null)
        );
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [services]);

  const resetFilters = useCallback(() => {
    setSelectedSpec('ALL');
    setSelectedSpecies('ALL');
    setSearchQuery('');
    setSortBy('default');
    syncToUrl('ALL', 'ALL', '', 'default', selectedService?.id ?? null);
  }, [selectedService?.id, syncToUrl]);

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = services.filter(
      (s) =>
        (selectedSpec === 'ALL' || s.specializationId === selectedSpec) &&
        (!q ||
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)))
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
    loadingSlots,
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
