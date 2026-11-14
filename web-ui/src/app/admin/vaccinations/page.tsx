'use client';

import React, { Suspense } from 'react';
import { AlertCircle } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/shared/components';
import { useAdminVaccinations } from './_hooks/useAdminVaccinations';
import { VaccinationsStats } from './_components/VaccinationsStats';
import { VaccinationsFilters } from './_components/VaccinationsFilters';
import { VaccinationsTable } from './_components/VaccinationsTable';
import { VaccinationDetailIsland } from './_components/VaccinationDetailIsland';
import { AddVaccinationModal } from './_components/AddVaccinationModal';

function AdminVaccinationsContent() {
  const vm = useAdminVaccinations();
  const selectedTitle = vm.selectedVaccination
    ? vm.selectedVaccination.name || vm.selectedVaccination.vaccineName || 'Прививка'
    : undefined;

  useShellHeader({
    crumbGroup: 'Работа клиники',
    crumb: 'Прививки',
    crumb2: selectedTitle,
  });

  const deleteVaxName = vm.deleteTarget?.name || vm.deleteTarget?.vaccineName || 'Вакцинация';
  const deletePetName = vm.deleteTarget ? vm.petMap.get(vm.deleteTarget.petId)?.name : undefined;

  return (
    <>
      <div className="content-col grow">
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

        <VaccinationsStats
          totalCount={vm.stats.total}
          overdueCount={vm.stats.overdue}
          soonCount={vm.stats.soon}
        />

        <div className="content-row">
          <div className="content-col grow">
            <VaccinationsFilters
              search={vm.search}
              onSearchChange={vm.setSearch}
              selectedPetId={vm.petFilter}
              onPetChange={vm.setPetFilter}
              nextDueFrom={vm.nextDueFrom}
              onNextDueFromChange={vm.setNextDueFrom}
              nextDueTo={vm.nextDueTo}
              onNextDueToChange={vm.setNextDueTo}
              statusFilter={vm.statusFilter}
              onStatusFilterChange={vm.setStatusFilter}
              pets={vm.pets}
              users={vm.users}
              onCreateClick={vm.handleOpenCreate}
            />

            <VaccinationsTable
              vaccinations={vm.vaccinations}
              pets={vm.pets}
              speciesList={vm.speciesList}
              selectedVaccination={vm.selectedVaccination}
              loading={vm.loading}
              totalElements={vm.totalElements}
              paginationProps={vm.paginationProps}
              onSelect={vm.setSelectedVaccination}
              onEdit={vm.handleOpenEdit}
              onDelete={vm.requestDelete}
            />
          </div>

          {vm.selectedVaccination && (
            <VaccinationDetailIsland
              vaccination={vm.selectedVaccination}
              pet={vm.petMap.get(vm.selectedVaccination.petId)}
              speciesList={vm.speciesList}
              onClose={() => vm.setSelectedVaccination(null)}
              onEdit={vm.handleOpenEdit}
              onDelete={vm.requestDelete}
            />
          )}
        </div>
      </div>

      <AddVaccinationModal
        isOpen={vm.isModalOpen}
        vaccination={vm.editingVaccination}
        pets={vm.pets}
        speciesList={vm.speciesList}
        users={vm.users}
        onClose={vm.closeFormModal}
        onSave={vm.saveVaccination}
      />

      <ConfirmModal
        isOpen={Boolean(vm.deleteTarget)}
        title="Удалить запись о вакцинации?"
        description={
          vm.deleteTarget
            ? `Запись «${deleteVaxName}»${deletePetName ? ` для питомца «${deletePetName}»` : ''} будет безвозвратно удалена.`
            : undefined
        }
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        tone="destructive"
        loading={vm.deleting}
        error={vm.deleteError}
        onClose={vm.cancelDelete}
        onConfirm={vm.confirmDelete}
      />
    </>
  );
}

/**
 * Страница учета вакцинаций администратора клиники.
 */
export default function AdminVaccinationsPage() {
  return (
    <Suspense
      fallback={
        <div className="island grow">
          <div className="empty">
            <span className="spinner" aria-hidden="true" />
            <span className="muted">Загрузка прививок…</span>
          </div>
        </div>
      }
    >
      <AdminVaccinationsContent />
    </Suspense>
  );
}
