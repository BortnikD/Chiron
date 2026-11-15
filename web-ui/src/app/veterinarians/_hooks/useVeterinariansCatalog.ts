'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clinicApi } from '@/modules/clinic/api';
import type {
  ScheduleException,
  Service,
  Specialization,
  Species,
  Veterinarian,
  WorkSchedule,
} from '@/modules/clinic/types';
import {
  SPEC_TONES,
  formatApiError,
  getMoscowTodayIso,
  getSpeciesTone,
  toIdNameMap,
} from '@/shared/lib';
import { SPECIALIZATION_NAMES_RU, getDoctorDisplay } from '@/shared/lib';

export function useVeterinariansCatalog(
  specParam: string | null = null,
  openParam: string | null = null,
  speciesParam: string | null = null,
  searchParam: string | null = null
) {
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vetPermissions, setVetPermissions] = useState<Record<string, string[]>>({});
  const [selectedSpec, setSelectedSpec] = useState<string>(specParam || 'ALL');
  const [selectedSpecies, setSelectedSpecies] = useState<string>(speciesParam || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>(searchParam || '');
  const [selectedVet, setSelectedVet] = useState<Veterinarian | null>(null);
  const [vetSchedules, setVetSchedules] = useState<WorkSchedule[]>([]);
  const [vetExceptions, setVetExceptions] = useState<ScheduleException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const appliedSpecRef = useRef<string | null>(null);
  const appliedOpenRef = useRef<string | null>(null);
  const appliedSpeciesRef = useRef<string | null>(null);
  const isInitialSyncRef = useRef(true);

  const reload = useCallback(() => {
    setReloadTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      clinicApi.getVeterinarians(),
      clinicApi.getSpecializations(),
      clinicApi.getSpecies(),
      clinicApi.getServices().catch(() => [] as Service[]),
    ])
      .then(async ([vetsData, specData, spList, svcData]) => {
        if (cancelled) return;
        const safeVets = (Array.isArray(vetsData) ? vetsData : []).filter(
          (v) => v.isActive !== false
        );
        const safeSpec = Array.isArray(specData) ? specData : [];

        setVets(safeVets);
        setSpecializations(safeSpec);
        setSpeciesList(Array.isArray(spList) ? spList : []);
        setServices(Array.isArray(svcData) ? svcData : []);
        setSelectedVet((prev) =>
          prev ? safeVets.find((item) => item.id === prev.id) ?? null : null
        );

        const permMap: Record<string, string[]> = {};
        const missingPermVets: Veterinarian[] = [];
        safeVets.forEach((v) => {
          if (Array.isArray(v.speciesIds)) {
            permMap[v.id] = v.speciesIds;
          } else {
            missingPermVets.push(v);
          }
        });
        if (missingPermVets.length > 0) {
          const permsList = await Promise.all(
            missingPermVets.map((v) => clinicApi.getVetSpeciesPermissions(v.id).catch(() => []))
          );
          if (cancelled) return;
          missingPermVets.forEach((v, idx) => {
            const perms = permsList[idx];
            permMap[v.id] = Array.isArray(perms) ? perms.map((p) => p.speciesId) : [];
          });
        }
        setVetPermissions(permMap);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(formatApiError(err, 'Не удалось загрузить список врачей'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

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
    if (vets.length === 0 || appliedOpenRef.current === openParam) return;
    const found = vets.find((v) => v.id === openParam);
    if (found) {
      appliedOpenRef.current = openParam;
      setSelectedVet(found);
    }
  }, [openParam, vets]);

  const selectedVetId = selectedVet?.id ?? null;

  useEffect(() => {
    if (!selectedVetId) {
      setVetSchedules([]);
      setVetExceptions([]);
      return;
    }

    let cancelled = false;
    const today = getMoscowTodayIso(0);
    const in60Days = getMoscowTodayIso(60);

    Promise.all([
      clinicApi.getWorkSchedules(selectedVetId),
      clinicApi.getScheduleExceptions(selectedVetId, today, in60Days),
    ])
      .then(([schedRes, excRes]) => {
        if (cancelled) return;
        setVetSchedules(Array.isArray(schedRes) ? schedRes : []);
        const upcoming = (Array.isArray(excRes) ? excRes : [])
          .filter((exc) => {
            const end = exc.endDate || exc.startDate;
            return end >= today && exc.startDate <= in60Days;
          })
          .sort((a, b) => a.startDate.localeCompare(b.startDate));
        setVetExceptions(upcoming);
      })
      .catch(() => {
        if (cancelled) return;
        setVetSchedules([]);
        setVetExceptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVetId]);

  const specsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const sp of specializations) {
      map[sp.id] = SPECIALIZATION_NAMES_RU[sp.name] || SPECIALIZATION_NAMES_RU[sp.id] || sp.name;
    }
    return map;
  }, [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);
  const hasFilters = selectedSpec !== 'ALL' || selectedSpecies !== 'ALL' || searchQuery.trim() !== '';

  const syncToUrl = useCallback(
    (spec: string, species: string, q: string, openId: string | null) => {
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
      syncToUrl(selectedSpec, selectedSpecies, searchQuery, selectedVet?.id ?? null);
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedSpec, selectedSpecies, searchQuery, selectedVet?.id, syncToUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('spec') || 'ALL';
      const sp = params.get('species') || 'ALL';
      const q = params.get('q') || params.get('search') || '';
      const openId = params.get('open') || params.get('sel') || null;

      setSelectedSpec(s);
      setSelectedSpecies(sp);
      setSearchQuery(q);
      if (!openId) {
        setSelectedVet(null);
      } else {
        setSelectedVet(
          (prev) => (prev?.id === openId ? prev : vets.find((item) => item.id === openId) ?? null)
        );
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [vets]);

  const resetFilters = useCallback(() => {
    setSelectedSpec('ALL');
    setSelectedSpecies('ALL');
    setSearchQuery('');
    syncToUrl('ALL', 'ALL', '', selectedVet?.id ?? null);
  }, [selectedVet?.id, syncToUrl]);

  const filteredVets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vets.filter((v) => {
      if (selectedSpec !== 'ALL' && v.specializationId !== selectedSpec) return false;
      if (
        selectedSpecies !== 'ALL' &&
        (!vetPermissions[v.id] || !vetPermissions[v.id].includes(selectedSpecies))
      ) {
        return false;
      }
      if (!q) return true;
      const { name, fullName, specName } = getDoctorDisplay(v, specsMap);
      return (
        name.toLowerCase().includes(q) ||
        fullName.toLowerCase().includes(q) ||
        specName.toLowerCase().includes(q) ||
        Boolean(v.bio && v.bio.toLowerCase().includes(q))
      );
    });
  }, [vets, selectedSpec, selectedSpecies, searchQuery, vetPermissions, specsMap]);

  return {
    specializations,
    speciesList,
    services,
    vetPermissions,
    selectedSpec,
    setSelectedSpec,
    selectedSpecies,
    setSelectedSpecies,
    searchQuery,
    setSearchQuery,
    selectedVet,
    setSelectedVet,
    vetSchedules,
    vetExceptions,
    loading,
    error,
    reload,
    specsMap,
    speciesMap,
    hasFilters,
    resetFilters,
    filteredVets,
  };
}
