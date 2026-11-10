'use client';

import { AlertCircle } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { useVetPatients } from './_hooks/useVetPatients';
import { VetPatientsFilters } from './_components/VetPatientsFilters';
import { VetPatientsList } from './_components/VetPatientsList';
import { VetPatientDetailIsland } from './_components/VetPatientDetailIsland';
import { VetAddVaccinationModal } from './_components/VetAddVaccinationModal';

/**
 * Страница пациентов врача Chiron:
 * оркестратор списка пациентов, фильтрации по кличке/виду,
 * правого master-detail острова и модального окна добавления вакцинаций.
 */
export default function VetPatientsPage() {
  useShellHeader({ crumbGroup: 'Пациенты', crumb: 'Список' });

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
    viewMode,
    setViewMode,
    selectedPatient,
    setSelectedPatient,
    patientVacs,
    vacsError,
    isAddVacOpen,
    setIsAddVacOpen,
    handleAddVaccination,
  } = useVetPatients();

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
              onAddVaccination={() => setIsAddVacOpen(true)}
            />
          )}
        </div>
      </div>

      <VetAddVaccinationModal
        isOpen={isAddVacOpen && !!selectedPatient}
        patient={selectedPatient}
        onClose={() => setIsAddVacOpen(false)}
        onSubmit={handleAddVaccination}
      />
    </>
  );
}
