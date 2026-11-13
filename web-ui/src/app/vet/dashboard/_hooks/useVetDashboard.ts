import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { vetApi } from '@/modules/vet/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Appointment, Pet } from '@/modules/client/types';
import type {
  Service,
  Specialization,
  Species,
  Veterinarian,
  WorkSchedule,
} from '@/modules/clinic/types';
import { useShellHeader } from '@/components/layout/AppShell';
import {
  formatApiError,
  formatSlotTime,
  getMoscowDateKey,
  toIdNameMap,
} from '@/shared/lib';
import { getPetName } from '../_components/utils';
import {
  getMoscowNowTime,
  moscowNextDayInstant,
  moscowStartInstant,
} from '../_components/vetHelpers';
import { useVetAppointmentActions } from '../../appointments/_hooks/useVetAppointmentActions';

const INITIAL_PENDING_PETS_LIMIT = 8;

export function useVetDashboard(initialSelId?: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vetProfile, setVetProfile] = useState<Veterinarian | null>(null);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [petsMap, setPetsMap] = useState<Record<string, Pet>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [nowTime, setNowTime] = useState(() => getMoscowNowTime());

  const isMountedRef = useRef(true);
  const loadSeqRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);
  const petsMapRef = useRef<Record<string, Pet>>({});
  petsMapRef.current = petsMap;

  useEffect(() => {
    isMountedRef.current = true;
    const ticker = window.setInterval(() => {
      setNowTime(getMoscowNowTime());
    }, 30000);
    return () => {
      isMountedRef.current = false;
      window.clearInterval(ticker);
    };
  }, []);

  const loadAll = useCallback(async (silent = false): Promise<Appointment[]> => {
    const seq = ++loadSeqRef.current;
    const currentDay = getMoscowNowTime().dateIso;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const todayFrom = moscowStartInstant(currentDay);
      const todayTo = moscowNextDayInstant(currentDay);

      const [todayRes, pendingRes, svcRes, profileRes, specsRes, speciesRes] = await Promise.all([
        vetApi.getAppointments({ page: 0, size: 100, from: todayFrom, to: todayTo }),
        vetApi.getAppointments({
          page: 0,
          size: 50,
          status: 'PENDING',
          from: todayFrom,
          direction: 'ASC',
        }),
        clinicApi.getServices(),
        vetApi.getProfile().catch(() => null),
        clinicApi.getSpecializations().catch(() => [] as Specialization[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);

      if (!isMountedRef.current || seq !== loadSeqRef.current) return [];

      const todayItems = todayRes?.items ?? (Array.isArray(todayRes) ? todayRes : []);
      const pendingItems = pendingRes?.items ?? (Array.isArray(pendingRes) ? pendingRes : []);

      const mergedMap = new Map<string, Appointment>();
      for (const a of todayItems) mergedMap.set(a.id, a);
      for (const a of pendingItems) mergedMap.set(a.id, a);
      const items = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );

      // Загружаем карточки питомцев только для приёмов сегодняшнего дня и первых видимых в блоке «Ожидают подтверждения»
      const priorityPetIds = [
        ...todayItems.map((a) => a.petId),
        ...pendingItems.slice(0, INITIAL_PENDING_PETS_LIMIT).map((a) => a.petId),
      ];

      const [schedRes, resolvedPets] = await Promise.all([
        profileRes?.id
          ? clinicApi.getWorkSchedules(profileRes.id).catch(() => [] as WorkSchedule[])
          : Promise.resolve([] as WorkSchedule[]),
        vetApi
          .getPatientPetsByIds(priorityPetIds, petsMapRef.current)
          .catch(() => ({} as Record<string, Pet>)),
      ]);
      if (!isMountedRef.current || seq !== loadSeqRef.current) return [];

      setError(null);
      setAppointments(items);
      setServices(Array.isArray(svcRes) ? svcRes : []);
      setSpecializations(Array.isArray(specsRes) ? specsRes : []);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setVetProfile(profileRes);
      setWorkSchedules(Array.isArray(schedRes) ? schedRes : []);
      setPetsMap((prev) => ({ ...prev, ...resolvedPets }));

      setSelectedAppt((prev) => (prev ? items.find((a) => a.id === prev.id) ?? prev : null));
      return items;
    } catch (err: unknown) {
      if (!isMountedRef.current || seq !== loadSeqRef.current) return [];
      if (!silent) {
        setError(formatApiError(err, 'Не удалось загрузить данные смены'));
      }
      return [];
    } finally {
      if (isMountedRef.current && seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await loadAll();
    })();
    const handleRefresh = () => {
      if (!cancelled) void loadAll(true);
    };
    window.addEventListener('chiron:notification-received', handleRefresh);
    window.addEventListener('chiron:vet-appointments-updated', handleRefresh);
    return () => {
      cancelled = true;
      window.removeEventListener('chiron:notification-received', handleRefresh);
      window.removeEventListener('chiron:vet-appointments-updated', handleRefresh);
    };
  }, [loadAll]);

  useEffect(() => {
    if (!selectedAppt?.petId || petsMapRef.current[selectedAppt.petId]) return;
    let cancelled = false;
    vetApi
      .getPatientPet(selectedAppt.petId)
      .then((pet) => {
        if (!cancelled && pet && isMountedRef.current) {
          setPetsMap((prev) => ({ ...prev, [pet.id]: pet }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedAppt?.petId]);

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
        if (!petsMapRef.current[appt.petId]) {
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
  }, [initialSelId, loading, appointments]);

  const servicesMap = useMemo(() => toIdNameMap(services), [services]);
  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  useShellHeader({
    crumbGroup: 'Врач',
    crumb: 'Сегодня',
    crumb2: selectedAppt
      ? `${getPetName(selectedAppt, petsMap)}, ${formatSlotTime(selectedAppt.startAt)}`
      : undefined,
  });

  const todayAppts = useMemo(
    () => appointments.filter((a) => getMoscowDateKey(a.startAt) === nowTime.dateIso),
    [appointments, nowTime.dateIso]
  );

  const pendingAppts = useMemo(() => {
    const nowMs = Date.now();
    return appointments
      .filter((a) => a.status === 'PENDING' && new Date(a.endAt).getTime() > nowMs)
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [appointments]);

  const loadAllPendingPets = useCallback(() => {
    const restIds = pendingAppts
      .slice(INITIAL_PENDING_PETS_LIMIT)
      .map((a) => a.petId)
      .filter((id) => id && !petsMapRef.current[id]);
    if (restIds.length === 0) return;
    void vetApi
      .getPatientPetsByIds(restIds, petsMapRef.current)
      .then((resolved) => {
        if (isMountedRef.current && Object.keys(resolved).length > 0) {
          setPetsMap((prev) => ({ ...prev, ...resolved }));
        }
      })
      .catch(() => {});
  }, [pendingAppts]);

  const nextAppt = useMemo(() => {
    const nowMs = Date.now();
    return (
      todayAppts.find(
        (a) =>
          (a.status === 'CONFIRMED' || a.status === 'PENDING') &&
          new Date(a.endAt).getTime() > nowMs
      ) || null
    );
  }, [todayAppts]);

  const {
    handleUpdateStatus,
    handleSaveNotes,
    handleCreateFollowUp,
    handleCreateVaccination,
  } = useVetAppointmentActions({
    reloadAppointments: loadAll,
    setSelectedAppt,
    petsMap,
    isMountedRef,
    onStatusError: setStatusError,
  });

  return {
    appointments,
    services,
    servicesMap,
    specsMap,
    speciesMap,
    vetProfile,
    workSchedules,
    petsMap,
    loading,
    error,
    statusError,
    clearStatusError: () => setStatusError(null),
    selectedAppt,
    setSelectedAppt,
    nowTime,
    todayAppts,
    pendingAppts,
    loadAllPendingPets,
    nextAppt,
    reload: loadAll,
    handleUpdateStatus,
    handleSaveNotes,
    handleCreateFollowUp,
    handleCreateVaccination,
  };
}
