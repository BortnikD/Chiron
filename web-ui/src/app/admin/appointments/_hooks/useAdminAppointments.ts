'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type {
  AdminCreateAppointmentRequest,
  AdminUpdateAppointmentRequest,
} from '@/modules/admin/types';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian, Service, Species } from '@/modules/clinic/types';
import type { AppointmentStatus, User } from '@/shared/types';
import { formatApiError, getMoscowDateKey } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export const CANCEL_REASONS = [
  'По просьбе клиента',
  'Врач не может принять',
  'Питомец выздоровел',
  'Ошибка при записи',
  'Клиент не выходит на связь',
];

function nextMoscowDayIso(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0)).toISOString().slice(0, 10);
}

export function useAdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);

  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilterState] = useState<string>('ALL');
  const [vetFilter, setVetFilterState] = useState<string>('ALL');
  const [speciesFilter, setSpeciesFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
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

  const loadData = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const fromIso = dateFrom ? new Date(`${dateFrom}T00:00:00+03:00`).toISOString() : undefined;
      const toIso = dateTo
        ? new Date(`${nextMoscowDayIso(dateTo)}T00:00:00+03:00`).toISOString()
        : undefined;

      const [apptsRes, vetsRes, svcsRes, speciesRes, petsRes, usersRes] = await Promise.all([
        adminApi.getAppointments(page, 100, {
          status: statusFilter !== 'ALL' ? (statusFilter as AppointmentStatus) : undefined,
          veterinarianId: vetFilter !== 'ALL' ? vetFilter : undefined,
          from: fromIso,
          to: toIso,
        }),
        adminApi.getVeterinarians(),
        clinicApi.getServices(),
        clinicApi.getSpecies(),
        adminApi.getPets(0, 100),
        adminApi.getUsers(0, 100),
      ]);

      if (reqId !== requestIdRef.current) return;

      const appts = apptsRes?.items || [];
      setAppointments(appts);
      setTotalElements(apptsRes?.totalElements ?? appts.length);
      setTotalPages(apptsRes?.totalPages ?? 1);
      setVeterinarians(Array.isArray(vetsRes) ? vetsRes : []);
      setServices(Array.isArray(svcsRes) ? svcsRes : []);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setPets(petsRes?.items || []);
      setUsers(usersRes?.items || []);

      setSelectedAppt((prev) => (prev ? appts.find((a) => a.id === prev.id) ?? null : null));
    } catch (err: unknown) {
      if (reqId !== requestIdRef.current) return;
      setError(formatApiError(err, 'Не удалось загрузить список записей на приём.'));
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [page, statusFilter, vetFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadData]);

  const setStatusFilter = useCallback((v: string) => {
    setPage(0);
    setStatusFilterState(v);
  }, []);

  const setVetFilter = useCallback((v: string) => {
    setPage(0);
    setVetFilterState(v);
  }, []);

  const setDateFrom = useCallback((v: string) => {
    setPage(0);
    setDateFromState(v);
  }, []);

  const setDateTo = useCallback((v: string) => {
    setPage(0);
    setDateToState(v);
  }, []);

  const enrichedVeterinarians = useMemo(
    () =>
      veterinarians.map((v) =>
        v.user ? v : { ...v, user: users.find((u) => u.id === v.userId) }
      ),
    [veterinarians, users]
  );

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const p = pets.find((item) => item.id === a.petId);
      if (speciesFilter !== 'ALL' && (!p || p.speciesId !== speciesFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const sName = (services.find((s) => s.id === a.serviceId)?.name || 'Услуга клиники').toLowerCase();
        const vet = enrichedVeterinarians.find((v) => v.id === a.veterinarianId);
        const vName = getDoctorDisplay(vet).fullName.toLowerCase();
        const pName = (p?.name || '').toLowerCase();
        const oName = (users.find((u) => u.id === p?.ownerId)?.fullName || '').toLowerCase();
        if (!sName.includes(q) && !vName.includes(q) && !pName.includes(q) && !oName.includes(q)) {
          return false;
        }
      }
      const mskDate = getMoscowDateKey(a.startAt);
      if (dateFrom && mskDate < dateFrom) return false;
      if (dateTo && mskDate > dateTo) return false;
      return true;
    });
  }, [appointments, speciesFilter, search, dateFrom, dateTo, pets, services, enrichedVeterinarians, users]);

  const checkSlotAvailability = useCallback(
    async (params: {
      veterinarianId: string;
      startAt: string;
      endAt: string;
      excludeAppointmentId?: string;
    }) => clinicApi.checkAvailability(params),
    []
  );

  const createAppointment = useCallback(
    async (payload: AdminCreateAppointmentRequest) => {
      const created = await adminApi.createAppointment(payload);
      setSelectedAppt(created);
      await loadData();
      return created;
    },
    [loadData]
  );

  const updateAppointment = useCallback(
    async (id: string, payload: AdminUpdateAppointmentRequest) => {
      const updated = await adminApi.updateAppointment(id, payload);
      setSelectedAppt((prev) =>
        updated || (prev?.id === id ? { ...prev, ...payload } : prev)
      );
      await loadData();
      return updated;
    },
    [loadData]
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
      await loadData();
    } catch (err: unknown) {
      setCancelError(formatApiError(err, 'Ошибка при отмене записи'));
    } finally {
      setIsCancelling(false);
    }
  }, [cancelAppt, cancelReason, loadData]);

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
      await loadData();
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка при удалении записи'));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteAppt, selectedAppt?.id, loadData]);

  return {
    appointments: filteredAppointments,
    totalElements,
    totalPages,
    page,
    setPage,
    veterinarians: enrichedVeterinarians,
    services,
    speciesList,
    pets,
    users,
    loading,
    error,
    reload: loadData,
    statusFilter,
    setStatusFilter,
    vetFilter,
    setVetFilter,
    speciesFilter,
    setSpeciesFilter,
    search,
    setSearch,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    selectedAppt,
    setSelectedAppt,
    isCreateOpen,
    setIsCreateOpen,
    editAppt,
    setEditAppt,
    cancelAppt,
    cancelReason,
    setCancelReason,
    isCancelling,
    cancelError,
    openCancelModal,
    closeCancelModal,
    confirmCancelAppt,
    deleteAppt,
    isDeleting,
    deleteError,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteAppt,
    checkSlotAvailability,
    createAppointment,
    updateAppointment,
  };
}
