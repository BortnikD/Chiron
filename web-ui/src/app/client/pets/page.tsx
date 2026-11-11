'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Archive, AlertCircle } from 'lucide-react';
import { ConfirmModal } from '@/shared/components';
import { useShellHeader } from '@/components/layout/AppShell';
import { useClientPets } from './_hooks/useClientPets';
import { PetsFilters } from './_components/PetsFilters';
import { PetsList } from './_components/PetsList';
import { PetDetailIsland } from './_components/PetDetailIsland';
import { PetModal } from './_components/PetModal';

function PetsContent() {
  const searchParams = useSearchParams();
  const state = useClientPets(
    searchParams.get('action'),
    searchParams.get('sel'),
    searchParams.get('tab')
  );

  useShellHeader({
    crumbGroup: 'Кабинет',
    crumb: 'Питомцы',
    crumb2: state.selectedPet ? state.selectedPet.name : undefined,
  });

  const isArchiving = state.archivingPet ? !state.archivingPet.isArchived : true;

  return (
    <div className="content-col grow">
      <PetsFilters
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        archiveFilter={state.archiveFilter}
        onArchiveFilterChange={state.setArchiveFilter}
        speciesList={state.speciesList}
        selectedSpeciesId={state.selectedSpeciesId}
        onSpeciesChange={state.setSelectedSpeciesId}
        onAddPet={state.openCreate}
      />

      {state.error && (
        <div className="alert alert-destructive" role="alert">
          <AlertCircle className="ic" />
          <div className="grow">{state.error}</div>
          <button type="button" className="btn btn-outline btn-sm" onClick={state.reload}>
            Повторить
          </button>
        </div>
      )}

      <div className="content-row">
        <PetsList
          pets={state.filteredPets}
          selectedPet={state.selectedPet}
          onSelectPet={state.setSelectedPet}
          speciesMap={state.speciesMap}
          servicesMap={state.servicesMap}
          appointments={state.appointments}
          vaccinations={state.vaccinations}
          archiveFilter={state.archiveFilter}
          loading={state.loading}
          onAddPet={state.openCreate}
        />

        {state.selectedPet && (
          <PetDetailIsland
            pet={state.selectedPet}
            speciesMap={state.speciesMap}
            servicesMap={state.servicesMap}
            veterinariansMap={state.vetsMap}
            appointments={state.appointments}
            vaccinations={state.vaccinations}
            loadingAppts={state.loadingAppts}
            initialTab={state.initialDetailTab}
            onClose={() => state.setSelectedPet(null)}
            onEdit={state.openEdit}
            onToggleArchive={state.openArchiveModal}
            onDelete={state.openDeleteModal}
          />
        )}
      </div>

      <PetModal
        isOpen={state.isPetModalOpen}
        pet={state.editingPet}
        speciesList={state.speciesList}
        onSave={state.handleSavePet}
        onClose={state.closePetModal}
        saving={state.modalSaving}
        error={state.modalError}
      />

      <ConfirmModal
        isOpen={!!state.archivingPet}
        title={
          state.archivingPet
            ? isArchiving
              ? `Отправить ${state.archivingPet.name} в архив?`
              : `Вернуть ${state.archivingPet.name} из архива?`
            : ''
        }
        description={
          isArchiving
            ? 'История сохранится, но записать питомца будет нельзя. Вернуть из архива можно в любой момент.'
            : 'Питомец снова станет активным и доступным для записи на приём.'
        }
        confirmLabel={isArchiving ? 'В архив' : 'Вернуть из архива'}
        cancelLabel="Не сейчас"
        tone="primary"
        size="sm"
        loading={state.archiveLoading}
        error={state.archiveError}
        onConfirm={state.handleConfirmArchive}
        onClose={state.closeArchiveModal}
      >
        <div className="alert alert-info">
          <Archive className="ic" />
          <div>
            {isArchiving
              ? 'Питомец переместится во вкладку «Архив». История визитов и прививок сохранится.'
              : 'Онлайн-запись снова станет доступна.'}
          </div>
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={!!state.deletingPet}
        title={state.deletingPet ? `Удалить ${state.deletingPet.name}?` : 'Удаление питомца'}
        description="Карточка будет удалена без возможности восстановления."
        confirmLabel="Удалить"
        cancelLabel="Не сейчас"
        tone="destructive"
        size="sm"
        loading={state.deleteLoading}
        error={state.deleteError}
        onConfirm={state.handleConfirmDelete}
        onClose={state.closeDeleteModal}
      />
    </div>
  );
}

export default function PetsPage() {
  return (
    <Suspense
      fallback={
        <div className="island grow">
          <div className="empty">
            <div className="spinner" />
            <span className="small muted">Загрузка питомцев…</span>
          </div>
        </div>
      }
    >
      <PetsContent />
    </Suspense>
  );
}
