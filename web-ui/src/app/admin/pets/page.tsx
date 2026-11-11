'use client';

import React, { Suspense } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/shared/components';
import { useAdminPets } from './_hooks/useAdminPets';
import { PetsFilters } from './_components/PetsFilters';
import { PetsTable } from './_components/PetsTable';
import { PetDetailIsland } from './_components/PetDetailIsland';
import { CreatePetModal } from './_components/CreatePetModal';
import { EditPetModal } from './_components/EditPetModal';
import { AddVaccinationModal } from './_components/AddVaccinationModal';

function AdminPetsContent() {
  const vm = useAdminPets();

  useShellHeader({
    crumbGroup: 'Работа клиники',
    crumb: 'Питомцы',
    crumb2: vm.selectedPet?.name,
  });

  return (
    <>
      {vm.error && (
        <div className="alert alert-destructive" role="alert" style={{ marginBottom: '8px', alignItems: 'center' }}>
          <AlertCircle className="ic" size={16} />
          <span className="grow">{vm.error}</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={vm.reload}>
            <RefreshCw size={14} />
            Повторить
          </button>
        </div>
      )}

      {vm.actionError && (
        <div className="alert alert-destructive row between items-center" role="alert" style={{ marginBottom: '8px' }}>
          <div className="row items-center" style={{ gap: '8px' }}>
            <AlertCircle className="ic" size={16} />
            <span>{vm.actionError}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={vm.clearActionError}
            aria-label="Скрыть ошибку"
          >
            <X className="ic" size={16} />
          </button>
        </div>
      )}

      <div className="content-row">
        <div className="content-col grow">
          <PetsFilters
            ownerFilter={vm.ownerFilter}
            onOwnerFilterChange={vm.setOwnerFilter}
            speciesFilter={vm.speciesFilter}
            onSpeciesFilterChange={vm.setSpeciesFilter}
            genderFilter={vm.genderFilter}
            onGenderFilterChange={vm.setGenderFilter}
            statusFilter={vm.statusFilter}
            onStatusFilterChange={vm.setStatusFilter}
            search={vm.search}
            onSearchChange={vm.setSearch}
            speciesList={vm.speciesList}
            users={vm.users}
            onOpenCreate={() => vm.setIsCreateOpen(true)}
          />
          <PetsTable
            pets={vm.pets}
            selectedPet={vm.selectedPet}
            speciesList={vm.speciesList}
            users={vm.users}
            loading={vm.loading}
            onSelectPet={vm.setSelectedPet}
          />
        </div>

        {vm.selectedPet && (
          <PetDetailIsland
            pet={vm.selectedPet}
            speciesList={vm.speciesList}
            users={vm.users}
            services={vm.services}
            veterinarians={vm.veterinarians}
            appointments={vm.petAppointments}
            vaccinations={vm.petVaccinations}
            loadingDetails={vm.loadingDetails}
            detailsError={vm.detailsError}
            onClose={() => vm.setSelectedPet(null)}
            onEdit={() => vm.setIsEditOpen(true)}
            onToggleArchive={vm.handleToggleArchive}
            onDelete={vm.openDeleteConfirm}
            onAddVaccination={() => vm.setIsAddVacOpen(true)}
          />
        )}
      </div>

      <CreatePetModal
        isOpen={vm.isCreateOpen}
        onClose={() => vm.setIsCreateOpen(false)}
        onCreate={vm.createPet}
        speciesList={vm.speciesList}
        users={vm.users}
      />
      <EditPetModal
        isOpen={vm.isEditOpen}
        pet={vm.selectedPet}
        speciesList={vm.speciesList}
        onClose={() => vm.setIsEditOpen(false)}
        onUpdate={vm.updatePet}
      />
      <ConfirmModal
        isOpen={vm.isDeleteConfirmOpen && Boolean(vm.selectedPet)}
        title="Удалить питомца?"
        description={vm.selectedPet ? `Питомец «${vm.selectedPet.name}» будет безвозвратно удалён из базы клиники.` : undefined}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        tone="destructive"
        loading={vm.deleting}
        error={vm.deleteError}
        onClose={vm.closeDeleteConfirm}
        onConfirm={vm.handleDeletePet}
      />
      <AddVaccinationModal
        isOpen={vm.isAddVacOpen}
        pet={vm.selectedPet}
        onClose={() => vm.setIsAddVacOpen(false)}
        onCreate={vm.createVaccination}
      />
    </>
  );
}

/**
 * Страница управления питомцами администратором клиники.
 */
export default function AdminPetsPage() {
  return (
    <Suspense
      fallback={
        <div className="island grow">
          <div className="empty">
            <span className="spinner" aria-hidden="true" />
            <span className="muted">Загрузка питомцев…</span>
          </div>
        </div>
      }
    >
      <AdminPetsContent />
    </Suspense>
  );
}
