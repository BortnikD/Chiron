'use client';

import { AlertCircle, X } from 'lucide-react';
import { useVetDashboard } from './_hooks/useVetDashboard';
import { VetQueueSummary } from './_components/VetQueueSummary';
import { VetQueueList } from './_components/VetQueueList';
import { VetActiveAppointmentDrawer } from './_components/VetActiveAppointmentDrawer';
import { VetQuickScheduleIsland } from './_components/VetQuickScheduleIsland';

/**
 * Главная страница кабинета ветеринара (Дашборд смены).
 * Компактный оркестратор: координация очереди приёмов, ведения протокола и виджета расписания.
 */
export default function VetDashboardPage() {
  const {
    appointments,
    services,
    servicesMap,
    specsMap,
    speciesMap,
    vetProfile,
    petsMap,
    loading,
    error,
    statusError,
    clearStatusError,
    selectedAppt,
    setSelectedAppt,
    todayAppts,
    pendingAppts,
    nextAppt,
    reload,
    handleUpdateStatus,
    handleSaveNotes,
    handleCreateFollowUp,
  } = useVetDashboard();

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

      <VetQueueSummary
        todayAppointments={todayAppts}
        nextAppointment={nextAppt}
        servicesMap={servicesMap}
        petsMap={petsMap}
        speciesMap={speciesMap}
        onSelectAppointment={setSelectedAppt}
      />

      <div className="content-row">
        <div className="content-col grow">
          <VetQueueList
            appointments={appointments}
            todayAppointments={todayAppts}
            selectedAppointment={selectedAppt}
            nextAppointment={nextAppt}
            servicesMap={servicesMap}
            petsMap={petsMap}
            speciesMap={speciesMap}
            loading={loading}
            onSelectAppointment={setSelectedAppt}
            onUpdateStatus={handleUpdateStatus}
          />

          <VetQuickScheduleIsland
            appointments={appointments}
            pendingAppointments={pendingAppts}
            servicesMap={servicesMap}
            petsMap={petsMap}
            loading={loading}
            onSelectAppointment={setSelectedAppt}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>

        {selectedAppt && (
          <VetActiveAppointmentDrawer
            appointment={selectedAppt}
            services={services}
            servicesMap={servicesMap}
            petsMap={petsMap}
            speciesMap={speciesMap}
            vet={vetProfile}
            specsMap={specsMap}
            onClose={() => setSelectedAppt(null)}
            onUpdateStatus={handleUpdateStatus}
            onSaveNotes={handleSaveNotes}
            onCreateFollowUp={handleCreateFollowUp}
          />
        )}
      </div>
    </div>
  );
}
