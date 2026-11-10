'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { adminApi } from '@/modules/admin/api';
import type { Pet, Appointment } from '@/modules/client/types';
import { formatApiError } from '@/shared/lib';
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadReqIdRef = useRef(0);
  const detailsReqIdRef = useRef(0);

  const loadUsers = useCallback(async () => {
    const reqId = ++loadReqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers(
        0,
        100,
        roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined
      );
      if (loadReqIdRef.current !== reqId) return;
      const items = res?.items || [];
      setUsers(items);
      setSelectedUser((prev) => (prev ? items.find((u) => u.id === prev.id) ?? null : null));
    } catch (err: unknown) {
      if (loadReqIdRef.current !== reqId) return;
      setError(formatApiError(err, 'Не удалось загрузить пользователей'));
    } finally {
      if (loadReqIdRef.current === reqId) setLoading(false);
    }
  }, [roleFilter]);

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
      setSelectedUser(null);
      await loadUsers();
    } catch (err: unknown) {
      setDeleteError(formatApiError(err, 'Ошибка при удалении пользователя'));
    } finally {
      setDeleting(false);
    }
  }, [selectedUser, loadUsers]);

  const createUser = useCallback(
    async (data: CreateUserInput): Promise<User> => {
      const created = await adminApi.createUser(data);
      await loadUsers();
      setSelectedUser(created);
      return created;
    },
    [loadUsers]
  );

  const updateUser = useCallback(
    async (id: string, data: Partial<User>): Promise<User> => {
      const updated = await adminApi.updateUser(id, data);
      await loadUsers();
      setSelectedUser((prev) => (prev?.id === id ? updated : prev));
      return updated;
    },
    [loadUsers]
  );

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) => {
      const name = (u.fullName || `${u.firstName} ${u.lastName}`).toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [users, search]);

  return {
    users: filteredUsers,
    loading,
    error,
    reload: loadUsers,
    roleFilter,
    setRoleFilter,
    search,
    setSearch,
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
