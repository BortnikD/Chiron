'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import { useDictionaries } from '@/shared/hooks';
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

const SCHEDULE_VET_STORAGE_KEY = 'chiron-admin-schedule-vetId';
const EXC_TYPE_STORAGE_KEY = 'chiron-admin-schedule-excType';
const EXC_FROM_STORAGE_KEY = 'chiron-admin-schedule-excFrom';
const EXC_TO_STORAGE_KEY = 'chiron-admin-schedule-excTo';

function getStoredValue(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function persistValue(key: string, val: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (val && val !== 'ALL') {
      sessionStorage.setItem(key, val);
      localStorage.setItem(key, val);
    } else {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export function useAdminSchedules() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const tabParam = searchParams.get('tab');
  const vetParam = searchParams.get('vetId') || searchParams.get('vet') || '';
  const typeParam = searchParams.get('type') || searchParams.get('excType') || '';
  const fromParam = searchParams.get('from') || searchParams.get('excFrom') || '';
  const toParam = searchParams.get('to') || searchParams.get('excTo') || '';

  const {
    veterinarians: dictVets,
    specializations: dictSpecializations,
  } = useDictionaries();

  const [activeTab, setActiveTabState] = useState<'sched' | 'exc'>(() => resolveScheduleTab(tabParam));
  const [vets, setVets] = useState<Veterinarian[]>(() => dictVets);
  const [specializations, setSpecializations] = useState<Specialization[]>(() => dictSpecializations);
  const [loadingVets, setLoadingVets] = useState(true);
  const [vetsError, setVetsError] = useState<string | null>(null);

  useEffect(() => {
    if (dictSpecializations.length > 0) setSpecializations(dictSpecializations);
  }, [dictSpecializations]);

  const [selectedVetId, setSelectedVetIdState] = useState<string>(() => vetParam || getStoredValue(SCHEDULE_VET_STORAGE_KEY));
  const [excVetFilter, setExcVetFilterState] = useState<string>(() => vetParam || getStoredValue(SCHEDULE_VET_STORAGE_KEY));
  const [excTypeFilter, setExcTypeFilterState] = useState<string>(() => typeParam || getStoredValue(EXC_TYPE_STORAGE_KEY));
  const [excFromFilter, setExcFromFilterState] = useState<string>(() => fromParam || getStoredValue(EXC_FROM_STORAGE_KEY));
  const [excToFilter, setExcToFilterState] = useState<string>(() => toParam || getStoredValue(EXC_TO_STORAGE_KEY));

  const syncSchedulesToUrl = useCallback(
    (
      tab: string,
      vetId: string,
      typeFilter?: string,
      fromFilter?: string,
      toFilter?: string
    ) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);

      if (tab && tab !== 'sched' && tab !== 'schedules') url.searchParams.set('tab', tab);
      else url.searchParams.delete('tab');

      if (vetId && vetId !== 'ALL') url.searchParams.set('vetId', vetId);
      else url.searchParams.delete('vetId');

      if (tab === 'exc') {
        if (typeFilter) url.searchParams.set('type', typeFilter);
        else url.searchParams.delete('type');

        if (fromFilter) url.searchParams.set('from', fromFilter);
        else url.searchParams.delete('from');

        if (toFilter) url.searchParams.set('to', toFilter);
        else url.searchParams.delete('to');
      } else {
        url.searchParams.delete('type');
        url.searchParams.delete('from');
        url.searchParams.delete('to');
      }

      const nextSearch = url.searchParams.toString();
      const currentSearch = window.location.search.replace(/^\?/, '');
      if (nextSearch !== currentSearch) {
        window.history.replaceState(null, '', url.pathname + (nextSearch ? `?${nextSearch}` : '') + url.hash);
      }
    },
    []
  );

  const setSelectedVetId = useCallback(
    (vetId: string) => {
      setSelectedVetIdState(vetId);
      persistValue(SCHEDULE_VET_STORAGE_KEY, vetId);
      syncSchedulesToUrl(activeTab, vetId, excTypeFilter, excFromFilter, excToFilter);
    },
    [activeTab, excTypeFilter, excFromFilter, excToFilter, syncSchedulesToUrl]
  );

  const setActiveTab = useCallback(
    (tab: 'sched' | 'exc') => {
      setActiveTabState(tab);
      const vetToSync = tab === 'sched' ? selectedVetId : (excVetFilter || selectedVetId);
      syncSchedulesToUrl(tab, vetToSync, excTypeFilter, excFromFilter, excToFilter);
    },
    [selectedVetId, excVetFilter, excTypeFilter, excFromFilter, excToFilter, syncSchedulesToUrl]
  );

  const setExcVetFilter = useCallback(
    (vetId: string) => {
      const cleanVetId = vetId === 'ALL' ? '' : vetId;
      setExcVetFilterState(cleanVetId);
      persistValue(SCHEDULE_VET_STORAGE_KEY, cleanVetId);
      syncSchedulesToUrl(activeTab, cleanVetId, excTypeFilter, excFromFilter, excToFilter);
    },
    [activeTab, excTypeFilter, excFromFilter, excToFilter, syncSchedulesToUrl]
  );

  const setExcTypeFilter = useCallback(
    (type: string) => {
      setExcTypeFilterState(type);
      persistValue(EXC_TYPE_STORAGE_KEY, type);
      syncSchedulesToUrl(activeTab, excVetFilter, type, excFromFilter, excToFilter);
    },
    [activeTab, excVetFilter, excFromFilter, excToFilter, syncSchedulesToUrl]
  );

  const setExcFromFilter = useCallback(
    (from: string) => {
      setExcFromFilterState(from);
      persistValue(EXC_FROM_STORAGE_KEY, from);
      syncSchedulesToUrl(activeTab, excVetFilter, excTypeFilter, from, excToFilter);
    },
    [activeTab, excVetFilter, excTypeFilter, excToFilter, syncSchedulesToUrl]
  );

  const setExcToFilter = useCallback(
    (to: string) => {
      setExcToFilterState(to);
      persistValue(EXC_TO_STORAGE_KEY, to);
      syncSchedulesToUrl(activeTab, excVetFilter, excTypeFilter, excFromFilter, to);
    },
    [activeTab, excVetFilter, excTypeFilter, excFromFilter, syncSchedulesToUrl]
  );

  const resetExcFilters = useCallback(() => {
    setExcVetFilterState('');
    setExcTypeFilterState('');
    setExcFromFilterState('');
    setExcToFilterState('');
    persistValue(SCHEDULE_VET_STORAGE_KEY, '');
    persistValue(EXC_TYPE_STORAGE_KEY, '');
    persistValue(EXC_FROM_STORAGE_KEY, '');
    persistValue(EXC_TO_STORAGE_KEY, '');
    syncSchedulesToUrl(activeTab, '', '', '', '');
  }, [activeTab, syncSchedulesToUrl]);
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
      setSelectedVetIdState(vetParam);
      setExcVetFilterState(vetParam);
      persistValue(SCHEDULE_VET_STORAGE_KEY, vetParam);
    }
  }, [vetParam]);

  useEffect(() => {
    if (typeParam !== null && typeParam !== undefined && typeParam !== excTypeFilter) {
      setExcTypeFilterState(typeParam);
    }
  }, [typeParam, excTypeFilter]);

  useEffect(() => {
    if (fromParam !== null && fromParam !== undefined && fromParam !== excFromFilter) {
      setExcFromFilterState(fromParam);
    }
  }, [fromParam, excFromFilter]);

  useEffect(() => {
    if (toParam !== null && toParam !== undefined && toParam !== excToFilter) {
      setExcToFilterState(toParam);
    }
  }, [toParam, excToFilter]);

  const loadVets = useCallback(async () => {
    const reqId = ++vetsReqIdRef.current;
    setLoadingVets(true);
    setVetsError(null);
    try {
      const vetUsers = await fetchAllPages(
        (p, s) => adminApi.getUsers(p, s, 'VETERINARIAN'),
        { pageSize: 100, maxPages: 20, concurrency: 4 }
      );
      if (reqId !== vetsReqIdRef.current) return;
      const baseVets = dictVets.length > 0 ? dictVets : await adminApi.getVeterinarians();
      const list = (Array.isArray(baseVets) ? baseVets : []).map((v) =>
        v.user ? v : { ...v, user: vetUsers.find((u) => u.id === v.userId) }
      );
      setVets(list);
      if (list.length > 0) {
        setSelectedVetIdState((prev) => {
          const stored = getStoredValue(SCHEDULE_VET_STORAGE_KEY);
          const candidate =
            vetParam && list.some((v) => v.id === vetParam)
              ? vetParam
              : prev && list.some((v) => v.id === prev)
              ? prev
              : stored && list.some((v) => v.id === stored)
              ? stored
              : list[0].id;
          persistValue(SCHEDULE_VET_STORAGE_KEY, candidate);
          syncSchedulesToUrl(activeTab, candidate, excTypeFilter, excFromFilter, excToFilter);
          return candidate;
        });

        setExcVetFilterState((prev) => {
          const stored = getStoredValue(SCHEDULE_VET_STORAGE_KEY);
          const candidate =
            vetParam && list.some((v) => v.id === vetParam)
              ? vetParam
              : prev && list.some((v) => v.id === prev)
              ? prev
              : stored && list.some((v) => v.id === stored)
              ? stored
              : '';
          return candidate;
        });
      }
    } catch (err: unknown) {
      if (reqId !== vetsReqIdRef.current) return;
      setVetsError(formatApiError(err, 'Не удалось загрузить список врачей.'));
    } finally {
      if (reqId === vetsReqIdRef.current) setLoadingVets(false);
    }
  }, [vetParam, dictVets, activeTab, excTypeFilter, excFromFilter, excToFilter, syncSchedulesToUrl]);

  const loadSchedule = useCallback(async (vetId: string, forceFresh = false) => {
    if (!vetId) return;
    const reqId = ++schedReqIdRef.current;
    setLoadingSchedule(true);
    setScheduleError(null);
    try {
      const res = await clinicApi.getWorkSchedules(vetId, forceFresh);
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
    },
    [setActiveTab]
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
      let saved: WorkSchedule | null = null;
      if (data.scheduleId) {
        saved = await adminApi.updateWorkSchedule(data.scheduleId, buildWorkScheduleUpdatePayload(data));
      } else {
        saved = await adminApi.createWorkSchedule(buildWorkScheduleCreatePayload(data));
      }
      if (data.veterinarianId !== selectedVetId) {
        setSelectedVetId(data.veterinarianId);
      } else if (selectedVetId) {
        if (saved && saved.id) {
          setSchedules((prev) => {
            const idx = prev.findIndex((s) => s.id === saved!.id || s.dayOfWeek === saved!.dayOfWeek);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = saved!;
              return next;
            }
            return [...prev, saved!];
          });
        }
        await loadSchedule(selectedVetId, true);
      }
      toast('Расписание сохранено', findVetDisplayName(vets, data.veterinarianId, specsMap));
    },
    [selectedVetId, loadSchedule, vets, specsMap, toast, setSelectedVetId]
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
        setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        await loadSchedule(selectedVetId, true);
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
    excTypeFilter,
    setExcTypeFilter,
    excFromFilter,
    setExcFromFilter,
    excToFilter,
    setExcToFilter,
    resetExcFilters,
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
