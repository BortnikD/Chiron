'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { formatDateShort } from '@/shared/lib';
import { useClientAppointments } from './_hooks/useClientAppointments';
import { AppointmentsFilters } from './_components/AppointmentsFilters';
import { AppointmentsList } from './_components/AppointmentsList';
import { AppointmentDetailIsland } from './_components/AppointmentDetailIsland';

/**
 * Страница записей на приём клиента в личном кабинете.
 * Оркестратор фильтрации, отображения списка и детального просмотра выбранного приёма.
 */
export default function AppointmentsPage() {
  const {
    error,
    reload,
    pets,
    petsMap,
    servicesMap,
    vetsMap,
    speciesMap,
    tab,
    setTab,
    selectedPetId,
    setSelectedPetId,
    page,
    setPage,
    totalElements,
    totalPages,
    selectedAppt,
    setSelectedAppt,
    filteredAppointments,
    isCancelModalOpen,
    cancelReason,
    setCancelReason,
    cancelling,
    cancelError,
    openCancelModal,
    closeCancelModal,
    handleCancelAppointment,
  } = useClientAppointments();

  return (
    <div className="content-col grow">
      <AppointmentsFilters
        tab={tab}
        onTabChange={setTab}
        selectedPetId={selectedPetId}
        onPetChange={setSelectedPetId}
        pets={pets}
      />

      {error && (
        <div className="alert alert-destructive">
          <AlertCircle className="ic" />
          <div className="grow">{error}</div>
          <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
            Повторить
          </button>
        </div>
      )}

      <div className="content-row">
        <AppointmentsList
          appointments={filteredAppointments}
          selectedAppointment={selectedAppt}
          onSelectAppointment={setSelectedAppt}
          petsMap={petsMap}
          servicesMap={servicesMap}
          speciesMap={speciesMap}
          totalElements={totalElements}
          totalPages={totalPages}
          page={page}
          onPageChange={setPage}
        />

        {selectedAppt && (
          <AppointmentDetailIsland
            appointment={selectedAppt}
            petsMap={petsMap}
            servicesMap={servicesMap}
            veterinariansMap={vetsMap}
            onClose={() => setSelectedAppt(null)}
            onRequestCancel={openCancelModal}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={isCancelModalOpen && !!selectedAppt}
        title="Отмена записи"
        description={
          selectedAppt
            ? `Вы уверены, что хотите отменить приём на ${formatDateShort(selectedAppt.startAt)}?`
            : undefined
        }
        confirmLabel="Подтвердить отмену"
        cancelLabel="Назад"
        tone="destructive"
        size="sm"
        loading={cancelling}
        error={cancelError}
        onConfirm={handleCancelAppointment}
        onClose={closeCancelModal}
      >
        <div className="field">
          <label className="field-label" htmlFor="c-reason">
            Причина отмены (необязательно)
          </label>
          <textarea
            id="c-reason"
            className="textarea"
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Изменились планы, питомец поправился..."
          />
        </div>
      </ConfirmModal>
    </div>
  );
}
