'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type { WorkSchedule, ScheduleException } from '@/modules/admin/types';
import type { Veterinarian } from '@/modules/clinic/types';
import { DOW_ORDER, formatApiError, formatIsoDateDisplay } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import type {
  WorkScheduleSavePayload,
  ScheduleExceptionSavePayload,
  DeleteScheduleTarget,
} from '../_components/types';

export type { WorkScheduleSavePayload, ScheduleExceptionSavePayload, DeleteScheduleTarget };

export function useAdminSchedules() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const vetParam = searchParams.get('vetId') || searchParams.get('vet');

  const [activeTab, setActiveTab] = useState<'sched' | 'exc'>(
    tabParam === 'exc' || tabParam === 'exceptions' ? 'exc' : 'sched'
  );
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [loadingVets, setLoadingVets] = useState(true);
  const [vetsError, setVetsError] = useState<string | null>(null);

  const [selectedVetId, setSelectedVetId] = useState<string>('');
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [loadingExceptions, setLoadingExceptions] = useState(false);
  const [exceptionsError, setExceptionsError] = useState<string | null>(null);

  const [scheduleModal, setScheduleModal] = useState<{
    open: boolean;
    schedule?: WorkSchedule | null;
    dayIndex?: number;
  }>({ open: false });

  const [exceptionModal, setExceptionModal] = useState<{
    open: boolean;
    exception?: ScheduleException | null;
  }>({ open: false });

  const [deleteTarget, setDeleteTarget] = useState<DeleteScheduleTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const vetsReqIdRef = useRef(0);
  const schedReqIdRef = useRef(0);
  const excReqIdRef = useRef(0);

  useEffect(() => {
    setActiveTab(tabParam === 'exc' || tabParam === 'exceptions' ? 'exc' : 'sched');
  }, [tabParam]);

  const loadVets = useCallback(async () => {
    const reqId = ++vetsReqIdRef.current;
    setLoadingVets(true);
    setVetsError(null);
    try {
      const res = await adminApi.getVeterinarians();
      if (reqId !== vetsReqIdRef.current) return;
      const list = Array.isArray(res) ? res : [];
      setVets(list);
      if (list.length > 0) {
        setSelectedVetId((prev) => {
          if (vetParam && list.some((v) => v.id === vetParam)) return vetParam;
          return prev && list.some((v) => v.id === prev) ? prev : list[0].id;
        });
      }
    } catch (err: unknown) {
      if (reqId !== vetsReqIdRef.current) return;
      setVetsError(formatApiError(err, 'Не удалось загрузить список врачей.'));
    } finally {
      if (reqId === vetsReqIdRef.current) setLoadingVets(false);
    }
  }, [vetParam]);

  const loadSchedule = useCallback(async (vetId: string) => {
    if (!vetId) return;
    const reqId = ++schedReqIdRef.current;
    setLoadingSchedule(true);
    setScheduleError(null);
    try {
      const res = await clinicApi.getWorkSchedules(vetId);
      if (reqId !== schedReqIdRef.current) return;
      setSchedules(Array.isArray(res) ? res : []);
    } catch (err: unknown) {
      if (reqId !== schedReqIdRef.current) return;
      setScheduleError(formatApiError(err, 'Не удалось загрузить график врача.'));
    } finally {
      if (reqId === schedReqIdRef.current) setLoadingSchedule(false);
    }
  }, []);

  const loadExceptions = useCallback(async () => {
    const reqId = ++excReqIdRef.current;
    setLoadingExceptions(true);
    setExceptionsError(null);
    try {
      const res = await adminApi.getScheduleExceptions(0, 100);
      if (reqId !== excReqIdRef.current) return;
      setExceptions(res?.items ?? []);
    } catch (err: unknown) {
      if (reqId !== excReqIdRef.current) return;
      setExceptionsError(formatApiError(err, 'Не удалось загрузить исключения из расписания.'));
    } finally {
      if (reqId === excReqIdRef.current) setLoadingExceptions(false);
    }
  }, []);

  useEffect(() => {
    void loadVets();
    return () => {
      vetsReqIdRef.current += 1;
    };
  }, [loadVets]);

  useEffect(() => {
    if (selectedVetId) void loadSchedule(selectedVetId);
    return () => {
      schedReqIdRef.current += 1;
    };
  }, [selectedVetId, loadSchedule]);

  useEffect(() => {
    void loadExceptions();
    return () => {
      excReqIdRef.current += 1;
    };
  }, [loadExceptions]);

  const reload = useCallback(() => {
    if (vetsError || vets.length === 0) void loadVets();
    if (selectedVetId) void loadSchedule(selectedVetId);
    void loadExceptions();
  }, [vetsError, vets.length, loadVets, selectedVetId, loadSchedule, loadExceptions]);

  const selectedVet = useMemo(() => vets.find((v) => v.id === selectedVetId), [vets, selectedVetId]);
  const selectedVetName = selectedVet ? getDoctorDisplay(selectedVet).fullName : 'Врач';

  const switchTab = useCallback(
    (tab: 'sched' | 'exc') => {
      setActiveTab(tab);
      router.replace(tab === 'exc' ? '/admin/schedules?tab=exc' : '/admin/schedules');
    },
    [router]
  );

  const openAddDay = useCallback(
    (dayIdx?: number) => {
      let targetDay = dayIdx ?? 0;
      if (dayIdx === undefined) {
        const scheduledDows = new Set(schedules.map((s) => s.dayOfWeek));
        const firstFree = DOW_ORDER.findIndex((d) => !scheduledDows.has(d));
        targetDay = firstFree >= 0 ? firstFree : 0;
      }
      setScheduleModal({ open: true, schedule: null, dayIndex: targetDay });
    },
    [schedules]
  );

  const openEditDay = useCallback((schedule: WorkSchedule, dayIndex: number) => {
    setScheduleModal({ open: true, schedule, dayIndex });
  }, []);

  const closeScheduleModal = useCallback(() => setScheduleModal({ open: false }), []);

  const saveWorkSchedule = useCallback(
    async (data: WorkScheduleSavePayload) => {
      const payload = {
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart,
        breakEnd: data.breakEnd,
      };
      if (data.scheduleId) {
        await adminApi.updateWorkSchedule(data.scheduleId, payload);
      } else {
        await adminApi.createWorkSchedule({
          veterinarianId: data.veterinarianId,
          dayOfWeek: data.dayOfWeek,
          ...payload,
        });
      }
      if (selectedVetId) await loadSchedule(selectedVetId);
    },
    [selectedVetId, loadSchedule]
  );

  const openAddException = useCallback(() => setExceptionModal({ open: true, exception: null }), []);
  const openEditException = useCallback(
    (exception: ScheduleException) => setExceptionModal({ open: true, exception }),
    []
  );
  const closeExceptionModal = useCallback(() => setExceptionModal({ open: false }), []);

  const saveScheduleException = useCallback(
    async (data: ScheduleExceptionSavePayload) => {
      if (data.exceptionId) {
        await adminApi.updateScheduleException(data.exceptionId, {
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          startTime: data.type === 'CUSTOM_HOURS' ? data.startTime : null,
          endTime: data.type === 'CUSTOM_HOURS' ? data.endTime : null,
          reason: data.reason || null,
        });
      } else {
        await adminApi.createScheduleException({
          veterinarianId: data.veterinarianId,
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          startTime: data.startTime,
          endTime: data.endTime,
          reason: data.reason,
        });
      }
      await loadExceptions();
    },
    [loadExceptions]
  );

  const requestDeleteSchedule = useCallback((id: string, dowName: string) => {
    setDeleteError(null);
    setDeleteTarget({ type: 'schedule', id, dowName });
  }, []);

  const requestDeleteException = useCallback((exception: ScheduleException) => {
    setDeleteError(null);
    setDeleteTarget({ type: 'exception', exception });
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (!isDeleting) {
      setDeleteTarget(null);
      setDeleteError(null);
    }
  }, [isDeleting]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (deleteTarget.type === 'schedule') {
        await adminApi.deleteWorkSchedule(deleteTarget.id);
        await loadSchedule(selectedVetId);
      } else {
        await adminApi.deleteScheduleException(deleteTarget.exception.id);
        await loadExceptions();
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Не удалось выполнить удаление'));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, selectedVetId, loadSchedule, loadExceptions]);

  const deleteConfirmMeta = useMemo(() => {
    if (!deleteTarget) return { title: '', description: '' };
    if (deleteTarget.type === 'schedule') {
      return {
        title: `Удалить рабочий график на ${deleteTarget.dowName}?`,
        description: `Рабочий график на ${deleteTarget.dowName} будет удален, день станет выходным.`,
      };
    }
    const ex = deleteTarget.exception;
    const typeLabel = ex.type === 'ABSENCE' ? 'Отсутствие' : 'Особые часы';
    const range =
      ex.startDate === ex.endDate
        ? formatIsoDateDisplay(ex.startDate)
        : `${formatIsoDateDisplay(ex.startDate)} – ${formatIsoDateDisplay(ex.endDate)}`;
    return {
      title: 'Удалить исключение из расписания?',
      description: `Исключение (${typeLabel}, ${range}) будет удалено.`,
    };
  }, [deleteTarget]);

  const error = vetsError || (activeTab === 'sched' ? scheduleError : exceptionsError);

  return {
    activeTab,
    switchTab,
    vets,
    loadingVets,
    selectedVetId,
    setSelectedVetId,
    selectedVetName,
    schedules,
    loadingSchedule,
    exceptions,
    loadingExceptions,
    error,
    reload,
    loadSchedule,
    loadExceptions,
    scheduleModal,
    openAddDay,
    openEditDay,
    closeScheduleModal,
    saveWorkSchedule,
    exceptionModal,
    openAddException,
    openEditException,
    closeExceptionModal,
    saveScheduleException,
    deleteTarget,
    deleteConfirmMeta,
    isDeleting,
    deleteError,
    requestDeleteSchedule,
    requestDeleteException,
    closeDeleteModal,
    confirmDelete,
  };
}
