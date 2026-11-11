'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import { useVetSchedule } from './_hooks/useVetSchedule';
import { VetWeeklyScheduleTable } from './_components/VetWeeklyScheduleTable';
import { VetExceptionsList } from './_components/VetExceptionsList';
import { VetScheduleDetailIsland } from './_components/VetScheduleDetailIsland';
import { VetActiveAppointmentDrawer } from '../dashboard/_components/VetActiveAppointmentDrawer';

function VetScheduleContent() {
  const searchParams = useSearchParams();
  const initialSelId = searchParams.get('sel');

  const {
    vetProfile,
    schedules,
    exceptions,
    appointments,
    services,
    servicesMap,
    specsMap,
    speciesMap,
    petsMap,
    nowTime,
    loading,
    error,
    clearError,
    reload,
    weekOffset,
    goPrevWeek,
    goNextWeek,
    goCurrentWeek,
    selectedAppt,
    selectedException,
    handleSelectAppt,
    handleSelectException,
    handleCloseDetail,
    handleUpdateStatus,
    handleSaveNotes,
    handleCreateFollowUp,
    handleCreateVaccination,
  } = useVetSchedule({ initialSelId });

  const hasDetail = Boolean(selectedAppt || selectedException);

  return (
    <div className="content-col grow">
      {error && (
        <div className="alert alert-destructive row between items-center" role="alert">
          <div className="row items-center" style={{ gap: '8px' }}>
            <AlertCircle className="ic" />
            <span>{error}</span>
          </div>
          <div className="row items-center" style={{ gap: '6px' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => reload()}>
              Повторить
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={clearError}
              aria-label="Скрыть ошибку"
            >
              <X className="ic" />
            </button>
          </div>
        </div>
      )}

      <div className="content-row">
        <div
          className={
            hasDetail
              ? 'flex-1 flex flex-col lg:flex-row xl:flex-col 2xl:flex-row gap-2 min-w-0 min-h-0'
              : 'flex-1 flex flex-col lg:flex-row gap-2 min-w-0 min-h-0'
          }
        >
          <VetWeeklyScheduleTable
            loading={loading}
            schedules={schedules}
            exceptions={exceptions}
            appointments={appointments}
            servicesMap={servicesMap}
            petsMap={petsMap}
            todayIso={nowTime.dateIso}
            nowMinutes={nowTime.minutes}
            selectedAppt={selectedAppt}
            onSelectAppt={handleSelectAppt}
            onSelectException={handleSelectException}
            weekOffset={weekOffset}
            onPrevWeek={goPrevWeek}
            onNextWeek={goNextWeek}
            onCurrentWeek={goCurrentWeek}
          />

          <VetExceptionsList
            exceptions={exceptions}
            schedules={schedules}
            selectedException={selectedException}
            onSelectException={handleSelectException}
            loading={loading}
            hasDetail={hasDetail}
          />
        </div>

        {selectedAppt ? (
          <VetActiveAppointmentDrawer
            appointment={selectedAppt}
            appointments={appointments}
            services={services}
            servicesMap={servicesMap}
            petsMap={petsMap}
            speciesMap={speciesMap}
            vet={vetProfile}
            specsMap={specsMap}
            onClose={handleCloseDetail}
            onSelectAppointment={handleSelectAppt}
            onUpdateStatus={handleUpdateStatus}
            onSaveNotes={handleSaveNotes}
            onCreateFollowUp={handleCreateFollowUp}
            onCreateVaccination={handleCreateVaccination}
          />
        ) : (
          <VetScheduleDetailIsland
            selectedException={selectedException}
            onClose={handleCloseDetail}
          />
        )}
      </div>
    </div>
  );
}

export default function VetSchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="content-col grow">
          <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка графика...
          </div>
        </div>
      }
    >
      <VetScheduleContent />
    </Suspense>
  );
}
