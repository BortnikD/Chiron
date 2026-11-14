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
import { formatApiError, mapWithConcurrency } from '@/shared/lib';
import { useResourceList } from '@/shared/hooks';
import { buildActiveFilterChips, nextMoscowDayIso } from '../_components/utils';

export interface AdminAppointmentsFiltersState {
  statusFilters: AppointmentStatus[];
  vetFilter: string;
  petFilter: string;
  ownerFilter: string;
  serviceFilter: string;
  dateFrom: string;
  dateTo: string;
}

export function useAdminAppointments() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const initialSel = searchParams.get('sel');
  const initialPetId = searchParams.get('petId') || 'ALL';
  const initialOwnerId = searchParams.get('ownerId') || 'ALL';
  const initialVetId = searchParams.get('veterinarianId') || 'ALL';
  const initialServiceId = searchParams.get('serviceId') || 'ALL';

  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<User[]>([]);

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

  const refsReqIdRef = useRef(0);
  const appliedInitialSelRef = useRef<string | null>(null);
  const petsRef = useRef<Pet[]>(pets);
  petsRef.current = pets;
  const usersRef = useRef<User[]>(users);
  usersRef.current = users;

  const resource = useResourceList<Appointment, AdminAppointmentsFiltersState>({
    fetcher: async ({ page, pageSize, filters }, signal) => {
      const fromIso = filters.dateFrom
        ? new Date(`${filters.dateFrom}T00:00:00+03:00`).toISOString()
        : undefined;
      const toIso = filters.dateTo
        ? new Date(`${nextMoscowDayIso(filters.dateTo)}T00:00:00+03:00`).toISOString()
        : undefined;

      return adminApi.getAppointments(
        page,
        pageSize,
        {
          status: filters.statusFilters.length > 0 ? filters.statusFilters : undefined,
          veterinarianId: filters.vetFilter !== 'ALL' ? filters.vetFilter : undefined,
          petId: filters.petFilter !== 'ALL' ? filters.petFilter : undefined,
          ownerId: filters.ownerFilter !== 'ALL' ? filters.ownerFilter : undefined,
          serviceId: filters.serviceFilter !== 'ALL' ? filters.serviceFilter : undefined,
          from: fromIso,
          to: toIso,
        },
        { signal }
      );
    },
    initialFilters: {
      statusFilters: [],
      vetFilter: initialVetId,
      petFilter: initialPetId,
      ownerFilter: initialOwnerId,
      serviceFilter: initialServiceId,
      dateFrom: '',
      dateTo: '',
    },
    urlSyncKeys: [
      'vetFilter',
      'petFilter',
      'ownerFilter',
      'serviceFilter',
      'statusFilters',
      'dateFrom',
      'dateTo',
    ],
    defaultPageSize: 25,
    onSuccess: async ({ items }) => {
      // Подгружаем недостающих питомцев и владельцев для строк текущей страницы
      const missingPetIds = Array.from(
        new Set(items.map((a) => a.petId).filter((id): id is string => Boolean(id)))
      ).filter((id) => !petsRef.current.some((p) => p.id === id));

      let mergedPets = petsRef.current;
      if (missingPetIds.length > 0) {
        try {
          const fetchedPets = await mapWithConcurrency(
            missingPetIds,
            (id) => adminApi.getPetById(id).catch(() => null),
            4
          );
          const validPets = fetchedPets.filter((p): p is Pet => p !== null);
          if (validPets.length > 0) {
            setPets((prev) => {
              const prevIds = new Set(prev.map((p) => p.id));
              const next = [...prev];
              for (const p of validPets) {
                if (!prevIds.has(p.id)) next.push(p);
              }
              return next;
            });
            mergedPets = [...mergedPets, ...validPets];
          }
        } catch {
          // ignore
        }
      }

      const missingOwnerIds = Array.from(
        new Set(mergedPets.map((p) => p.ownerId).filter((id): id is string => Boolean(id)))
      ).filter((id) => !usersRef.current.some((u) => u.id === id));

      if (missingOwnerIds.length > 0) {
        try {
          const fetchedUsers = await mapWithConcurrency(
            missingOwnerIds,
            (id) => adminApi.getUserById(id).catch(() => null),
            4
          );
          const validUsers = fetchedUsers.filter((u): u is User => u !== null);
          if (validUsers.length > 0) {
            setUsers((prev) => {
              const prevIds = new Set(prev.map((u) => u.id));
              const next = [...prev];
              for (const u of validUsers) {
                if (!prevIds.has(u.id)) next.push(u);
              }
              return next;
            });
          }
        } catch {
          // ignore
        }
      }

      if (initialSel && appliedInitialSelRef.current !== initialSel) {
        appliedInitialSelRef.current = initialSel;
        const foundInPage = items.find((a) => a.id === initialSel);
        if (foundInPage) {
          setSelectedAppt(foundInPage);
        } else {
          adminApi.getAppointmentById(initialSel).then(setSelectedAppt).catch(() => {});
        }
      } else {
        setSelectedAppt((prev) => (prev ? items.find((a) => a.id === prev.id) ?? prev : null));
      }
    },
  });

  const loadRefs = useCallback(async () => {
    const reqId = ++refsReqIdRef.current;
    try {
      const [vetsRes, svcsRes, speciesRes, allPets, allClients] = await Promise.all([
        adminApi.getVeterinarians(),
        adminApi.getServices(),
        clinicApi.getSpecies(),
        adminApi.getPets(0, 100).then((r) => r?.items || []),
        adminApi.getUsers(0, 100, 'CLIENT').then((r) => r?.items || []),
      ]);
      if (reqId !== refsReqIdRef.current) return;
      setVeterinarians(Array.isArray(vetsRes) ? vetsRes : []);
      setServices(Array.isArray(svcsRes) ? svcsRes : []);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);

      const safePets = Array.isArray(allPets) ? [...allPets] : [];
      const safeUsers = Array.isArray(allClients) ? [...allClients] : [];

      if (initialPetId && initialPetId !== 'ALL' && !safePets.some((p) => p.id === initialPetId)) {
        try {
          const p = await adminApi.getPetById(initialPetId);
          if (p) safePets.push(p);
        } catch {
          // ignore
        }
      }
      if (initialOwnerId && initialOwnerId !== 'ALL' && !safeUsers.some((u) => u.id === initialOwnerId)) {
        try {
          const u = await adminApi.getUserById(initialOwnerId);
          if (u) safeUsers.push(u);
        } catch {
          // ignore
        }
      }

      setPets(safePets);
      setUsers(safeUsers);
    } catch {
      // ignore
    }
  }, [initialPetId, initialOwnerId]);

  useEffect(() => {
    void loadRefs();
    return () => {
      refsReqIdRef.current += 1;
    };
  }, [loadRefs]);

  const toggleStatusFilter = useCallback(
    (st: AppointmentStatus) => {
      resource.setFilter(
        'statusFilters',
        resource.filters.statusFilters.includes(st)
          ? resource.filters.statusFilters.filter((item) => item !== st)
          : [...resource.filters.statusFilters, st]
      );
    },
    [resource]
  );

  const enrichedVeterinarians = useMemo(
    () => veterinarians.map((v) => (v.user ? v : { ...v, user: users.find((u) => u.id === v.userId) })),
    [veterinarians, users]
  );

  const activeFilters = useMemo(
    () =>
      buildActiveFilterChips({
        vetFilter: resource.filters.vetFilter,
        petFilter: resource.filters.petFilter,
        ownerFilter: resource.filters.ownerFilter,
        serviceFilter: resource.filters.serviceFilter,
        statusFilters: resource.filters.statusFilters,
        dateFrom: resource.filters.dateFrom,
        dateTo: resource.filters.dateTo,
        veterinarians: enrichedVeterinarians,
        pets,
        users,
        services,
        setVetFilter: (v) => resource.setFilter('vetFilter', v),
        setPetFilter: (v) => resource.setFilter('petFilter', v),
        setOwnerFilter: (v) => resource.setFilter('ownerFilter', v),
        setServiceFilter: (v) => resource.setFilter('serviceFilter', v),
        toggleStatusFilter,
        setDateFrom: (v) => resource.setFilter('dateFrom', v),
        setDateTo: (v) => resource.setFilter('dateTo', v),
      }),
    [
      resource,
      enrichedVeterinarians,
      pets,
      users,
      services,
      toggleStatusFilter,
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
      await resource.reload();
      return created;
    },
    [resource, toast]
  );

  const updateAppointment = useCallback(
    async (id: string, payload: AdminUpdateAppointmentRequest) => {
      const updated = await adminApi.updateAppointment(id, payload);
      setSelectedAppt((prev) => updated || (prev?.id === id ? { ...prev, ...payload } : prev));
      toast('Изменения сохранены');
      await resource.reload();
      return updated;
    },
    [resource, toast]
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
      await resource.reload();
    } catch (err: unknown) {
      setCancelError(formatApiError(err, 'Ошибка при отмене записи'));
    } finally {
      setIsCancelling(false);
    }
  }, [cancelAppt, cancelReason, resource, toast]);

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
      await resource.reload();
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка при удалении записи'));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteAppt, selectedAppt, resource, toast]);

  return {
    appointments: resource.items,
    totalElements: resource.totalElements,
    totalPages: resource.totalPages,
    page: resource.page,
    setPage: resource.setPage,
    pageSize: resource.pageSize,
    setPageSize: resource.setPageSize,
    veterinarians: enrichedVeterinarians,
    services,
    speciesList,
    pets,
    users,
    loading: resource.loading,
    error: resource.error,
    reload: resource.reload,
    reloadAll: useCallback(() => {
      void loadRefs();
      void resource.reload();
    }, [loadRefs, resource]),
    statusFilters: resource.filters.statusFilters,
    toggleStatusFilter,
    vetFilter: resource.filters.vetFilter,
    setVetFilter: useCallback((v: string) => resource.setFilter('vetFilter', v), [resource]),
    petFilter: resource.filters.petFilter,
    setPetFilter: useCallback((v: string) => resource.setFilter('petFilter', v), [resource]),
    ownerFilter: resource.filters.ownerFilter,
    setOwnerFilter: useCallback((v: string) => resource.setFilter('ownerFilter', v), [resource]),
    serviceFilter: resource.filters.serviceFilter,
    setServiceFilter: useCallback((v: string) => resource.setFilter('serviceFilter', v), [resource]),
    dateFrom: resource.filters.dateFrom,
    setDateFrom: useCallback((v: string) => resource.setFilter('dateFrom', v), [resource]),
    dateTo: resource.filters.dateTo,
    setDateTo: useCallback((v: string) => resource.setFilter('dateTo', v), [resource]),
    resetFilters: resource.resetFilters,
    activeFilters,
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
    paginationProps: resource.paginationProps,
  };
}
