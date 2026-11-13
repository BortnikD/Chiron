import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { clinicApi } from '@/modules/clinic/api';
import { vetApi } from '@/modules/vet/api';
import type {
  ScheduleException,
  Service,
  Specialization,
  Species,
  Veterinarian,
  WorkSchedule,
} from '@/modules/clinic/types';
import type { Appointment, Pet } from '@/modules/client/types';
import { useShellHeader } from '@/components/layout/AppShell';
import {
  formatApiError,
  formatIsoDateDisplay,
  formatSlotTime,
  getMoscowTodayIso,
  toIdNameMap,
} from '@/shared/lib';
import { getPetName } from '../../dashboard/_components/utils';
import {
  getMoscowNowTime,
  moscowNextDayInstant,
  moscowStartInstant,
  shiftIsoDate,
} from '../../dashboard/_components/vetHelpers';
import { useVetAppointmentActions } from '../../appointments/_hooks/useVetAppointmentActions';

function getWeekBounds(weekOffset: number): { weekStartIso: string; weekEndIso: string } {
  const todayIso = getMoscowTodayIso();
  const [y, m, d] = todayIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dow = (dt.getUTCDay() + 6) % 7;
  const weekStartIso = shiftIsoDate(todayIso, -dow + weekOffset * 7);
  const weekEndIso = shiftIsoDate(weekStartIso, 6);
  return { weekStartIso, weekEndIso };
}

export function useVetSchedule(options?: { initialSelId?: string | null }) {
  const initialSelId = options?.initialSelId ?? null;
  const { user } = useAuth();

  const [vetProfile, setVetProfile] = useState<Veterinarian | null>(null);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [petsMap, setPetsMap] = useState<Record<string, Pet>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [nowTime, setNowTime] = useState(() => getMoscowNowTime());

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedException, setSelectedException] = useState<ScheduleException | null>(null);

  const isMountedRef = useRef(true);
  const loadSeqRef = useRef(0);
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

  const { weekStartIso, weekEndIso } = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);

  const loadScheduleData = useCallback(
    async (silent = false): Promise<Appointment[]> => {
      const seq = ++loadSeqRef.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const todayIso = getMoscowTodayIso();
        const plus60Iso = shiftIsoDate(todayIso, 60);
        const excFrom = weekStartIso < todayIso ? weekStartIso : todayIso;
        const excTo = weekEndIso > plus60Iso ? weekEndIso : plus60Iso;

        const [profileRes, svcRes, specsRes, spRes, apptsRes] = await Promise.all([
          vetApi.getProfile().catch(() => null),
          clinicApi.getServices().catch(() => [] as Service[]),
          clinicApi.getSpecializations().catch(() => [] as Specialization[]),
          clinicApi.getSpecies().catch(() => [] as Species[]),
          vetApi.getAppointments({
            page: 0,
            size: 100,
            from: moscowStartInstant(weekStartIso),
            to: moscowNextDayInstant(weekEndIso),
          }),
        ]);

        if (!isMountedRef.current || seq !== loadSeqRef.current) return [];

        const items = Array.isArray(apptsRes?.items) ? apptsRes.items : [];

        setServices(Array.isArray(svcRes) ? svcRes : []);
        setSpecializations(Array.isArray(specsRes) ? specsRes : []);
        setSpeciesList(Array.isArray(spRes) ? spRes : []);
        setAppointments(items);

        let myVet = profileRes;
        if (!myVet) {
          const vetsRes = await clinicApi.getVeterinarians().catch(() => [] as Veterinarian[]);
          if (!isMountedRef.current || seq !== loadSeqRef.current) return items;
          const vetList = Array.isArray(vetsRes) ? vetsRes : [];
          myVet = vetList.find((v) => v.userId === user?.id) || vetList[0] || null;
        }

        setVetProfile(myVet);

        const [schedRes, excRes, resolvedPets] = await Promise.all([
          myVet?.id ? clinicApi.getWorkSchedules(myVet.id).catch(() => [] as WorkSchedule[]) : Promise.resolve([] as WorkSchedule[]),
          myVet?.id ? clinicApi.getScheduleExceptions(myVet.id, excFrom, excTo).catch(() => [] as ScheduleException[]) : Promise.resolve([] as ScheduleException[]),
          vetApi.getPatientPetsByIds(items.map((a) => a.petId), petsMapRef.current).catch(() => ({} as Record<string, Pet>)),
        ]);
        if (!isMountedRef.current || seq !== loadSeqRef.current) return items;
        setSchedules(Array.isArray(schedRes) ? schedRes : []);
        setExceptions(Array.isArray(excRes) ? excRes : []);
        setPetsMap((prev) => ({ ...prev, ...resolvedPets }));

        setSelectedAppt((prev) => (prev ? items.find((a) => a.id === prev.id) ?? prev : null));
        setError(null);
        return items;
      } catch (err: unknown) {
        if (!isMountedRef.current || seq !== loadSeqRef.current) return [];
        if (!silent) {
          setError(formatApiError(err, 'Не удалось загрузить расписание врача'));
        }
        return [];
      } finally {
        if (isMountedRef.current && seq === loadSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [user?.id, weekStartIso, weekEndIso]
  );

  useEffect(() => {
    void loadScheduleData();
  }, [loadScheduleData]);

  useEffect(() => {
    const onRefresh = () => void loadScheduleData(true);
    window.addEventListener('chiron:notification-received', onRefresh);
    window.addEventListener('chiron:vet-appointments-updated', onRefresh);
    return () => {
      window.removeEventListener('chiron:notification-received', onRefresh);
      window.removeEventListener('chiron:vet-appointments-updated', onRefresh);
    };
  }, [loadScheduleData]);

  useEffect(() => {
    if (!initialSelId || loading || appliedSelRef.current === initialSelId) return;
    appliedSelRef.current = initialSelId;
    const found = appointments.find((a) => a.id === initialSelId);
    if (found) {
      setSelectedAppt(found);
      setSelectedException(null);
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
        setSelectedException(null);
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
    crumb: 'Мой график',
    crumb2: selectedAppt
      ? `${getPetName(selectedAppt, petsMap)}, ${formatSlotTime(selectedAppt.startAt)}`
      : selectedException
        ? selectedException.startDate === selectedException.endDate
          ? formatIsoDateDisplay(selectedException.startDate)
          : `${formatIsoDateDisplay(selectedException.startDate)} – ${formatIsoDateDisplay(selectedException.endDate)}`
        : undefined,
  });

  const actions = useVetAppointmentActions({
    reloadAppointments: loadScheduleData,
    setSelectedAppt,
    petsMap,
    isMountedRef,
  });

  const handleSelectAppt = useCallback((appt: Appointment) => {
    setSelectedAppt(appt);
    setSelectedException(null);
  }, []);

  const handleSelectException = useCallback((exc: ScheduleException) => {
    setSelectedException(exc);
    setSelectedAppt(null);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedAppt(null);
    setSelectedException(null);
  }, []);

  return {
    vetProfile,
    schedules,
    exceptions,
    appointments,
    services,
    servicesMap,
    specsMap,
    speciesMap,
    petsMap,
    nowTime,
    loading,
    error,
    clearError: () => setError(null),
    reload: loadScheduleData,
    weekOffset,
    goPrevWeek: () => setWeekOffset((prev) => prev - 1),
    goNextWeek: () => setWeekOffset((prev) => prev + 1),
    goCurrentWeek: () => setWeekOffset(0),
    selectedAppt,
    selectedException,
    handleSelectAppt,
    handleSelectException,
    handleCloseDetail,
    ...actions,
  };
}
