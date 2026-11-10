import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/shared/api';
import { clinicApi } from '@/modules/clinic/api';
import { vetApi } from '@/modules/vet/api';
import { adminApi } from '@/modules/admin/api';
import type {
  CreateScheduleExceptionRequest,
  WorkSchedule,
  ScheduleException,
} from '@/modules/admin/types';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service } from '@/modules/clinic/types';
import { formatApiError, toIdNameMap } from '@/shared/lib';

export function useVetSchedule() {
  const { user } = useAuth();

  const [vetId, setVetId] = useState<string>('');
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Record<string, string>>({});
  const [pets, setPets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedException, setSelectedException] = useState<ScheduleException | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [exceptionToDelete, setExceptionToDelete] = useState<ScheduleException | null>(null);
  const [deletingException, setDeletingException] = useState(false);
  const [deleteExceptionError, setDeleteExceptionError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadExceptions = useCallback(async (targetVetId: string) => {
    try {
      const excRes = await clinicApi.getScheduleExceptions(targetVetId);
      if (!isMountedRef.current) return;
      setExceptions(Array.isArray(excRes) ? excRes : []);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      setError(formatApiError(err, 'Не удалось обновить список исключений'));
    }
  }, []);

  const loadScheduleData = useCallback(
    async (silent = false) => {
      const seq = ++loadSeqRef.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const [profileRes, svcRes, apptsRes, patientsRes] = await Promise.all([
          vetApi.getProfile().catch(() => null),
          clinicApi.getServices(),
          vetApi.getAppointments(0, 100),
          vetApi.getPatients().catch(() => [] as Pet[]),
        ]);

        if (!isMountedRef.current || seq !== loadSeqRef.current) return;

        setError(null);
        setServices(toIdNameMap(Array.isArray(svcRes) ? (svcRes as Service[]) : []));
        setPets(toIdNameMap(Array.isArray(patientsRes) ? patientsRes : []));
        setAppointments(apptsRes?.items ?? (Array.isArray(apptsRes) ? apptsRes : []));

        let myVet = profileRes;
        if (!myVet) {
          const vetsRes = await clinicApi.getVeterinarians().catch(() => []);
          if (!isMountedRef.current || seq !== loadSeqRef.current) return;
          const vetList = Array.isArray(vetsRes) ? vetsRes : [];
          myVet = vetList.find((v) => v.userId === user?.id) || vetList[0] || null;
        }

        if (myVet) {
          setVetId(myVet.id);
          const [schedRes, excRes] = await Promise.all([
            clinicApi.getWorkSchedules(myVet.id),
            clinicApi.getScheduleExceptions(myVet.id),
          ]);
          if (!isMountedRef.current || seq !== loadSeqRef.current) return;
          setSchedules(Array.isArray(schedRes) ? schedRes : []);
          setExceptions(Array.isArray(excRes) ? excRes : []);
        } else {
          setVetId('');
          setSchedules([]);
          setExceptions([]);
        }
      } catch (err: unknown) {
        if (!isMountedRef.current || seq !== loadSeqRef.current) return;
        if (!silent) {
          setError(formatApiError(err, 'Не удалось загрузить расписание врача'));
        }
      } finally {
        if (isMountedRef.current && seq === loadSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [user?.id]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await loadScheduleData();
    })();
    const handleNotification = () => {
      if (!cancelled) void loadScheduleData(true);
    };
    window.addEventListener('chiron:notification-received', handleNotification);
    return () => {
      cancelled = true;
      window.removeEventListener('chiron:notification-received', handleNotification);
    };
  }, [loadScheduleData]);

  const handleCreateException = useCallback(
    async (data: CreateScheduleExceptionRequest): Promise<void> => {
      setError(null);
      try {
        await adminApi.createScheduleException(data);
        if (isMountedRef.current && vetId) {
          await loadExceptions(vetId);
        }
      } catch (err: unknown) {
        const message =
          err instanceof ApiError && err.status === 403
            ? 'Недостаточно прав: создание исключений из графика доступно только администратору клиники.'
            : formatApiError(err, 'Не удалось сохранить исключение');
        if (isMountedRef.current) {
          setError(message);
        }
        throw new Error(message);
      }
    },
    [vetId, loadExceptions]
  );

  const requestDeleteException = useCallback((exc: ScheduleException) => {
    setDeleteExceptionError(null);
    setExceptionToDelete(exc);
  }, []);

  const cancelDeleteException = useCallback(() => {
    if (deletingException) return;
    setExceptionToDelete(null);
    setDeleteExceptionError(null);
  }, [deletingException]);

  const confirmDeleteException = useCallback(async () => {
    if (!exceptionToDelete) return;
    setDeletingException(true);
    setDeleteExceptionError(null);
    try {
      await adminApi.deleteScheduleException(exceptionToDelete.id);
      if (!isMountedRef.current) return;
      setSelectedException((prev) => (prev?.id === exceptionToDelete.id ? null : prev));
      setExceptionToDelete(null);
      if (vetId) await loadExceptions(vetId);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const message =
        err instanceof ApiError && err.status === 403
          ? 'Недостаточно прав: удаление исключений из графика доступно только администратору клиники.'
          : formatApiError(err, 'Не удалось удалить исключение');
      setDeleteExceptionError(message);
      setError(message);
    } finally {
      if (isMountedRef.current) {
        setDeletingException(false);
      }
    }
  }, [exceptionToDelete, vetId, loadExceptions]);

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
    vetId,
    schedules,
    exceptions,
    appointments,
    services,
    pets,
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
    isModalOpen,
    openExceptionModal: () => setIsModalOpen(true),
    closeExceptionModal: () => setIsModalOpen(false),
    handleCreateException,
    handleSelectAppt,
    handleSelectException,
    handleCloseDetail,
    exceptionToDelete,
    deletingException,
    deleteExceptionError,
    requestDeleteException,
    cancelDeleteException,
    confirmDeleteException,
  };
}
