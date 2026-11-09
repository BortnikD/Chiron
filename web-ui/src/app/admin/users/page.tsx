'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { adminApi } from '../../../api';
import { User, UserRole } from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import {
  AdminUsersFilters,
  AdminUsersTable,
  AdminUserDetailIsland,
  AdminCreateUserModal,
  AdminEditUserModal,
  AdminDeleteUserModal,
} from './_components';

/**
 * Страница управления пользователями администратором клиники.
 * Реализует поиск, фильтрацию по ролям, создание, просмотр деталей и удаление аккаунтов.
 */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Selected User for Master-Detail panel
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(
        0,
        100,
        roleFilter !== 'ALL' ? (roleFilter as UserRole) : undefined
      );
      const items = res?.items || [];
      setUsers(items);

      if (selectedUser) {
        const updated = items.find((u: User) => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (err) {
      console.error('Failed to load users', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(selectedUser.id);
      setIsDeleteConfirmOpen(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Ошибка при удалении пользователя');
    } finally {
      setDeleting(false);
    }
  };

  const handleUserCreated = async (created: User) => {
    await loadUsers();
    if (created) setSelectedUser(created);
  };

  const handleUserUpdated = async () => {
    await loadUsers();
  };

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

  return (
    <AppShell crumbGroup="Клиника" crumb="Пользователи">
      <div className="content-row">
        {/* Left Column: Filters + Table */}
        <div className="content-col grow">
          <AdminUsersFilters
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            search={search}
            onSearchChange={setSearch}
            onCreateClick={() => setIsCreateOpen(true)}
          />

          <AdminUsersTable
            users={filteredUsers}
            selectedUser={selectedUser}
            loading={loading}
            onSelectUser={setSelectedUser}
          />
        </div>

        {/* Right Column: Master-Detail Island */}
        {selectedUser && (
          <AdminUserDetailIsland
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onDeleteClick={() => setIsDeleteConfirmOpen(true)}
            onEditClick={() => setIsEditOpen(true)}
            onUserUpdated={handleUserUpdated}
          />
        )}
      </div>

      {/* Modals */}
      <AdminCreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleUserCreated}
      />

      <AdminEditUserModal
        isOpen={isEditOpen}
        user={selectedUser}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleUserUpdated}
      />

      <AdminDeleteUserModal
        isOpen={isDeleteConfirmOpen}
        user={selectedUser}
        deleting={deleting}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteUser}
      />
    </AppShell>
  );
}
