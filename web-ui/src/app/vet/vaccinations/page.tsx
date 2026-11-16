'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { VetVaccinationsFilters } from './_components/VetVaccinationsFilters';
import { VetVaccinationDetailIsland } from './_components/VetVaccinationDetailIsland';
import { VaccinationFormModal, VaccinationsTable } from '@/components/vaccinations';
import { useVetVaccinations } from './_hooks/useVetVaccinations';

function VetVaccinationsContent() {
  const searchParams = useSearchParams();
  const initialPetId = searchParams.get('petId');
  const initialSelId = searchParams.get('sel');

  const {
    petFilter,
    setPetFilter,
    nameQuery,
    setNameQuery,
    nextDueFrom,
    setNextDueFrom,
    nextDueTo,
    setNextDueTo,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    resetFilters,
    vaccinations,
    totalElements,
    totalPages,
    patients,
    petsMap,
    speciesMap,
    loading,
    error,
    reload,
    selectedVac,
    setSelectedVac,
    modalOpen,
    editingVac,
    openCreateModal,
    openEditModal,
    closeModal,
    handleCreateVaccination,
    handleUpdateVaccination,
    paginationProps,
  } = useVetVaccinations({ initialPetId, initialSelId });

  const hasActiveFilters = Boolean(
    petFilter || nameQuery.trim() || nextDueFrom || nextDueTo || statusFilter !== 'ALL'
  );

  return (
    <>
      <div className="content-col grow">
        {error && (
          <div className="alert alert-destructive row between items-center" role="alert">
            <div className="row items-center" style={{ gap: '8px' }}>
              <AlertCircle className="ic" />
              <span>{error}</span>
            </div>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => reload()}>
              Повторить
            </button>
          </div>
        )}

        <div className="content-row">
          <div className="content-col grow">
            <VetVaccinationsFilters
              petFilter={petFilter}
              onPetFilterChange={setPetFilter}
              patients={patients}
              nameQuery={nameQuery}
              onNameQueryChange={setNameQuery}
              nextDueFrom={nextDueFrom}
              onNextDueFromChange={setNextDueFrom}
              nextDueTo={nextDueTo}
              onNextDueToChange={setNextDueTo}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onAddClick={openCreateModal}
            />

            <VaccinationsTable
              data={vaccinations}
              count={totalElements}
              loading={loading}
              selectedId={selectedVac?.id ?? null}
              petsMap={petsMap}
              speciesMap={speciesMap}
              onSelect={setSelectedVac}
              paginationProps={paginationProps}
              emptyTitle={hasActiveFilters ? 'Вакцинации не найдены' : 'Список вакцинаций пуст'}
              emptyDescription={hasActiveFilters ? 'Попробуйте изменить параметры поиска' : 'Добавьте первую вакцинацию для пациентов'}
            />
          </div>

          {selectedVac && (
            <VetVaccinationDetailIsland
              vaccination={selectedVac}
              pet={petsMap[selectedVac.petId]}
              speciesMap={speciesMap}
              onClose={() => setSelectedVac(null)}
              onEdit={openEditModal}
            />
          )}
        </div>
      </div>

      <VaccinationFormModal
        isOpen={modalOpen}
        initialData={editingVac}
        lockedPetId={
          editingVac
            ? editingVac.petId
            : petFilter || undefined
        }
        petName={
          editingVac
            ? petsMap[editingVac.petId]?.name
            : petFilter
              ? petsMap[petFilter]?.name
              : undefined
        }
        pets={patients}
        onClose={closeModal}
        onSubmit={async (payload) => {
          if (editingVac) {
            await handleUpdateVaccination(editingVac.id, payload as any);
          } else {
            await handleCreateVaccination(payload as any);
          }
        }}
      />
    </>
  );
}

export default function VetVaccinationsPage() {
  return (
    <Suspense
      fallback={
        <div className="content-col grow">
          <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка прививок...
          </div>
        </div>
      }
    >
      <VetVaccinationsContent />
    </Suspense>
  );
}
