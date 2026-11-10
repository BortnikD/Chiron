'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Archive, AlertCircle } from 'lucide-react';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { useClientPets } from './_hooks/useClientPets';
import { PetsFilters } from './_components/PetsFilters';
import { PetsList } from './_components/PetsList';
import { PetDetailIsland } from './_components/PetDetailIsland';
import { PetModal } from './_components/PetModal';

function PetsContent() {
  const searchParams = useSearchParams();
  const state = useClientPets(searchParams.get('action'));
  const isArchiving = state.archivingPet ? !state.archivingPet.isArchived : true;

  return (
    <div className="content-col grow">
      <PetsFilters
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        archiveFilter={state.archiveFilter}
        onArchiveFilterChange={state.setArchiveFilter}
        onAddPet={state.openCreate}
      />

      {state.error && (
        <div className="alert alert-destructive">
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
          appointments={state.appointments}
          vaccinations={state.vaccinations}
          onAddPet={state.openCreate}
        />

        {state.selectedPet && (
          <PetDetailIsland
            pet={state.selectedPet}
            speciesMap={state.speciesMap}
            appointments={state.appointments}
            vaccinations={state.vaccinations}
            loadingAppts={state.loadingAppts}
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
        title={isArchiving ? 'Архивация питомца' : 'Восстановление из архива'}
        description={
          state.archivingPet
            ? isArchiving
              ? `Вы уверены, что хотите переместить профиль «${state.archivingPet.name}» в архив?`
              : `Вы уверены, что хотите восстановить профиль «${state.archivingPet.name}» из архива?`
            : undefined
        }
        confirmLabel={isArchiving ? 'В архив' : 'Восстановить'}
        cancelLabel="Отмена"
        tone={isArchiving ? 'destructive' : 'primary'}
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
              ? 'Питомец будет перемещён во вкладку «В архиве». История визитов и вакцинаций сохранится, но создание новых записей будет заблокировано.'
              : 'Питомец вернётся в список активных, и для него снова станет доступна онлайн-запись на приём.'}
          </div>
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={!!state.deletingPet}
        title="Удаление питомца"
        description={
          state.deletingPet
            ? `Вы действительно хотите удалить профиль питомца «${state.deletingPet.name}»?`
            : undefined
        }
        confirmLabel="Удалить"
        cancelLabel="Отмена"
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--muted-foreground)]">Загрузка питомцев...</div>}>
      <PetsContent />
    </Suspense>
  );
}
