'use client';

import React, { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { formatDateShort, formatSlotTime } from '@/shared/lib';
import { useClientAppointments } from './_hooks/useClientAppointments';
import { AppointmentsFilters } from './_components/AppointmentsFilters';
import { AppointmentsList } from './_components/AppointmentsList';
import { AppointmentDetailIsland } from './_components/AppointmentDetailIsland';
import { buildActiveFilterTags } from './_components/utils';

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const initialSel = searchParams.get('sel');
  const state = useClientAppointments(initialSel);

  const selectedAppt = state.selectedAppt;

  useShellHeader({
    crumbGroup: 'Кабинет',
    crumb: 'Записи',
    crumb2: selectedAppt
      ? `${formatDateShort(selectedAppt.startAt)} ${formatSlotTime(selectedAppt.startAt)}`
      : undefined,
  });

  const activeFilters = useMemo(
    () =>
      buildActiveFilterTags({
        selectedPetId: state.selectedPetId,
        petsMap: state.petsMap,
        statusChips: state.statusChips,
        fromDate: state.fromDate,
        toDate: state.toDate,
        onClearPet: () => state.setSelectedPetId('ALL'),
        onToggleStatus: state.toggleStatusChip,
        onClearFrom: () => state.setFromDate(''),
        onClearTo: () => state.setToDate(''),
      }),
    [state]
  );

  const selectedPetName = selectedAppt
    ? state.petsMap[selectedAppt.petId]?.name || selectedAppt.petName || 'Питомец'
    : '';
  const selectedServiceName = selectedAppt
    ? state.servicesMap[selectedAppt.serviceId]?.name || selectedAppt.serviceName || 'Приём'
    : '';

  return (
    <div className="content-row">
      <div className="content-col grow">
        <AppointmentsFilters
          tab={state.tab}
          onTabChange={state.setTab}
          selectedPetId={state.selectedPetId}
          onPetChange={state.setSelectedPetId}
          pets={state.pets}
          fromDate={state.fromDate}
          onFromDateChange={state.setFromDate}
          toDate={state.toDate}
          onToDateChange={state.setToDate}
          statusChips={state.statusChips}
          onToggleStatus={state.toggleStatusChip}
        />

        {state.error && (
          <div className="alert alert-destructive" role="alert">
            <AlertCircle className="ic" />
            <div className="grow">{state.error}</div>
            <button type="button" className="btn btn-outline btn-sm" onClick={state.reload}>
              Повторить
            </button>
          </div>
        )}

        <AppointmentsList
          appointments={state.filteredAppointments}
          selectedAppointment={selectedAppt}
          onSelectAppointment={state.setSelectedAppt}
          petsMap={state.petsMap}
          servicesMap={state.servicesMap}
          vetsMap={state.vetsMap}
          speciesMap={state.speciesMap}
          loading={state.loading}
          totalElements={state.totalElements}
          totalPages={state.totalPages}
          page={state.page}
          onPageChange={state.setPage}
          size={state.size}
          onSizeChange={state.setSize}
          direction={state.direction}
          onToggleDirection={state.toggleDirection}
          activeFilters={activeFilters}
          onResetFilters={state.resetFilters}
        />
      </div>

      {selectedAppt && (
        <AppointmentDetailIsland
          appointment={selectedAppt}
          petsMap={state.petsMap}
          servicesMap={state.servicesMap}
          veterinariansMap={state.vetsMap}
          speciesMap={state.speciesMap}
          parentApptsMap={state.parentApptsMap}
          currentUserId={state.currentUserId}
          onSelectFollowUpParent={state.selectAppointmentById}
          onClose={() => state.setSelectedAppt(null)}
          onRequestCancel={state.openCancelModal}
        />
      )}

      <ConfirmModal
        isOpen={state.isCancelModalOpen && !!selectedAppt}
        title="Отменить запись?"
        description={
          selectedAppt
            ? `${selectedPetName} — ${selectedServiceName}, ${formatDateShort(selectedAppt.startAt)} в ${formatSlotTime(selectedAppt.startAt)}. Врач получит уведомление.`
            : undefined
        }
        confirmLabel="Отменить запись"
        cancelLabel="Не сейчас"
        tone="destructive"
        size="sm"
        loading={state.cancelling}
        error={state.cancelError}
        onConfirm={state.handleCancelAppointment}
        onClose={state.closeCancelModal}
      >
        <div className="field">
          <label className="field-label" htmlFor="c-reason">
            Причина отмены (необязательно)
          </label>
          <textarea
            id="c-reason"
            className="textarea"
            rows={2}
            maxLength={1000}
            value={state.cancelReason}
            onChange={(e) => state.setCancelReason(e.target.value.slice(0, 1000))}
            placeholder="Изменились планы, питомец поправился"
          />
          <span className="field-hint">{state.cancelReason.length} / 1000</span>
        </div>
      </ConfirmModal>
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="island grow">
          <div className="empty">
            <div className="spinner" />
            <span className="small muted">Загрузка записей...</span>
          </div>
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}
