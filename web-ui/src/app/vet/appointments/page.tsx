'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useVetAppointments } from './_hooks/useVetAppointments';
import { VetAppointmentsFilters } from './_components/VetAppointmentsFilters';
import { VetAppointmentsTable } from './_components/VetAppointmentsTable';
import { VetAppointmentsCalendar } from './_components/VetAppointmentsCalendar';
import { VetActiveAppointmentDrawer } from '../dashboard/_components/VetActiveAppointmentDrawer';

function VetAppointmentsContent() {
  const searchParams = useSearchParams();
  const initialSelId = searchParams.get('sel');
  const initialPetId = searchParams.get('petId');

  const {
    viewMode,
    setViewMode,
    tab,
    setTab,
    petFilter,
    setPetFilter,
    statusFilter,
    toggleStatus,
    removeStatus,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    page,
    setPage,
    size,
    setSize,
    calMode,
    setCalMode,
    calDayIsos,
    calPrev,
    calNext,
    calToday,
    resetFilters,
    appointments,
    totalElements,
    totalPages,
    exceptions,
    workSchedules,
    patients,
    petsMap,
    services,
    servicesMap,
    specsMap,
    speciesMap,
    vetProfile,
    nowTime,
    loading,
    error,
    reload,
    selectedAppt,
    setSelectedAppt,
    handleUpdateStatus,
    handleSaveNotes,
    handleCreateFollowUp,
    handleCreateVaccination,
  } = useVetAppointments({ initialSelId, initialPetId });

  return (
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
          <VetAppointmentsFilters
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            tab={tab}
            onTabChange={setTab}
            petFilter={petFilter}
            onPetFilterChange={setPetFilter}
            patients={patients}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            statusFilter={statusFilter}
            onToggleStatus={toggleStatus}
          />

          {viewMode === 'table' ? (
            <VetAppointmentsTable
              appointments={appointments}
              totalElements={totalElements}
              page={page}
              totalPages={totalPages}
              size={size}
              loading={loading}
              selectedAppt={selectedAppt}
              petsMap={petsMap}
              servicesMap={servicesMap}
              speciesMap={speciesMap}
              petFilter={petFilter}
              statusFilter={statusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onSelectAppointment={setSelectedAppt}
              onPageChange={setPage}
              onSizeChange={setSize}
              onClearPet={() => setPetFilter('')}
              onRemoveStatus={removeStatus}
              onClearDateFrom={() => setDateFrom('')}
              onClearDateTo={() => setDateTo('')}
              onResetAll={resetFilters}
            />
          ) : (
            <VetAppointmentsCalendar
              calMode={calMode}
              calDayIsos={calDayIsos}
              todayIso={nowTime.dateIso}
              nowMinutes={nowTime.minutes}
              appointments={appointments}
              exceptions={exceptions}
              workSchedules={workSchedules}
              petsMap={petsMap}
              servicesMap={servicesMap}
              selectedAppt={selectedAppt}
              loading={loading}
              onModeChange={setCalMode}
              onPrev={calPrev}
              onToday={calToday}
              onNext={calNext}
              onSelectAppointment={setSelectedAppt}
            />
          )}
        </div>

        {selectedAppt && (
          <VetActiveAppointmentDrawer
            appointment={selectedAppt}
            appointments={appointments}
            services={services}
            servicesMap={servicesMap}
            petsMap={petsMap}
            speciesMap={speciesMap}
            vet={vetProfile}
            specsMap={specsMap}
            onClose={() => setSelectedAppt(null)}
            onSelectAppointment={setSelectedAppt}
            onUpdateStatus={handleUpdateStatus}
            onSaveNotes={handleSaveNotes}
            onCreateFollowUp={handleCreateFollowUp}
            onCreateVaccination={handleCreateVaccination}
          />
        )}
      </div>
    </div>
  );
}

export default function VetAppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="content-col grow">
          <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка записей...
          </div>
        </div>
      }
    >
      <VetAppointmentsContent />
    </Suspense>
  );
}
