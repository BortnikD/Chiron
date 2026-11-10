import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { vetApi } from '@/modules/vet/api';
import type { CreateFollowUpRequest } from '@/modules/vet/types';
import { clinicApi } from '@/modules/clinic/api';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Specialization, Species, Veterinarian } from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import { formatApiError, getMoscowDateKey, getMoscowTodayIso, toIdNameMap } from '@/shared/lib';

export function useVetDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [vetProfile, setVetProfile] = useState<Veterinarian | null>(null);
  const [petsMap, setPetsMap] = useState<Record<string, Pet>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const initializedRef = useRef(false);
  const isMountedRef = useRef(true);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadAll = useCallback(async (silent = false): Promise<Appointment[]> => {
    const seq = ++loadSeqRef.current;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [apptsRes, svcRes, patientsRes, profileRes, specsRes, speciesRes] = await Promise.all([
        vetApi.getAppointments(0, 100),
        clinicApi.getServices(),
        vetApi.getPatients().catch(() => [] as Pet[]),
        vetApi.getProfile().catch(() => null),
        clinicApi.getSpecializations().catch(() => [] as Specialization[]),
        clinicApi.getSpecies().catch(() => [] as Species[]),
      ]);

      if (!isMountedRef.current || seq !== loadSeqRef.current) return [];

      setError(null);
      const items = apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []);
      items.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
      setAppointments(items);
      setServices(Array.isArray(svcRes) ? svcRes : []);
      setSpecializations(Array.isArray(specsRes) ? specsRes : []);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setVetProfile(profileRes);

      const pMap: Record<string, Pet> = {};
      if (Array.isArray(patientsRes)) {
        patientsRes.forEach((p) => {
          pMap[p.id] = p;
        });
      }
      setPetsMap(pMap);

      if (!initializedRef.current) {
        initializedRef.current = true;
        if (items.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1280) {
          setSelectedAppt(items[0]);
        }
      } else {
        setSelectedAppt((prev) => (prev ? items.find((a) => a.id === prev.id) ?? prev : null));
      }

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
    const handleNotification = () => {
      if (!cancelled) void loadAll(true);
    };
    window.addEventListener('chiron:notification-received', handleNotification);
    return () => {
      cancelled = true;
      window.removeEventListener('chiron:notification-received', handleNotification);
    };
  }, [loadAll]);

  const servicesMap = useMemo(() => toIdNameMap(services), [services]);
  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);
  const speciesMap = useMemo(() => toIdNameMap(speciesList), [speciesList]);

  const todayStr = getMoscowTodayIso();

  const todayAppts = useMemo(
    () => appointments.filter((a) => getMoscowDateKey(a.startAt) === todayStr),
    [appointments, todayStr]
  );

  const pendingAppts = useMemo(
    () => appointments.filter((a) => a.status === 'PENDING'),
    [appointments]
  );

  const nextAppt = useMemo(
    () => appointments.find((a) => a.status === 'CONFIRMED' || a.status === 'PENDING') || null,
    [appointments]
  );

  const handleUpdateStatus = useCallback(
    async (apptId: string, status: AppointmentStatus) => {
      setStatusError(null);
      try {
        const updated = await vetApi.updateAppointment(apptId, { status });
        const freshItems = await loadAll(true);
        if (!isMountedRef.current) return;
        const fresh = freshItems.find((a) => a.id === apptId) ?? updated;
        setSelectedAppt((prev) => (prev?.id === apptId ? fresh : prev));
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        setStatusError(formatApiError(err, 'Ошибка обновления статуса'));
      }
    },
    [loadAll]
  );

  const handleSaveNotes = useCallback(
    async (apptId: string, notes: string): Promise<void> => {
      try {
        const updated = await vetApi.updateAppointment(apptId, {
          vetNotes: notes.trim() || null,
        });
        const freshItems = await loadAll(true);
        if (!isMountedRef.current) return;
        const fresh = freshItems.find((a) => a.id === apptId) ?? updated;
        setSelectedAppt((prev) => (prev?.id === apptId ? fresh : prev));
      } catch (err: unknown) {
        throw new Error(formatApiError(err, 'Не удалось сохранить заметки'));
      }
    },
    [loadAll]
  );

  const handleCreateFollowUp = useCallback(
    async (apptId: string, data: CreateFollowUpRequest): Promise<void> => {
      try {
        await vetApi.createFollowUp(apptId, data);
        await loadAll(true);
      } catch (err: unknown) {
        throw new Error(formatApiError(err, 'Не удалось назначить повторный приём'));
      }
    },
    [loadAll]
  );

  return {
    appointments,
    services,
    servicesMap,
    specsMap,
    speciesMap,
    vetProfile,
    petsMap,
    loading,
    error,
    clearError: () => setError(null),
    statusError,
    clearStatusError: () => setStatusError(null),
    selectedAppt,
    setSelectedAppt,
    todayAppts,
    pendingAppts,
    nextAppt,
    reload: loadAll,
    handleUpdateStatus,
    handleSaveNotes,
    handleCreateFollowUp,
  };
}
