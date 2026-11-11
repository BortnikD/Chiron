'use client';

import React, { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/shared/components';
import { useAdminVeterinarians } from './_hooks/useAdminVeterinarians';
import { AdminVetsFilters } from './_components/AdminVetsFilters';
import { AdminVetsTable } from './_components/AdminVetsTable';
import { AdminVetDetailIsland } from './_components/AdminVetDetailIsland';
import { AdminCreateVetModal } from './_components/AdminCreateVetModal';

function AdminVeterinariansContent() {
  const s = useAdminVeterinarians();

  useShellHeader({
    crumbGroup: 'Персонал',
    crumb: 'Врачи',
    crumb2: s.selectedVet ? s.selectedVetName : undefined,
  });

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
            filterActive={s.filterActive}
            onFilterActiveChange={s.setFilterActive}
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
            defaultTab={s.preferredDetailTab}
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
        defaultUserId={s.prefillUserId}
        onClose={s.closeCreateModal}
        usersWithoutProfile={s.usersWithoutProfile}
        specializations={s.specializations}
        onCreateVet={s.createVeterinarian}
      />

      <ConfirmModal
        isOpen={s.isDeleteConfirmOpen && Boolean(s.selectedVet)}
        title={`Удалить профиль врача «${s.selectedVetName}»?`}
        description="Пользователь останется в системе, но перестанет быть врачом в каталоге. Записи и расписание могут быть затронуты."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        tone="destructive"
        loading={s.deleting}
        error={s.deleteError}
        onClose={s.closeDeleteModal}
        onConfirm={s.confirmDeleteVet}
      />
    </>
  );
}

export default function AdminVeterinariansPage() {
  return (
    <Suspense
      fallback={
        <div className="island grow">
          <div className="empty">
            <span className="spinner" aria-hidden="true" />
            <span className="muted">Загрузка врачей…</span>
          </div>
        </div>
      }
    >
      <AdminVeterinariansContent />
    </Suspense>
  );
}
