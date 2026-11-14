'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet, Appointment } from '@/modules/client/types';
import type { Service, Species, Veterinarian } from '@/modules/clinic/types';
import { useToast } from '@/shared/components';
import { formatApiError, nextMoscowDayIso } from '@/shared/lib';
import { useResourceList } from '@/shared/hooks';
import type { User, UserRole } from '@/shared/types';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  middleName?: string;
}

export interface AdminUsersFiltersState {
  roleFilter: string;
  search: string;
  createdFrom: string;
  createdTo: string;
}

export function useAdminUsers() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initialSel = searchParams.get('sel');

  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [vetOfferUser, setVetOfferUser] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const detailsReqIdRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);

  const resource = useResourceList<User, AdminUsersFiltersState>({
    fetcher: async ({ page, pageSize, filters }, signal) => {
      const createdFromIso = filters.createdFrom
        ? new Date(`${filters.createdFrom}T00:00:00+03:00`).toISOString()
        : undefined;
      const createdToIso = filters.createdTo
        ? new Date(`${nextMoscowDayIso(filters.createdTo)}T00:00:00+03:00`).toISOString()
        : undefined;

      return adminApi.getUsers(
        page,
        pageSize,
        {
          role: filters.roleFilter !== 'ALL' ? (filters.roleFilter as UserRole) : undefined,
          search: filters.search || undefined,
          createdFrom: createdFromIso,
          createdTo: createdToIso,
        },
        { signal }
      );
    },
    initialFilters: {
      roleFilter: 'ALL',
      search: '',
      createdFrom: '',
      createdTo: '',
    },
    urlSyncKeys: ['roleFilter', 'search', 'createdFrom', 'createdTo'],
    defaultPageSize: 20,
    debouncedKeys: ['search'],
    debounceMs: 250,
    onSuccess: ({ items }) => {
      if (initialSel && appliedSelRef.current !== initialSel) {
        appliedSelRef.current = initialSel;
        const found = items.find((u) => u.id === initialSel);
        if (found) {
          setSelectedUser(found);
        } else {
          adminApi.getUserById(initialSel).then(setSelectedUser).catch(() => {});
        }
      } else {
        setSelectedUser((prev) => (prev ? items.find((u) => u.id === prev.id) ?? prev : null));
      }
    },
  });

  const loadRefs = useCallback(async () => {
    try {
      const [vetsRes, speciesRes, servicesRes] = await Promise.all([
        adminApi.getVeterinarians(),
        clinicApi.getSpecies(),
        adminApi.getServices(),
      ]);
      setVeterinarians(Array.isArray(vetsRes) ? vetsRes : []);
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setServices(Array.isArray(servicesRes) ? servicesRes : []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  const loadUserDetails = useCallback(async (userId: string) => {
    const reqId = ++detailsReqIdRef.current;
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const [petsRes, apptsRes] = await Promise.all([
        adminApi.getPets(0, 50, { ownerId: userId }),
        adminApi.getAppointments(0, 50, { ownerId: userId }),
      ]);
      if (detailsReqIdRef.current !== reqId) return;
      setUserPets(petsRes?.items || []);
      setUserAppointments(apptsRes?.items || []);
    } catch (err: unknown) {
      if (detailsReqIdRef.current !== reqId) return;
      setUserPets([]);
      setUserAppointments([]);
      setDetailsError(
        formatApiError(err, 'Не удалось загрузить связанные данные пользователя')
      );
    } finally {
      if (detailsReqIdRef.current === reqId) setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedUser?.id) {
      detailsReqIdRef.current += 1;
      setUserPets([]);
      setUserAppointments([]);
      setDetailsError(null);
      setLoadingDetails(false);
      return;
    }
    void loadUserDetails(selectedUser.id);
    return () => {
      detailsReqIdRef.current += 1;
    };
  }, [selectedUser?.id, loadUserDetails]);

  const openDeleteConfirm = useCallback(() => {
    setDeleteError(null);
    setIsDeleteConfirmOpen(true);
  }, []);

  const closeDeleteConfirm = useCallback(() => {
    if (!deleting) {
      setIsDeleteConfirmOpen(false);
      setDeleteError(null);
    }
  }, [deleting]);

  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteUser(selectedUser.id);
      setIsDeleteConfirmOpen(false);
      toast('Пользователь удалён');
      setSelectedUser(null);
      await resource.reload();
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка при удалении пользователя'));
    } finally {
      setDeleting(false);
    }
  }, [selectedUser, resource, toast]);

  const createUser = useCallback(
    async (data: CreateUserInput): Promise<User> => {
      const created = await adminApi.createUser(data);
      toast('Пользователь создан', created.fullName || created.email);
      await resource.reload();
      setSelectedUser(created);
      if (created.role === 'VETERINARIAN') {
        setVetOfferUser(created);
      }
      return created;
    },
    [resource, toast]
  );

  const updateUser = useCallback(
    async (id: string, data: Partial<User>): Promise<User> => {
      const updated = await adminApi.updateUser(id, data);
      toast('Данные пользователя сохранены');
      await resource.reload();
      setSelectedUser((prev) => (prev?.id === id ? updated : prev));
      return updated;
    },
    [resource, toast]
  );

  return {
    users: resource.items,
    totalElements: resource.totalElements,
    totalPages: resource.totalPages,
    page: resource.page,
    setPage: resource.setPage,
    pageSize: resource.pageSize,
    setPageSize: resource.setPageSize,
    veterinarians,
    speciesList,
    services,
    loading: resource.loading,
    error: resource.error,
    reload: resource.reload,
    roleFilter: resource.filters.roleFilter,
    setRoleFilter: useCallback((val: string) => resource.setFilter('roleFilter', val), [resource]),
    search: resource.filters.search,
    setSearch: useCallback((val: string) => resource.setFilter('search', val), [resource]),
    createdFrom: resource.filters.createdFrom,
    setCreatedFrom: useCallback((val: string) => resource.setFilter('createdFrom', val), [resource]),
    createdTo: resource.filters.createdTo,
    setCreatedTo: useCallback((val: string) => resource.setFilter('createdTo', val), [resource]),
    selectedUser,
    setSelectedUser,
    userPets,
    userAppointments,
    loadingDetails,
    detailsError,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    vetOfferUser,
    closeVetOffer: useCallback(() => setVetOfferUser(null), []),
    isDeleteConfirmOpen,
    openDeleteConfirm,
    closeDeleteConfirm,
    deleting,
    deleteError,
    handleDeleteUser,
    createUser,
    updateUser,
    paginationProps: resource.paginationProps,
  };
}
