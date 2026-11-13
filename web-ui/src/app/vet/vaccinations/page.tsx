'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { VetAddVaccinationModal } from '../patients/_components/VetAddVaccinationModal';
import { useVetVaccinations } from './_hooks/useVetVaccinations';
import { VetVaccinationsFilters } from './_components/VetVaccinationsFilters';
import { VetVaccinationsTable } from './_components/VetVaccinationsTable';
import { VetVaccinationDetailIsland } from './_components/VetVaccinationDetailIsland';

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

            <VetVaccinationsTable
              vaccinations={vaccinations}
              totalElements={totalElements}
              page={page}
              totalPages={totalPages}
              loading={loading}
              hasDateBounds={Boolean(nextDueFrom || nextDueTo)}
              hasActiveFilters={hasActiveFilters}
              selectedVac={selectedVac}
              petsMap={petsMap}
              speciesMap={speciesMap}
              onSelectVac={setSelectedVac}
              onPageChange={setPage}
              onResetFilters={resetFilters}
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

      <VetAddVaccinationModal
        isOpen={modalOpen}
        mode={editingVac ? 'edit' : 'create'}
        vaccination={editingVac}
        patient={
          editingVac
            ? petsMap[editingVac.petId] || null
            : petFilter
              ? petsMap[petFilter] || null
              : null
        }
        patients={patients}
        onClose={closeModal}
        onSubmit={handleCreateVaccination}
        onUpdate={handleUpdateVaccination}
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
