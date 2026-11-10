'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { useAdminVeterinarians } from './_hooks/useAdminVeterinarians';
import { AdminVetsFilters } from './_components/AdminVetsFilters';
import { AdminVetsTable } from './_components/AdminVetsTable';
import { AdminVetDetailIsland } from './_components/AdminVetDetailIsland';
import { AdminCreateVetModal } from './_components/AdminCreateVetModal';

export default function AdminVeterinariansPage() {
  const s = useAdminVeterinarians();

  return (
    <>
      {s.error && (
        <div
          className="alert alert-destructive row between"
          role="alert"
          style={{ alignItems: 'center', marginBottom: 'var(--gap)' }}
        >
          <div className="row" style={{ gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} className="ic" />
            <span>{s.error}</span>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void s.reload()}>
            Повторить
          </button>
        </div>
      )}

      <div className="content-row">
        <div className="content-col grow">
          <AdminVetsFilters
            filterSpec={s.filterSpec}
            onFilterSpecChange={s.setFilterSpec}
            filterSpecies={s.filterSpecies}
            onFilterSpeciesChange={s.setFilterSpecies}
            specializations={s.specializations}
            speciesList={s.speciesList}
            onCreateClick={s.openCreateModal}
          />

          <AdminVetsTable
            vets={s.vets}
            selectedVet={s.selectedVet}
            onSelectVet={s.selectVet}
            users={s.users}
            specializations={s.specializations}
            speciesList={s.speciesList}
            vetPermMap={s.vetPermMap}
            loading={s.loading}
          />
        </div>

        {s.selectedVet && (
          <AdminVetDetailIsland
            selectedVet={s.selectedVet}
            users={s.users}
            specializations={s.specializations}
            speciesList={s.speciesList}
            vetPermMap={s.vetPermMap}
            vetSchedules={s.vetSchedules}
            vetExceptions={s.vetExceptions}
            loadingDetails={s.loadingDetails}
            detailsError={s.detailsError}
            onClose={s.closeDetail}
            onDeleteClick={s.openDeleteModal}
            onSaveProfile={s.updateVeterinarian}
            onToggleSpeciesPermission={s.toggleVetSpeciesPermission}
          />
        )}
      </div>

      <AdminCreateVetModal
        isOpen={s.isCreateOpen}
        onClose={s.closeCreateModal}
        usersWithoutProfile={s.usersWithoutProfile}
        specializations={s.specializations}
        onCreateVet={s.createVeterinarian}
      />

      <ConfirmModal
        isOpen={s.isDeleteConfirmOpen && Boolean(s.selectedVet)}
        title="Удалить профиль врача?"
        description={`Профиль врача «${s.selectedVetName}» будет удалён. Записи и расписание могут быть затронуты. Сама учётная запись пользователя сохранится.`}
        confirmLabel="Удалить"
        loading={s.deleting}
        error={s.deleteError}
        onClose={s.closeDeleteModal}
        onConfirm={s.confirmDeleteVet}
      />
    </>
  );
}
