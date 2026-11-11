import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { vetApi } from '@/modules/vet/api';
import type { CreateFollowUpRequest } from '@/modules/vet/types';
import { clinicApi } from '@/modules/clinic/api';
import type { Appointment, CreateVaccinationRequest, Pet } from '@/modules/client/types';
import type {
  Service,
  Specialization,
  Species,
  Veterinarian,
  WorkSchedule,
} from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import { useShellHeader } from '@/components/layout/AppShell';
import { useToast } from '@/shared/components';
import {
  formatApiError,
  formatSlotTime,
  getMoscowDateKey,
  toIdNameMap,
} from '@/shared/lib';
import { getPetName } from '../_components/utils';
import { getMoscowNowTime, moscowStartInstant } from '../_components/vetHelpers';

const STATUS_TOASTS: Partial<Record<AppointmentStatus, [string, string]>> = {
  CONFIRMED: ['Запись подтверждена', 'Владелец получит уведомление «Запись подтверждена»'],
  COMPLETED: ['Приём завершён', 'Не забудьте заполнить заметки и прививки'],
  NO_SHOW: ['Отмечена неявка', 'Статус приёма обновлён'],
  CANCELLED: ['Запись отменена', 'Владелец получит уведомление с причиной'],
};

export function useVetDashboard(initialSelId?: string | null) {
  const { toast } = useToast();

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
      const [apptsRes, svcRes, profileRes, specsRes, speciesRes] = await Promise.all([
        vetApi.getAppointments({ page: 0, size: 100, from: moscowStartInstant(currentDay) }),
        clinicApi.getServices(),
        vetApi.getProfile().catch(() => null),
        clinicApi.getSpecializations().catch(() => [] as Specialization[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);

      if (!isMountedRef.current || seq !== loadSeqRef.current) return [];

      const items = apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []);
      items.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

      const [schedRes, resolvedPets] = await Promise.all([
        profileRes?.id ? clinicApi.getWorkSchedules(profileRes.id).catch(() => [] as WorkSchedule[]) : Promise.resolve([] as WorkSchedule[]),
        vetApi.getPatientPetsByIds(items.map((a) => a.petId), petsMapRef.current).catch(() => ({} as Record<string, Pet>)),
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

  const notifySidebarUpdated = () => {
    window.dispatchEvent(new CustomEvent('chiron:vet-appointments-updated'));
  };

  const handleUpdateStatus = useCallback(
    async (apptId: string, status: AppointmentStatus, cancelReason?: string | null) => {
      setStatusError(null);
      try {
        const updated = await vetApi.updateAppointment(apptId, {
          status,
          ...(status === 'CANCELLED' ? { cancelReason: cancelReason ?? null } : {}),
        });
        const freshItems = await loadAll(true);
        if (!isMountedRef.current) return;
        const fresh = freshItems.find((a) => a.id === apptId) ?? updated;
        setSelectedAppt((prev) => (prev?.id === apptId ? fresh : prev));
        const msg = STATUS_TOASTS[status];
        if (msg) toast(msg[0], msg[1]);
        notifySidebarUpdated();
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        const text = formatApiError(err, 'Ошибка обновления статуса');
        if (status === 'CANCELLED') throw new Error(text);
        setStatusError(text);
        toast('Не удалось обновить статус', text, 'err');
      }
    },
    [loadAll, toast]
  );

  const handleSaveNotes = useCallback(
    async (apptId: string, notes: string | null): Promise<void> => {
      try {
        const updated = await vetApi.updateAppointment(apptId, { vetNotes: notes });
        const freshItems = await loadAll(true);
        if (!isMountedRef.current) return;
        const fresh = freshItems.find((a) => a.id === apptId) ?? updated;
        setSelectedAppt((prev) => (prev?.id === apptId ? fresh : prev));
        toast(notes ? 'Заметки сохранены' : 'Заметки очищены');
        notifySidebarUpdated();
      } catch (err: unknown) {
        throw new Error(formatApiError(err, 'Не удалось сохранить заметки'));
      }
    },
    [loadAll, toast]
  );

  const handleCreateFollowUp = useCallback(
    async (apptId: string, data: CreateFollowUpRequest): Promise<void> => {
      try {
        await vetApi.createFollowUp(apptId, data);
        await loadAll(true);
        toast('Повторный приём назначен', 'Запись подтверждена, владелец получит уведомление');
        notifySidebarUpdated();
      } catch (err: unknown) {
        throw new Error(formatApiError(err, 'Не удалось назначить повторный приём'));
      }
    },
    [loadAll, toast]
  );

  const handleCreateVaccination = useCallback(
    async (payload: CreateVaccinationRequest): Promise<void> => {
      await vetApi.createVaccination(payload);
      const pName = petsMap[payload.petId]?.name || 'Пациент';
      toast('Прививка внесена', `${pName} — ${payload.name}`);
    },
    [petsMap, toast]
  );

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
    nextAppt,
    reload: loadAll,
    handleUpdateStatus,
    handleSaveNotes,
    handleCreateFollowUp,
    handleCreateVaccination,
  };
}
