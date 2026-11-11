'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '@/modules/admin/api';
import { clinicApi } from '@/modules/clinic/api';
import type { Pet, Appointment } from '@/modules/client/types';
import type { Service, Species, Veterinarian } from '@/modules/clinic/types';
import { useToast } from '@/shared/components';
import { fetchAllPages, formatApiError, getMoscowDateKey } from '@/shared/lib';
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

export function useAdminUsers() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const initialSel = searchParams.get('sel');

  const [users, setUsers] = useState<User[]>([]);
  const [veterinarians, setVeterinarians] = useState<Veterinarian[]>([]);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
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

  const loadReqIdRef = useRef(0);
  const detailsReqIdRef = useRef(0);
  const appliedSelRef = useRef<string | null>(null);

  const loadUsers = useCallback(async () => {
    const reqId = ++loadReqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const [items, vetsRes, speciesRes, servicesRes] = await Promise.all([
        fetchAllPages(
          (p, s) => adminApi.getUsers(p, s, roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined),
          { pageSize: 100, maxPages: 50, concurrency: 4 }
        ),
        adminApi.getVeterinarians(),
        clinicApi.getSpecies(),
        adminApi.getServices(),
      ]);
      if (loadReqIdRef.current !== reqId) return;
      setUsers(items);
      setVeterinarians(
        (Array.isArray(vetsRes) ? vetsRes : []).map((v) =>
          v.user ? v : { ...v, user: items.find((u) => u.id === v.userId) }
        )
      );
      setSpeciesList(Array.isArray(speciesRes) ? speciesRes : []);
      setServices(Array.isArray(servicesRes) ? servicesRes : []);

      if (initialSel && appliedSelRef.current !== initialSel) {
        appliedSelRef.current = initialSel;
        const found = items.find((u) => u.id === initialSel);
        if (found) {
          setSelectedUser(found);
        } else {
          try {
            const byId = await adminApi.getUserById(initialSel);
            if (loadReqIdRef.current === reqId && byId) setSelectedUser(byId);
          } catch {
            // ignore missing target
          }
        }
      } else {
        setSelectedUser((prev) => (prev ? items.find((u) => u.id === prev.id) ?? prev : null));
      }
    } catch (err: unknown) {
      if (loadReqIdRef.current !== reqId) return;
      setError(formatApiError(err, 'Не удалось загрузить пользователей'));
    } finally {
      if (loadReqIdRef.current === reqId) setLoading(false);
    }
  }, [roleFilter, initialSel]);

  useEffect(() => {
    void loadUsers();
    return () => {
      loadReqIdRef.current += 1;
    };
  }, [loadUsers]);

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
      await loadUsers();
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка при удалении пользователя'));
    } finally {
      setDeleting(false);
    }
  }, [selectedUser, loadUsers, toast]);

  const createUser = useCallback(
    async (data: CreateUserInput): Promise<User> => {
      const created = await adminApi.createUser(data);
      toast('Пользователь создан', created.fullName || created.email);
      await loadUsers();
      setSelectedUser(created);
      if (created.role === 'VETERINARIAN') {
        setVetOfferUser(created);
      }
      return created;
    },
    [loadUsers, toast]
  );

  const updateUser = useCallback(
    async (id: string, data: Partial<User>): Promise<User> => {
      const updated = await adminApi.updateUser(id, data);
      toast('Данные пользователя сохранены');
      await loadUsers();
      setSelectedUser((prev) => (prev?.id === id ? updated : prev));
      return updated;
    },
    [loadUsers, toast]
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (q) {
        const name = (u.fullName || `${u.firstName} ${u.lastName}`).toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
      }
      const createdIso = getMoscowDateKey(u.createdAt);
      if (createdFrom && (!createdIso || createdIso < createdFrom)) return false;
      if (createdTo && (!createdIso || createdIso > createdTo)) return false;
      return true;
    });
  }, [users, search, createdFrom, createdTo]);

  return {
    users: filteredUsers,
    veterinarians,
    speciesList,
    services,
    loading,
    error,
    reload: loadUsers,
    roleFilter,
    setRoleFilter,
    search,
    setSearch,
    createdFrom,
    setCreatedFrom,
    createdTo,
    setCreatedTo,
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
  };
}
