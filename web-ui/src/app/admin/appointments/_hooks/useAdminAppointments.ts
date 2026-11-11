'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type {
  AdminCreateAppointmentRequest,
  AdminUpdateAppointmentRequest,
} from '@/modules/admin/types';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian, Service, Species } from '@/modules/clinic/types';
import type { AppointmentStatus, User } from '@/shared/types';
import { useToast } from '@/shared/components';
import { fetchAllPages, formatApiError } from '@/shared/lib';
import { buildActiveFilterChips, nextMoscowDayIso } from '../_components/utils';

export function useAdminAppointments() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialSel = searchParams.get('sel');
  const initialPetId = searchParams.get('petId') || 'ALL';
  const initialOwnerId = searchParams.get('ownerId') || 'ALL';
  const initialVetId = searchParams.get('veterinarianId') || 'ALL';
  const initialServiceId = searchParams.get('serviceId') || 'ALL';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState<number>(25);

  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilters, setStatusFiltersState] = useState<AppointmentStatus[]>([]);
  const [vetFilter, setVetFilterState] = useState<string>(initialVetId);
  const [petFilter, setPetFilterState] = useState<string>(initialPetId);
  const [ownerFilter, setOwnerFilterState] = useState<string>(initialOwnerId);
  const [serviceFilter, setServiceFilterState] = useState<string>(initialServiceId);
  const [dateFrom, setDateFromState] = useState<string>('');
  const [dateTo, setDateToState] = useState<string>('');

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);

  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('По просьбе клиента');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [deleteAppt, setDeleteAppt] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const refsReqIdRef = useRef(0);
  const appliedInitialSelRef = useRef<string | null>(null);

  const loadRefs = useCallback(async () => {
    const reqId = ++refsReqIdRef.current;
    try {
      const [vetsRes, svcsRes, speciesRes, allPets, allUsers] = await Promise.all([
        adminApi.getVeterinarians(),
        adminApi.getServices(),
        clinicApi.getSpecies(),
        fetchAllPages((p, s) => adminApi.getPets(p, s), { pageSize: 100, maxPages: 50, concurrency: 4 }),
        fetchAllPages((p, s) => adminApi.getUsers(p, s), { pageSize: 100, maxPages: 50, concurrency: 4 }),
      ]);
      if (reqId !== refsReqIdRef.current) return;
      setVeterinarians(Array.isArray(vetsRes) ? vetsRes : []);
      setServices(Array.isArray(svcsRes) ? svcsRes : []);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setPets(allPets);
      setUsers(allUsers);
    } catch {
      // справочные ошибки обрабатываются при основном запросе, либо доступны при повторном reload
    }
  }, []);

  const loadData = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const fromIso = dateFrom ? new Date(`${dateFrom}T00:00:00+03:00`).toISOString() : undefined;
      const toIso = dateTo
        ? new Date(`${nextMoscowDayIso(dateTo)}T00:00:00+03:00`).toISOString()
        : undefined;

      const apptsRes = await adminApi.getAppointments(page, pageSize, {
        status: statusFilters.length > 0 ? statusFilters : undefined,
        veterinarianId: vetFilter !== 'ALL' ? vetFilter : undefined,
        petId: petFilter !== 'ALL' ? petFilter : undefined,
        ownerId: ownerFilter !== 'ALL' ? ownerFilter : undefined,
        serviceId: serviceFilter !== 'ALL' ? serviceFilter : undefined,
        from: fromIso,
        to: toIso,
      });

      if (reqId !== requestIdRef.current) return;

      const appts = apptsRes?.items || [];
      setAppointments(appts);
      setTotalElements(apptsRes?.totalElements ?? appts.length);
      setTotalPages(Math.max(1, apptsRes?.totalPages ?? 1));

      if (initialSel && appliedInitialSelRef.current !== initialSel) {
        appliedInitialSelRef.current = initialSel;
        const foundInPage = appts.find((a) => a.id === initialSel);
        if (foundInPage) {
          setSelectedAppt(foundInPage);
        } else {
          try {
            const byId = await adminApi.getAppointmentById(initialSel);
            if (reqId === requestIdRef.current && byId) setSelectedAppt(byId);
          } catch {
            // ignore missing deep link target
          }
        }
      } else {
        setSelectedAppt((prev) => (prev ? appts.find((a) => a.id === prev.id) ?? prev : null));
      }
    } catch (err: unknown) {
      if (reqId !== requestIdRef.current) return;
      setError(formatApiError(err, 'Не удалось загрузить список записей на приём.'));
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [page, pageSize, statusFilters, vetFilter, petFilter, ownerFilter, serviceFilter, dateFrom, dateTo, initialSel]);

  useEffect(() => {
    void loadRefs();
    return () => {
      refsReqIdRef.current += 1;
    };
  }, [loadRefs]);

  useEffect(() => {
    void loadData();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadData]);

  const reloadAll = useCallback(() => {
    void loadRefs();
    void loadData();
  }, [loadRefs, loadData]);

  const toggleStatusFilter = useCallback((st: AppointmentStatus) => {
    setPage(0);
    setStatusFiltersState((prev) =>
      prev.includes(st) ? prev.filter((item) => item !== st) : [...prev, st]
    );
  }, []);

  const setVetFilter = useCallback((v: string) => { setPage(0); setVetFilterState(v); }, []);
  const setPetFilter = useCallback((v: string) => { setPage(0); setPetFilterState(v); }, []);
  const setOwnerFilter = useCallback((v: string) => { setPage(0); setOwnerFilterState(v); }, []);
  const setServiceFilter = useCallback((v: string) => { setPage(0); setServiceFilterState(v); }, []);
  const setDateFrom = useCallback((v: string) => { setPage(0); setDateFromState(v); }, []);
  const setDateTo = useCallback((v: string) => { setPage(0); setDateToState(v); }, []);
  const setPageSize = useCallback((size: number) => { setPage(0); setPageSizeState(size); }, []);

  const resetFilters = useCallback(() => {
    setPage(0);
    setStatusFiltersState([]);
    setVetFilterState('ALL');
    setPetFilterState('ALL');
    setOwnerFilterState('ALL');
    setServiceFilterState('ALL');
    setDateFromState('');
    setDateToState('');
  }, []);

  const enrichedVeterinarians = useMemo(
    () => veterinarians.map((v) => (v.user ? v : { ...v, user: users.find((u) => u.id === v.userId) })),
    [veterinarians, users]
  );

  const activeFilters = useMemo(
    () =>
      buildActiveFilterChips({
        vetFilter, petFilter, ownerFilter, serviceFilter, statusFilters, dateFrom, dateTo,
        veterinarians: enrichedVeterinarians, pets, users, services,
        setVetFilter, setPetFilter, setOwnerFilter, setServiceFilter,
        toggleStatusFilter, setDateFrom, setDateTo,
      }),
    [
      vetFilter, petFilter, ownerFilter, serviceFilter, statusFilters, dateFrom, dateTo,
      enrichedVeterinarians, pets, users, services,
      setVetFilter, setPetFilter, setOwnerFilter, setServiceFilter,
      toggleStatusFilter, setDateFrom, setDateTo,
    ]
  );

  const checkSlotAvailability = useCallback(
    async (params: { veterinarianId: string; startAt: string; endAt: string; excludeAppointmentId?: string }) =>
      clinicApi.checkAvailability(params),
    []
  );

  const createAppointment = useCallback(
    async (payload: AdminCreateAppointmentRequest) => {
      const created = await adminApi.createAppointment(payload);
      setSelectedAppt(created);
      toast('Запись создана');
      await loadData();
      return created;
    },
    [loadData, toast]
  );

  const updateAppointment = useCallback(
    async (id: string, payload: AdminUpdateAppointmentRequest) => {
      const updated = await adminApi.updateAppointment(id, payload);
      setSelectedAppt((prev) => updated || (prev?.id === id ? { ...prev, ...payload } : prev));
      toast('Изменения сохранены');
      await loadData();
      return updated;
    },
    [loadData, toast]
  );

  const openCancelModal = useCallback((appt: Appointment) => {
    setCancelReason('По просьбе клиента');
    setCancelError(null);
    setCancelAppt(appt);
  }, []);

  const closeCancelModal = useCallback(() => {
    setCancelAppt(null);
    setCancelError(null);
  }, []);

  const confirmCancelAppt = useCallback(async () => {
    if (!cancelAppt) return;
    if (!cancelReason.trim()) {
      setCancelError('Укажите причину отмены');
      return;
    }
    setIsCancelling(true);
    setCancelError(null);
    try {
      const payload: AdminUpdateAppointmentRequest = {
        status: 'CANCELLED',
        cancelReason: cancelReason.trim(),
      };
      const updated = await adminApi.updateAppointment(cancelAppt.id, payload);
      setSelectedAppt(updated || { ...cancelAppt, ...payload });
      setCancelAppt(null);
      toast('Запись отменена');
      await loadData();
    } catch (err: unknown) {
      setCancelError(formatApiError(err, 'Ошибка при отмене записи'));
    } finally {
      setIsCancelling(false);
    }
  }, [cancelAppt, cancelReason, loadData, toast]);

  const openDeleteModal = useCallback((appt: Appointment) => {
    setDeleteError(null);
    setDeleteAppt(appt);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteAppt(null);
    setDeleteError(null);
  }, []);

  const confirmDeleteAppt = useCallback(async () => {
    if (!deleteAppt) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteAppointment(deleteAppt.id);
      if (selectedAppt?.id === deleteAppt.id) setSelectedAppt(null);
      setDeleteAppt(null);
      toast('Запись удалена');
      await loadData();
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка при удалении записи'));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteAppt, selectedAppt?.id, loadData, toast]);

  return {
    appointments, totalElements, totalPages, page, setPage, pageSize, setPageSize,
    veterinarians: enrichedVeterinarians, services, speciesList, pets, users,
    loading, error, reload: reloadAll,
    statusFilters, toggleStatusFilter,
    vetFilter, setVetFilter,
    petFilter, setPetFilter,
    ownerFilter, setOwnerFilter,
    serviceFilter, setServiceFilter,
    dateFrom, setDateFrom, dateTo, setDateTo,
    activeFilters, resetFilters,
    selectedAppt, setSelectedAppt,
    isCreateOpen, setIsCreateOpen,
    editAppt, setEditAppt,
    cancelAppt, cancelReason, setCancelReason, isCancelling, cancelError,
    openCancelModal, closeCancelModal, confirmCancelAppt,
    deleteAppt, isDeleting, deleteError,
    openDeleteModal, closeDeleteModal, confirmDeleteAppt,
    checkSlotAvailability, createAppointment, updateAppointment,
  };
}
