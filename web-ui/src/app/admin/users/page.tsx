'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { AlertCircle, Stethoscope } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/shared/components';
import { useAdminUsers } from './_hooks/useAdminUsers';
import { AdminUsersFilters } from './_components/AdminUsersFilters';
import { AdminUsersTable } from './_components/AdminUsersTable';
import { AdminUserDetailIsland } from './_components/AdminUserDetailIsland';
import { AdminCreateUserModal } from './_components/AdminCreateUserModal';
import { AdminEditUserModal } from './_components/AdminEditUserModal';

function AdminUsersContent() {
  const vm = useAdminUsers();
  const selectedName = vm.selectedUser
    ? vm.selectedUser.fullName || `${vm.selectedUser.firstName} ${vm.selectedUser.lastName}`
    : undefined;

  useShellHeader({
    crumbGroup: 'Клиенты и доступ',
    crumb: 'Пользователи',
    crumb2: selectedName,
  });

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
            createdFrom={vm.createdFrom}
            onCreatedFromChange={vm.setCreatedFrom}
            createdTo={vm.createdTo}
            onCreatedToChange={vm.setCreatedTo}
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
            veterinarians={vm.veterinarians}
            speciesList={vm.speciesList}
            services={vm.services}
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

      {vm.vetOfferUser && (
        <div className="overlay" onClick={vm.closeVetOffer}>
          <div
            className="dialog dialog-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vet-offer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <span id="vet-offer-title" className="dialog-title">
                Создать профиль врача?
              </span>
              <span className="dialog-desc">
                {vm.vetOfferUser.fullName || vm.vetOfferUser.email} получил роль ветеринара. Чтобы
                он появился в каталоге и мог вести приём, нужен профиль: специализация, стаж и
                допуски к видам.
              </span>
            </div>
            <div className="dialog-foot">
              <button type="button" className="btn btn-outline" onClick={vm.closeVetOffer}>
                Позже
              </button>
              <Link
                href={`/admin/veterinarians?userId=${vm.vetOfferUser.id}`}
                className="btn btn-primary"
                onClick={vm.closeVetOffer}
              >
                <Stethoscope size={16} />
                Создать профиль
              </Link>
            </div>
          </div>
        </div>
      )}

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

/**
 * Страница управления пользователями администратором клиники.
 */
export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="island grow">
          <div className="empty">
            <span className="spinner" aria-hidden="true" />
            <span className="muted">Загрузка пользователей…</span>
          </div>
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}
