'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import { useVetDashboard } from './_hooks/useVetDashboard';
import { VetDayTimelineIsland } from './_components/VetDayTimelineIsland';
import { VetDashboardSideColumn } from './_components/VetDashboardSideColumn';
import { VetActiveAppointmentDrawer } from './_components/VetActiveAppointmentDrawer';

function VetDashboardContent() {
  const searchParams = useSearchParams();
  const initialSelId = searchParams.get('sel');

  const {
    appointments,
    services,
    servicesMap,
    specsMap,
    speciesMap,
    vetProfile,
    workSchedules,
    petsMap,
    loading,
    error,
    statusError,
    clearStatusError,
    selectedAppt,
    setSelectedAppt,
    nowTime,
    todayAppts,
    pendingAppts,
    loadAllPendingPets,
    nextAppt,
    reload,
    handleUpdateStatus,
    handleSaveNotes,
    handleCreateFollowUp,
    handleCreateVaccination,
  } = useVetDashboard(initialSelId);

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

      {statusError && (
        <div className="alert alert-destructive row between items-center" role="alert">
          <div className="row items-center" style={{ gap: '8px' }}>
            <AlertCircle className="ic" />
            <span>{statusError}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={clearStatusError}
            aria-label="Скрыть ошибку"
          >
            <X className="ic" />
          </button>
        </div>
      )}

      <div className="content-row">
        <VetDayTimelineIsland
          todayIso={nowTime.dateIso}
          nowHhmm={nowTime.hhmm}
          nowMinutes={nowTime.minutes}
          todayAppointments={todayAppts}
          selectedAppointment={selectedAppt}
          nextAppointment={nextAppt}
          workSchedules={workSchedules}
          servicesMap={servicesMap}
          petsMap={petsMap}
          speciesMap={speciesMap}
          loading={loading}
          onSelectAppointment={setSelectedAppt}
        />

        <VetDashboardSideColumn
          nowMinutes={nowTime.minutes}
          nextAppointment={nextAppt}
          pendingAppointments={pendingAppts}
          servicesMap={servicesMap}
          petsMap={petsMap}
          speciesMap={speciesMap}
          loading={loading}
          selectedAppointmentId={selectedAppt?.id ?? null}
          onExpandPending={loadAllPendingPets}
          onSelectAppointment={setSelectedAppt}
          onUpdateStatus={handleUpdateStatus}
        />

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

export default function VetDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="content-col grow">
          <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка смены...
          </div>
        </div>
      }
    >
      <VetDashboardContent />
    </Suspense>
  );
}
