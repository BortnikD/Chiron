'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { vetApi } from '@/modules/vet/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Appointment, Pet } from '@/modules/client/types';
import type {
  ScheduleException,
  Service,
  Specialization,
  Species,
  Veterinarian,
  WorkSchedule,
} from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import { useShellHeader } from '@/components/layout/AppShell';
import { formatSlotTime, toIdNameMap } from '@/shared/lib';
import { useResourceList } from '@/shared/hooks';
import { getPetName } from '../../dashboard/_components/utils';
import { getMoscowNowTime } from '../../dashboard/_components/vetHelpers';
import { useVetAppointmentActions } from './useVetAppointmentActions';
import {
  AppointmentsTab,
  AppointmentsViewMode,
  CalendarMode,
  fetchVetAppointmentsForView,
  getCalendarDaysRange,
} from './vetAppointmentsQuery';

export type { AppointmentsTab, AppointmentsViewMode, CalendarMode };

export interface VetAppointmentsFiltersState {
  viewMode: AppointmentsViewMode;
  tab: AppointmentsTab;
  petFilter: string;
  statusFilter: AppointmentStatus[];
  dateFrom: string;
  dateTo: string;
  calMode: CalendarMode;
  calOffset: number;
}

export function useVetAppointments(options?: {
  initialSelId?: string | null;
  initialPetId?: string | null;
}) {
  const initialSelId = options?.initialSelId ?? null;
  const initialPetId = options?.initialPetId ?? null;

  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [patients, setPatients] = useState<Pet[]>([]);
  const [petsMap, setPetsMap] = useState<Record<string, Pet>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [vetProfile, setVetProfile] = useState<Veterinarian | null>(null);

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [nowTime, setNowTime] = useState(() => getMoscowNowTime());

  const isMountedRef = useRef(true);
  const appliedSelRef = useRef<string | null>(null);
  const petsMapRef = useRef<Record<string, Pet>>({});
  petsMapRef.current = petsMap;
  const vetProfileRef = useRef<Veterinarian | null>(null);
  vetProfileRef.current = vetProfile;

  useEffect(() => {
    isMountedRef.current = true;
    const ticker = window.setInterval(() => setNowTime(getMoscowNowTime()), 30000);
    return () => {
      isMountedRef.current = false;
      window.clearInterval(ticker);
    };
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const [svc, sp, specs, profile] = await Promise.all([
        clinicApi.getServices().catch(() => [] as Service[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
        clinicApi.getSpecializations().catch(() => [] as Specialization[]),
        vetApi.getProfile().catch(() => null),
      ]);
      if (!isMountedRef.current) return;
      setServices(Array.isArray(svc) ? svc : []);
      setSpeciesList(Array.isArray(sp) ? sp : []);
      setSpecializations(Array.isArray(specs) ? specs : []);
      setVetProfile(profile);

      if (profile?.id) {
        const ws = await clinicApi.getWorkSchedules(profile.id).catch(() => [] as WorkSchedule[]);
        if (isMountedRef.current) {
          setWorkSchedules(Array.isArray(ws) ? ws : []);
        }
      }

      const pts = await vetApi.getPatients().catch(() => [] as Pet[]);
      if (!isMountedRef.current) return;
      const safePts = Array.isArray(pts)
        ? pts.slice().sort((a, b) => a.name.localeCompare(b.name, 'ru'))
        : [];
      setPatients(safePts);
      const map: Record<string, Pet> = {};
      safePts.forEach((p) => {
        map[p.id] = p;
      });
      setPetsMap((prev) => ({ ...prev, ...map }));
    } catch {
      // Фоновые справочники загружаются независимо
    }
  }, []);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  const resource = useResourceList<Appointment, VetAppointmentsFiltersState>({
    fetcher: async ({ page, pageSize, filters }) => {
      const calDayIsos = getCalendarDaysRange(filters.calMode, filters.calOffset);
      const result = await fetchVetAppointmentsForView({
        viewMode: filters.viewMode,
        calDayIsos,
        vetProfileId: vetProfileRef.current?.id,
        tab: filters.tab,
        petFilter: filters.petFilter,
        statusFilter: filters.statusFilter,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        page,
        size: pageSize,
      });

      if (result.exceptions) {
        setExceptions(result.exceptions);
      }

      return {
        items: result.items,
        totalElements: result.totalElements,
        totalPages: result.totalPages,
      };
    },
    defaultPageSize: 10,
    initialFilters: {
      viewMode: 'table',
      tab: initialPetId ? 'all' : 'upcoming',
      petFilter: initialPetId || '',
      statusFilter: [],
      dateFrom: '',
      dateTo: '',
      calMode: 'week',
      calOffset: 0,
    },
    urlSyncKeys: ['viewMode', 'tab', 'petFilter', 'statusFilter', 'dateFrom', 'dateTo', 'calMode'],
    onSuccess: ({ items }) => {
      if (!isMountedRef.current) return;
      setSelectedAppt((prev) =>
        prev ? items.find((x) => x.id === prev.id) ?? prev : null
      );
      const missing = items
        .map((x) => x.petId)
        .filter((id) => id && !petsMapRef.current[id]);
      if (missing.length > 0) {
        vetApi
          .getPatientPetsByIds(missing, petsMapRef.current)
          .then((resolved) => {
            if (isMountedRef.current && Object.keys(resolved).length > 0) {
              setPetsMap((prev) => ({ ...prev, ...resolved }));
            }
          })
          .catch(() => {});
      }
    },
  });

  const calDayIsos = useMemo(
    () => getCalendarDaysRange(resource.filters.calMode, resource.filters.calOffset),
    [resource.filters.calMode, resource.filters.calOffset]
  );

  useEffect(() => {
    const onRefresh = () => void resource.reload();
    window.addEventListener('chiron:notification-received', onRefresh);
    window.addEventListener('chiron:vet-appointments-updated', onRefresh);
    return () => {
      window.removeEventListener('chiron:notification-received', onRefresh);
      window.removeEventListener('chiron:vet-appointments-updated', onRefresh);
    };
  }, [resource]);

  useEffect(() => {
    if (!initialSelId || resource.loading || appliedSelRef.current === initialSelId) return;
    appliedSelRef.current = initialSelId;
    const found = resource.items.find((a) => a.id === initialSelId);
    if (found) {
      setSelectedAppt(found);
      return;
    }
    let cancelled = false;
    vetApi
      .getAppointmentById(initialSelId)
      .then(async (appt) => {
        if (cancelled || !isMountedRef.current) return;
        if (!petsMap[appt.petId]) {
          const pet = await vetApi.getPatientPet(appt.petId).catch(() => null);
          if (!cancelled && pet && isMountedRef.current) {
            setPetsMap((prev) => ({ ...prev, [pet.id]: pet }));
          }
        }
        setSelectedAppt(appt);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialSelId, resource.loading, resource.items, petsMap]);

  const reloadWrapper = useCallback(
    async () => (await resource.reload()) ?? [],
    [resource]
  );

  const actions = useVetAppointmentActions({
    reloadAppointments: reloadWrapper,
    setSelectedAppt,
    petsMap,
    isMountedRef,
  });

  const servicesMap = useMemo(() => toIdNameMap(services), [services]);
  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  useShellHeader({
    crumbGroup: 'Врач',
    crumb: 'Мои записи',
    crumb2: selectedAppt
      ? `${getPetName(selectedAppt, petsMap)}, ${formatSlotTime(selectedAppt.startAt)}`
      : undefined,
  });

  return {
    viewMode: resource.filters.viewMode,
    setViewMode: useCallback(
      (m: AppointmentsViewMode) => resource.setFilter('viewMode', m),
      [resource]
    ),
    tab: resource.filters.tab,
    setTab: useCallback(
      (t: AppointmentsTab) => resource.setFilter('tab', t),
      [resource]
    ),
    petFilter: resource.filters.petFilter,
    setPetFilter: useCallback(
      (id: string) => resource.setFilter('petFilter', id),
      [resource]
    ),
    statusFilter: resource.filters.statusFilter,
    toggleStatus: useCallback(
      (s: AppointmentStatus) => {
        resource.setFilter(
          'statusFilter',
          resource.filters.statusFilter.includes(s)
            ? resource.filters.statusFilter.filter((x) => x !== s)
            : [...resource.filters.statusFilter, s]
        );
      },
      [resource]
    ),
    removeStatus: useCallback(
      (s: AppointmentStatus) => {
        resource.setFilter(
          'statusFilter',
          resource.filters.statusFilter.filter((x) => x !== s)
        );
      },
      [resource]
    ),
    dateFrom: resource.filters.dateFrom,
    setDateFrom: useCallback(
      (v: string) => resource.setFilter('dateFrom', v),
      [resource]
    ),
    dateTo: resource.filters.dateTo,
    setDateTo: useCallback(
      (v: string) => resource.setFilter('dateTo', v),
      [resource]
    ),
    page: resource.page,
    setPage: resource.setPage,
    size: resource.pageSize,
    setSize: resource.setPageSize,
    calMode: resource.filters.calMode,
    setCalMode: useCallback(
      (m: CalendarMode) => {
        resource.setFilters((prev) => ({ ...prev, calMode: m, calOffset: 0 }));
      },
      [resource]
    ),
    calOffset: resource.filters.calOffset,
    calDayIsos,
    calPrev: useCallback(
      () => resource.setFilter('calOffset', resource.filters.calOffset - 1),
      [resource]
    ),
    calNext: useCallback(
      () => resource.setFilter('calOffset', resource.filters.calOffset + 1),
      [resource]
    ),
    calToday: useCallback(
      () => resource.setFilter('calOffset', 0),
      [resource]
    ),
    resetFilters: resource.resetFilters,
    appointments: resource.items,
    totalElements: resource.totalElements,
    totalPages: resource.totalPages,
    exceptions,
    workSchedules,
    patients,
    petsMap,
    services,
    servicesMap,
    specsMap,
    speciesMap,
    vetProfile,
    nowTime,
    loading: resource.loading,
    error: resource.error,
    reload: resource.reload,
    selectedAppt,
    setSelectedAppt,
    paginationProps: resource.paginationProps,
    ...actions,
  };
}
