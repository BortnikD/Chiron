'use client';

import { AlertCircle, X } from 'lucide-react';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { formatIsoDateDisplay } from '@/shared/lib';
import { useVetSchedule } from './_hooks/useVetSchedule';
import { VetWeeklyScheduleTable } from './_components/VetWeeklyScheduleTable';
import { VetExceptionsList } from './_components/VetExceptionsList';
import { VetExceptionModal } from './_components/VetExceptionModal';
import { VetScheduleDetailIsland } from './_components/VetScheduleDetailIsland';

export default function VetSchedulePage() {
  const {
    vetId,
    schedules,
    exceptions,
    appointments,
    services,
    pets,
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
    isModalOpen,
    openExceptionModal,
    closeExceptionModal,
    handleCreateException,
    handleSelectAppt,
    handleSelectException,
    handleCloseDetail,
    exceptionToDelete,
    deletingException,
    deleteExceptionError,
    requestDeleteException,
    cancelDeleteException,
    confirmDeleteException,
  } = useVetSchedule();

  const hasDetail = Boolean(selectedAppt || selectedException);

  return (
    <>
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
              services={services}
              pets={pets}
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
              onAddException={openExceptionModal}
              loading={loading}
              hasDetail={hasDetail}
            />
          </div>

          <VetScheduleDetailIsland
            selectedAppt={selectedAppt}
            selectedException={selectedException}
            onClose={handleCloseDetail}
            pets={pets}
            services={services}
            onDeleteException={requestDeleteException}
          />
        </div>
      </div>

      <VetExceptionModal
        isOpen={isModalOpen}
        vetId={vetId}
        onClose={closeExceptionModal}
        onSave={handleCreateException}
      />

      <ConfirmModal
        isOpen={!!exceptionToDelete}
        title="Удалить исключение?"
        description={
          exceptionToDelete
            ? `Период: ${
                exceptionToDelete.startDate === exceptionToDelete.endDate
                  ? formatIsoDateDisplay(exceptionToDelete.startDate)
                  : `${formatIsoDateDisplay(exceptionToDelete.startDate)} – ${formatIsoDateDisplay(exceptionToDelete.endDate)}`
              }${exceptionToDelete.reason ? ` · ${exceptionToDelete.reason}` : ''}`
            : undefined
        }
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        tone="destructive"
        loading={deletingException}
        error={deleteExceptionError}
        onConfirm={confirmDeleteException}
        onClose={cancelDeleteException}
      />
    </>
  );
}
