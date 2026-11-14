'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type { WorkSchedule, ScheduleException } from '@/modules/admin/types';
import type { Specialization, Veterinarian } from '@/modules/clinic/types';
import { useToast } from '@/shared/components';
import { fetchAllPages, formatApiError, toIdNameMap } from '@/shared/lib';
import {
  buildDeleteConfirmMeta,
  buildExceptionCreatePayload,
  buildExceptionUpdatePayload,
  buildWorkScheduleCreatePayload,
  buildWorkScheduleUpdatePayload,
  findVetDisplayName,
  resolveFreeDayIndex,
  resolveScheduleTab,
  type WorkScheduleSavePayload,
  type ScheduleExceptionSavePayload,
  type DeleteScheduleTarget,
} from '../_components/types';

export type { WorkScheduleSavePayload, ScheduleExceptionSavePayload, DeleteScheduleTarget };

export function useAdminSchedules() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const tabParam = searchParams.get('tab');
  const vetParam = searchParams.get('vetId') || searchParams.get('vet') || '';

  const [activeTab, setActiveTabState] = useState<'sched' | 'exc'>(() => resolveScheduleTab(tabParam));
  const [vets, setVets] = useState<Veterinarian[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loadingVets, setLoadingVets] = useState(true);
  const [vetsError, setVetsError] = useState<string | null>(null);

  const [selectedVetId, setSelectedVetId] = useState<string>('');
  const [excVetFilter, setExcVetFilterState] = useState<string>(vetParam);

  const syncSchedulesToUrl = useCallback((tab: string, vetId: string) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (tab && tab !== 'sched') url.searchParams.set('tab', tab);
    else url.searchParams.delete('tab');
    if (vetId) url.searchParams.set('vetId', vetId);
    else url.searchParams.delete('vetId');

    const nextSearch = url.searchParams.toString();
    const currentSearch = window.location.search.replace(/^\?/, '');
    if (nextSearch !== currentSearch) {
      window.history.replaceState(null, '', url.pathname + (nextSearch ? `?${nextSearch}` : '') + url.hash);
    }
  }, []);

  const setActiveTab = useCallback(
    (tab: 'sched' | 'exc') => {
      setActiveTabState(tab);
      syncSchedulesToUrl(tab, excVetFilter);
    },
    [excVetFilter, syncSchedulesToUrl]
  );

  const setExcVetFilter = useCallback(
    (vetId: string) => {
      setExcVetFilterState(vetId);
      syncSchedulesToUrl(activeTab, vetId);
    },
    [activeTab, syncSchedulesToUrl]
  );
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
    setActiveTab(resolveScheduleTab(tabParam));
  }, [tabParam]);

  useEffect(() => {
    if (vetParam) {
      setExcVetFilter(vetParam);
    }
  }, [vetParam]);

  const loadVets = useCallback(async () => {
    const reqId = ++vetsReqIdRef.current;
    setLoadingVets(true);
    setVetsError(null);
    try {
      const [res, vetUsers, specsRes] = await Promise.all([
        adminApi.getVeterinarians(),
        fetchAllPages((p, s) => adminApi.getUsers(p, s, 'VETERINARIAN'), { pageSize: 100, maxPages: 20, concurrency: 4 }),
        clinicApi.getSpecializations(),
      ]);
      if (reqId !== vetsReqIdRef.current) return;
      const list = (Array.isArray(res) ? res : []).map((v) =>
        v.user ? v : { ...v, user: vetUsers.find((u) => u.id === v.userId) }
      );
      setVets(list);
      setSpecializations(Array.isArray(specsRes) ? specsRes : []);
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
      const items = await fetchAllPages((p, s) => adminApi.getScheduleExceptions(p, s), {
        pageSize: 100,
        maxPages: 30,
        concurrency: 4,
      });
      if (reqId !== excReqIdRef.current) return;
      setExceptions(items);
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

  const specsMap = useMemo(() => toIdNameMap(specializations), [specializations]);

  const selectedVetName = useMemo(
    () => findVetDisplayName(vets, selectedVetId, specsMap) || 'Врач',
    [vets, selectedVetId, specsMap]
  );

  const excVetName = useMemo(
    () => (excVetFilter ? findVetDisplayName(vets, excVetFilter, specsMap) || '' : ''),
    [excVetFilter, vets, specsMap]
  );

  const switchTab = useCallback(
    (tab: 'sched' | 'exc') => {
      setActiveTab(tab);
      router.replace(
        tab === 'exc' ? '/admin/schedules?tab=exc' : '/admin/schedules?tab=schedules'
      );
    },
    [router]
  );

  const openAddDay = useCallback(
    (dayIdx?: number) => {
      setScheduleModal({
        open: true,
        schedule: null,
        dayIndex: resolveFreeDayIndex(schedules, dayIdx),
      });
    },
    [schedules]
  );

  const openEditDay = useCallback((schedule: WorkSchedule, dayIndex: number) => {
    setScheduleModal({ open: true, schedule, dayIndex });
  }, []);

  const closeScheduleModal = useCallback(() => setScheduleModal({ open: false }), []);

  const saveWorkSchedule = useCallback(
    async (data: WorkScheduleSavePayload) => {
      if (data.scheduleId) {
        await adminApi.updateWorkSchedule(data.scheduleId, buildWorkScheduleUpdatePayload(data));
      } else {
        await adminApi.createWorkSchedule(buildWorkScheduleCreatePayload(data));
      }
      if (data.veterinarianId !== selectedVetId) {
        setSelectedVetId(data.veterinarianId);
      } else if (selectedVetId) {
        await loadSchedule(selectedVetId);
      }
      toast('Расписание сохранено', findVetDisplayName(vets, data.veterinarianId, specsMap));
    },
    [selectedVetId, loadSchedule, vets, specsMap, toast]
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
        await adminApi.updateScheduleException(data.exceptionId, buildExceptionUpdatePayload(data));
      } else {
        await adminApi.createScheduleException(buildExceptionCreatePayload(data));
      }
      await loadExceptions();
      toast('Исключение сохранено', findVetDisplayName(vets, data.veterinarianId, specsMap));
    },
    [loadExceptions, vets, specsMap, toast]
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
        toast('День удалён из графика');
      } else {
        await adminApi.deleteScheduleException(deleteTarget.exception.id);
        await loadExceptions();
        toast('Исключение удалено');
      }
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Не удалось выполнить удаление'));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, selectedVetId, loadSchedule, loadExceptions, toast]);

  const deleteConfirmMeta = useMemo(() => buildDeleteConfirmMeta(deleteTarget), [deleteTarget]);
  const error = vetsError || (activeTab === 'sched' ? scheduleError : exceptionsError);

  return {
    activeTab,
    switchTab,
    vets,
    specsMap,
    loadingVets,
    selectedVetId,
    setSelectedVetId,
    selectedVetName,
    excVetFilter,
    setExcVetFilter,
    excVetName,
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
