'use client';

import React, { Suspense } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/shared/components';
import { useAdminPets } from './_hooks/useAdminPets';
import { PetsFilters } from './_components/PetsFilters';
import { PetsTable } from './_components/PetsTable';
import { PetDetailIsland } from './_components/PetDetailIsland';
import { PetFormModal } from '@/components/pets';
import { VaccinationFormModal } from '@/components/vaccinations';

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
            totalElements={vm.totalElements}
            page={vm.page}
            pageSize={vm.pageSize}
            totalPages={vm.totalPages}
            onSelectPet={vm.setSelectedPet}
            onPageChange={vm.setPage}
            onPageSizeChange={vm.setPageSize}
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
            onUploadPhoto={vm.uploadPetPhoto}
            onDeletePhoto={vm.deletePetPhoto}
          />
        )}
      </div>

      <PetFormModal
        isOpen={vm.isCreateOpen}
        mode="admin"
        pet={null}
        speciesList={vm.speciesList}
        users={vm.users}
        onClose={() => vm.setIsCreateOpen(false)}
        onSubmit={async (data, photoFile) => {
          await vm.createPet(data as any, photoFile);
        }}
      />
      <PetFormModal
        isOpen={vm.isEditOpen}
        mode="admin"
        pet={vm.selectedPet}
        speciesList={vm.speciesList}
        users={vm.users}
        onClose={() => vm.setIsEditOpen(false)}
        onSubmit={async (data, photoFile) => {
          if (!vm.selectedPet) return;
          await vm.updatePet(vm.selectedPet.id, data as any, photoFile);
        }}
        onUploadPhoto={vm.uploadPetPhoto}
        onDeletePhoto={vm.deletePetPhoto}
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
      <VaccinationFormModal
        isOpen={vm.isAddVacOpen}
        lockedPetId={vm.selectedPet?.id}
        petName={vm.selectedPet?.name}
        onClose={() => vm.setIsAddVacOpen(false)}
        onSubmit={async (payload) => {
          await vm.createVaccination(payload as any);
        }}
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
