'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useVetPatients } from './_hooks/useVetPatients';
import { VetPatientsFilters } from './_components/VetPatientsFilters';
import { VetPatientsList } from './_components/VetPatientsList';
import { VetPatientDetailIsland } from './_components/VetPatientDetailIsland';
import { VetAddVaccinationModal } from './_components/VetAddVaccinationModal';

function VetPatientsContent() {
  const searchParams = useSearchParams();
  const initialSelId = searchParams.get('sel');

  const {
    filteredPatients,
    appointments,
    speciesList,
    servicesMap,
    loading,
    error,
    reload,
    search,
    setSearch,
    speciesFilter,
    setSpeciesFilter,
    viewMode,
    setViewMode,
    selectedPatient,
    setSelectedPatient,
    patientVacs,
    vacsError,
    isVacModalOpen,
    editingVac,
    openCreateVaccination,
    openEditVaccination,
    closeVaccinationModal,
    handleAddVaccination,
    handleUpdateVaccination,
  } = useVetPatients(initialSelId);

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
          <section className="island grow">
            <VetPatientsFilters
              search={search}
              onSearchChange={setSearch}
              speciesFilter={speciesFilter}
              onSpeciesFilterChange={setSpeciesFilter}
              speciesList={speciesList}
              count={filteredPatients.length}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            <VetPatientsList
              patients={filteredPatients}
              selectedPatient={selectedPatient}
              onSelectPatient={setSelectedPatient}
              speciesList={speciesList}
              appointments={appointments}
              loading={loading}
              viewMode={viewMode}
            />
          </section>

          {selectedPatient && (
            <VetPatientDetailIsland
              patient={selectedPatient}
              speciesList={speciesList}
              servicesMap={servicesMap}
              appointments={appointments}
              vaccinations={patientVacs}
              vaccinationsError={vacsError}
              onClose={() => setSelectedPatient(null)}
              onAddVaccination={openCreateVaccination}
              onEditVaccination={openEditVaccination}
            />
          )}
        </div>
      </div>

      <VetAddVaccinationModal
        isOpen={isVacModalOpen && !!selectedPatient}
        mode={editingVac ? 'edit' : 'create'}
        vaccination={editingVac}
        patient={selectedPatient}
        onClose={closeVaccinationModal}
        onSubmit={handleAddVaccination}
        onUpdate={handleUpdateVaccination}
      />
    </>
  );
}

export default function VetPatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="content-col grow">
          <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка пациентов...
          </div>
        </div>
      }
    >
      <VetPatientsContent />
    </Suspense>
  );
}
