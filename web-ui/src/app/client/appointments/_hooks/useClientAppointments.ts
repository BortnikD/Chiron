'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { clientApi } from '@/modules/client/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian, Species } from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import { useToast } from '@/shared/components';
import { formatApiError, toIdNameMap } from '@/shared/lib';
import { useResourceList } from '@/shared/hooks';
import {
  type AppointmentsFilterTab,
  toMoscowDayStartIso,
  toMoscowDayEndExclusiveIso,
} from '../_components/utils';
import { useAppointmentCancel } from './useAppointmentCancel';

export type FilterTab = AppointmentsFilterTab;
export type PageSizeOption = 10 | 20 | 50;

export interface ClientAppointmentsFiltersState {
  tab: AppointmentsFilterTab;
  selectedPetId: string;
  statusChips: AppointmentStatus[];
  fromDate: string;
  toDate: string;
  direction: 'ASC' | 'DESC';
}

export function useClientAppointments(initialSelectedId?: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [pets, setPets] = useState<Pet[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [parentApptsMap, setParentApptsMap] = useState<Record<string, Appointment>>({});

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const didApplyInitialSelRef = useRef<string | null>(null);
  const refsReqIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resource = useResourceList<Appointment, ClientAppointmentsFiltersState>({
    fetcher: async ({ page, pageSize, filters }, signal) => {
      let fromIso: string | undefined;
      let toIso: string | undefined;

      if (filters.fromDate) {
        fromIso = toMoscowDayStartIso(filters.fromDate);
      }
      if (filters.toDate) {
        toIso = toMoscowDayEndExclusiveIso(filters.toDate);
      }

      if (filters.tab === 'UPCOMING') {
        const nowIso = new Date().toISOString();
        if (!fromIso || fromIso < nowIso) fromIso = nowIso;
      } else if (filters.tab === 'HISTORY') {
        const nowIso = new Date().toISOString();
        if (!toIso || toIso > nowIso) toIso = nowIso;
      }

      return clientApi.getAppointments({
        petId: filters.selectedPetId === 'ALL' ? undefined : filters.selectedPetId,
        status: filters.statusChips.length > 0 ? filters.statusChips : undefined,
        from: fromIso,
        to: toIso,
        direction: filters.direction,
        page,
        size: pageSize,
      });
    },
    initialFilters: {
      tab: initialSelectedId ? 'ALL' : 'UPCOMING',
      selectedPetId: 'ALL',
      statusChips: [],
      fromDate: '',
      toDate: '',
      direction: initialSelectedId ? 'DESC' : 'ASC',
    },
    urlSyncKeys: ['tab', 'selectedPetId', 'statusChips', 'fromDate', 'toDate'],
    defaultPageSize: 10,
    onSuccess: async ({ items }) => {
      const followUpParents = items.filter((a) => a.followUpOf);
      if (followUpParents.length > 0) {
        const missingParentIds = followUpParents
          .map((a) => a.followUpOf as string)
          .filter((id) => !parentApptsMap[id]);

        if (missingParentIds.length > 0) {
          try {
            const fetched = await Promise.all(
              missingParentIds.map((id) => clientApi.getAppointmentById(id).catch(() => null))
            );
            const valid = fetched.filter((a): a is Appointment => a !== null);
            if (valid.length > 0) {
              setParentApptsMap((prev) => {
                const next = { ...prev };
                for (const a of valid) next[a.id] = a;
                return next;
              });
            }
          } catch {
            // ignore
          }
        }
      }

      if (initialSelectedId && didApplyInitialSelRef.current !== initialSelectedId) {
        didApplyInitialSelRef.current = initialSelectedId;
        const target = items.find((a) => a.id === initialSelectedId);
        if (target) {
          setSelectedAppt(target);
        } else {
          clientApi
            .getAppointmentById(initialSelectedId)
            .then((res) => {
              if (res) setSelectedAppt(res);
            })
            .catch(() => {});
        }
      } else {
        setSelectedAppt((prev) => (prev ? items.find((a) => a.id === prev.id) || prev : null));
      }
    },
  });

  const loadRefs = useCallback(async () => {
    const reqId = ++refsReqIdRef.current;
    try {
      const [petsData, servicesData, vetsData, speciesData] = await Promise.all([
        clientApi.getPets().catch(() => [] as Pet[]),
        clinicApi.getServices().catch(() => [] as Service[]),
        clinicApi.getVeterinarians().catch(() => [] as Veterinarian[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);
      if (!isMountedRef.current || reqId !== refsReqIdRef.current) return;
      setPets(Array.isArray(petsData) ? petsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setVeterinarians(Array.isArray(vetsData) ? vetsData : []);
      setSpeciesList(Array.isArray(speciesData) ? speciesData : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadRefs();
    return () => {
      refsReqIdRef.current += 1;
    };
  }, [loadRefs]);

  const setTab = useCallback(
    (nextTab: AppointmentsFilterTab) => {
      resource.setFilters((prev) => ({
        ...prev,
        tab: nextTab,
        direction: nextTab === 'UPCOMING' ? 'ASC' : 'DESC',
      }));
    },
    [resource]
  );

  const setSelectedPetId = useCallback(
    (nextPetId: string) => {
      resource.setFilter('selectedPetId', nextPetId);
    },
    [resource]
  );

  const toggleStatusChip = useCallback(
    (status: AppointmentStatus) => {
      resource.setFilter(
        'statusChips',
        resource.filters.statusChips.includes(status)
          ? resource.filters.statusChips.filter((x) => x !== status)
          : [...resource.filters.statusChips, status]
      );
    },
    [resource]
  );

  const setFromDate = useCallback(
    (iso: string) => {
      resource.setFilter('fromDate', iso);
    },
    [resource]
  );

  const setToDate = useCallback(
    (iso: string) => {
      resource.setFilter('toDate', iso);
    },
    [resource]
  );

  const setSize = useCallback(
    (nextSize: PageSizeOption) => {
      resource.setPageSize(nextSize);
    },
    [resource]
  );

  const toggleDirection = useCallback(() => {
    resource.setFilter(
      'direction',
      resource.filters.direction === 'ASC' ? 'DESC' : 'ASC'
    );
  }, [resource]);

  const selectAppointmentById = useCallback(
    async (id: string | null) => {
      if (!id) {
        setSelectedAppt(null);
        return;
      }
      const existing = resource.items.find((a) => a.id === id);
      if (existing) {
        setSelectedAppt(existing);
        return;
      }
      try {
        const fetched = await clientApi.getAppointmentById(id);
        if (fetched) setSelectedAppt(fetched);
      } catch (err: unknown) {
        toast('Не удалось открыть запись', formatApiError(err, 'Ошибка'));
      }
    },
    [resource.items, toast]
  );

  const petsMap = useMemo(() => Object.fromEntries(pets.map((p) => [p.id, p])), [pets]);
  const servicesMap = useMemo(() => Object.fromEntries(services.map((s) => [s.id, s])), [services]);
  const vetsMap = useMemo(() => Object.fromEntries(veterinarians.map((v) => [v.id, v])), [veterinarians]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const cancelModal = useAppointmentCancel({
    selectedAppt,
    setSelectedAppt,
    loadAppointments: resource.reload,
    isMountedRef,
  });

  return {
    loading: resource.loading,
    error: resource.error,
    reload: resource.reload,
    currentUserId: user?.id,
    pets,
    petsMap,
    servicesMap,
    vetsMap,
    speciesMap,
    parentApptsMap,
    tab: resource.filters.tab,
    setTab,
    selectedPetId: resource.filters.selectedPetId,
    setSelectedPetId,
    statusChips: resource.filters.statusChips,
    toggleStatusChip,
    fromDate: resource.filters.fromDate,
    setFromDate,
    toDate: resource.filters.toDate,
    setToDate,
    direction: resource.filters.direction,
    toggleDirection,
    resetFilters: resource.resetFilters,
    page: resource.page,
    setPage: resource.setPage,
    size: resource.pageSize as PageSizeOption,
    setSize,
    totalElements: resource.totalElements,
    totalPages: resource.totalPages,
    selectedAppt,
    setSelectedAppt,
    selectAppointmentById,
    filteredAppointments: resource.items,
    paginationProps: resource.paginationProps,
    ...cancelModal,
  };
}
