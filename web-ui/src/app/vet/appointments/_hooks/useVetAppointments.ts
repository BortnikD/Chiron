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
import { formatApiError, formatSlotTime, toIdNameMap } from '@/shared/lib';
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

export function useVetAppointments(options?: {
  initialSelId?: string | null;
  initialPetId?: string | null;
}) {
  const initialSelId = options?.initialSelId ?? null;
  const initialPetId = options?.initialPetId ?? null;

  const [viewMode, setViewMode] = useState<AppointmentsViewMode>('table');
  const [tab, setTab] = useState<AppointmentsTab>(initialPetId ? 'all' : 'upcoming');
  const [petFilter, setPetFilter] = useState<string>(initialPetId || '');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [calMode, setCalMode] = useState<CalendarMode>('week');
  const [calOffset, setCalOffset] = useState<number>(0);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [patients, setPatients] = useState<Pet[]>([]);
  const [petsMap, setPetsMap] = useState<Record<string, Pet>>({});
  const [services, setServices] = useState<Service[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [vetProfile, setVetProfile] = useState<Veterinarian | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [nowTime, setNowTime] = useState(() => getMoscowNowTime());

  const isMountedRef = useRef(true);
  const listSeqRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);
  const petsMapRef = useRef<Record<string, Pet>>({});
  petsMapRef.current = petsMap;

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

  const calDayIsos = useMemo(() => getCalendarDaysRange(calMode, calOffset), [calMode, calOffset]);

  const loadAppointments = useCallback(
    async (silent = false): Promise<Appointment[]> => {
      const seq = ++listSeqRef.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await fetchVetAppointmentsForView({
          viewMode,
          calDayIsos,
          vetProfileId: vetProfile?.id,
          tab,
          petFilter,
          statusFilter,
          dateFrom,
          dateTo,
          page,
          size,
        });
        if (!isMountedRef.current || seq !== listSeqRef.current) return [];

        const resolvedPets = await vetApi
          .getPatientPetsByIds(result.items.map((x) => x.petId), petsMapRef.current)
          .catch(() => ({} as Record<string, Pet>));
        if (!isMountedRef.current || seq !== listSeqRef.current) return [];
        if (Object.keys(resolvedPets).length > 0) {
          setPetsMap((prev) => ({ ...prev, ...resolvedPets }));
        }

        setAppointments(result.items);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
        if (result.exceptions) setExceptions(result.exceptions);
        setError(null);

        setSelectedAppt((prev) =>
          prev ? result.items.find((x) => x.id === prev.id) ?? prev : null
        );
        return result.items;
      } catch (err: unknown) {
        if (!isMountedRef.current || seq !== listSeqRef.current) return [];
        if (!silent) {
          setError(formatApiError(err, 'Не удалось загрузить записи'));
        }
        return [];
      } finally {
        if (isMountedRef.current && seq === listSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [viewMode, tab, petFilter, statusFilter, dateFrom, dateTo, page, size, calDayIsos, vetProfile?.id]
  );

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    const onRefresh = () => void loadAppointments(true);
    window.addEventListener('chiron:notification-received', onRefresh);
    window.addEventListener('chiron:vet-appointments-updated', onRefresh);
    return () => {
      window.removeEventListener('chiron:notification-received', onRefresh);
      window.removeEventListener('chiron:vet-appointments-updated', onRefresh);
    };
  }, [loadAppointments]);

  useEffect(() => {
    if (!initialSelId || loading || appliedSelRef.current === initialSelId) return;
    appliedSelRef.current = initialSelId;
    const found = appointments.find((a) => a.id === initialSelId);
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
  }, [initialSelId, loading, appointments, petsMap]);

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

  const actions = useVetAppointmentActions({
    reloadAppointments: loadAppointments,
    setSelectedAppt,
    petsMap,
    isMountedRef,
  });

  const resetFilters = useCallback(() => {
    setPetFilter('');
    setStatusFilter([]);
    setDateFrom('');
    setDateTo('');
    setTab('all');
    setPage(0);
  }, []);

  return {
    viewMode,
    setViewMode: (m: AppointmentsViewMode) => {
      setViewMode(m);
      setPage(0);
    },
    tab,
    setTab: (t: AppointmentsTab) => {
      setTab(t);
      setPage(0);
    },
    petFilter,
    setPetFilter: (id: string) => {
      setPetFilter(id);
      setPage(0);
    },
    statusFilter,
    toggleStatus: (s: AppointmentStatus) => {
      setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
      setPage(0);
    },
    removeStatus: (s: AppointmentStatus) => {
      setStatusFilter((prev) => prev.filter((x) => x !== s));
      setPage(0);
    },
    dateFrom,
    setDateFrom: (v: string) => {
      setDateFrom(v);
      setPage(0);
    },
    dateTo,
    setDateTo: (v: string) => {
      setDateTo(v);
      setPage(0);
    },
    page,
    setPage,
    size,
    setSize: (s: number) => {
      setSize(s);
      setPage(0);
    },
    calMode,
    setCalMode: (m: CalendarMode) => {
      setCalMode(m);
      setCalOffset(0);
    },
    calOffset,
    calDayIsos,
    calPrev: () => setCalOffset((c) => c - 1),
    calNext: () => setCalOffset((c) => c + 1),
    calToday: () => setCalOffset(0),
    resetFilters,
    appointments,
    totalElements,
    totalPages,
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
    loading,
    error,
    reload: loadAppointments,
    selectedAppt,
    setSelectedAppt,
    ...actions,
  };
}
