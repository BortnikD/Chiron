'use client';

import { AlertCircle } from 'lucide-react';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { useAdminUsers } from './_hooks/useAdminUsers';
import { AdminUsersFilters } from './_components/AdminUsersFilters';
import { AdminUsersTable } from './_components/AdminUsersTable';
import { AdminUserDetailIsland } from './_components/AdminUserDetailIsland';
import { AdminCreateUserModal } from './_components/AdminCreateUserModal';
import { AdminEditUserModal } from './_components/AdminEditUserModal';

/**
 * Страница управления пользователями администратором клиники.
 */
export default function AdminUsersPage() {
  const vm = useAdminUsers();

  return (
    <>
      {vm.error && (
        <div
          className="alert alert-destructive row between"
          role="alert"
          style={{ alignItems: 'center', marginBottom: 'var(--gap)' }}
        >
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} className="ic" />
            <span>{vm.error}</span>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void vm.reload()}>
            Повторить
          </button>
        </div>
      )}

      <div className="content-row">
        <div className="content-col grow">
          <AdminUsersFilters
            roleFilter={vm.roleFilter}
            onRoleFilterChange={vm.setRoleFilter}
            search={vm.search}
            onSearchChange={vm.setSearch}
            onCreateClick={() => vm.setIsCreateOpen(true)}
          />

          <AdminUsersTable
            users={vm.users}
            selectedUser={vm.selectedUser}
            loading={vm.loading}
            onSelectUser={vm.setSelectedUser}
          />
        </div>

        {vm.selectedUser && (
          <AdminUserDetailIsland
            user={vm.selectedUser}
            pets={vm.userPets}
            appointments={vm.userAppointments}
            loadingDetails={vm.loadingDetails}
            detailsError={vm.detailsError}
            onClose={() => vm.setSelectedUser(null)}
            onDeleteClick={vm.openDeleteConfirm}
            onEditClick={() => vm.setIsEditOpen(true)}
            onSaveProfile={vm.updateUser}
          />
        )}
      </div>

      <AdminCreateUserModal
        isOpen={vm.isCreateOpen}
        onClose={() => vm.setIsCreateOpen(false)}
        onCreateUser={vm.createUser}
      />

      <AdminEditUserModal
        isOpen={vm.isEditOpen}
        user={vm.selectedUser}
        onClose={() => vm.setIsEditOpen(false)}
        onUpdateUser={vm.updateUser}
      />

      <ConfirmModal
        isOpen={vm.isDeleteConfirmOpen && Boolean(vm.selectedUser)}
        title="Удалить пользователя?"
        description={
          vm.selectedUser
            ? `Пользователь «${vm.selectedUser.fullName || vm.selectedUser.email}» будет безвозвратно удалён. Связанные данные могут стать недоступны.`
            : undefined
        }
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        tone="destructive"
        loading={vm.deleting}
        error={vm.deleteError}
        onClose={vm.closeDeleteConfirm}
        onConfirm={vm.handleDeleteUser}
      />
    </>
  );
}
