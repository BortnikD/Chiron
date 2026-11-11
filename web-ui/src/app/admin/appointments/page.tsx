'use client';

import React, { Suspense } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { ConfirmModal } from '@/shared/components';
import { formatDateTimeCompact } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import { useAdminAppointments } from './_hooks/useAdminAppointments';
import { CANCEL_REASONS, formatAppointmentCrumb } from './_components/utils';
import { AdminAppointmentsFilters } from './_components/AdminAppointmentsFilters';
import { AdminAppointmentsTable } from './_components/AdminAppointmentsTable';
import { AdminAppointmentDetailIsland } from './_components/AdminAppointmentDetailIsland';
import { AdminCreateAppointmentModal } from './_components/AdminCreateAppointmentModal';
import { AdminEditAppointmentModal } from './_components/AdminEditAppointmentModal';

function AdminAppointmentsContent() {
  const vm = useAdminAppointments();

  const crumb2 = formatAppointmentCrumb(vm.selectedAppt, vm.pets, vm.services);
  useShellHeader({
    crumbGroup: 'Работа клиники',
    crumb: 'Записи',
    crumb2,
  });

  const cancelPetName = vm.cancelAppt ? vm.pets.find((p) => p.id === vm.cancelAppt?.petId)?.name || 'Питомец' : '';
  const cancelServiceName = vm.cancelAppt ? vm.services.find((s) => s.id === vm.cancelAppt?.serviceId)?.name || 'Услуга клиники' : '';
  const cancelVetName = vm.cancelAppt
    ? getDoctorDisplay(vm.veterinarians.find((v) => v.id === vm.cancelAppt?.veterinarianId)).fullName
    : '';
  const cancelDt = vm.cancelAppt ? formatDateTimeCompact(vm.cancelAppt.startAt) : null;

  const deletePetName = vm.deleteAppt ? vm.pets.find((p) => p.id === vm.deleteAppt?.petId)?.name || 'Питомец' : 'Питомец';
  const deleteServiceName = vm.deleteAppt ? vm.services.find((s) => s.id === vm.deleteAppt?.serviceId)?.name || 'Услуга клиники' : 'Услуга';

  return (
    <>
      <div className="content-row">
        <div className="content-col grow">
          {vm.error && (
            <div className="alert alert-destructive" role="alert" style={{ alignItems: 'center' }}>
              <AlertCircle size={16} className="ic" />
              <span className="grow">{vm.error}</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={vm.reload}>
                <RefreshCw size={14} />
                Повторить
              </button>
            </div>
          )}

          <AdminAppointmentsFilters
            vetFilter={vm.vetFilter}
            onVetFilterChange={vm.setVetFilter}
            petFilter={vm.petFilter}
            onPetFilterChange={vm.setPetFilter}
            ownerFilter={vm.ownerFilter}
            onOwnerFilterChange={vm.setOwnerFilter}
            serviceFilter={vm.serviceFilter}
            onServiceFilterChange={vm.setServiceFilter}
            statusFilters={vm.statusFilters}
            onToggleStatusFilter={vm.toggleStatusFilter}
            dateFrom={vm.dateFrom}
            onDateFromChange={vm.setDateFrom}
            dateTo={vm.dateTo}
            onDateToChange={vm.setDateTo}
            veterinarians={vm.veterinarians}
            pets={vm.pets}
            users={vm.users}
            services={vm.services}
            onCreateClick={() => vm.setIsCreateOpen(true)}
          />

          <AdminAppointmentsTable
            appointments={vm.appointments}
            veterinarians={vm.veterinarians}
            services={vm.services}
            pets={vm.pets}
            users={vm.users}
            speciesList={vm.speciesList}
            selectedAppt={vm.selectedAppt}
            loading={vm.loading}
            page={vm.page}
            pageSize={vm.pageSize}
            totalPages={vm.totalPages}
            totalElements={vm.totalElements}
            activeFilters={vm.activeFilters}
            onResetFilters={vm.resetFilters}
            onPageChange={vm.setPage}
            onPageSizeChange={vm.setPageSize}
            onSelect={vm.setSelectedAppt}
            onEdit={vm.setEditAppt}
            onCancel={vm.openCancelModal}
            onDelete={vm.openDeleteModal}
          />
        </div>

        {vm.selectedAppt && (
          <AdminAppointmentDetailIsland
            appointment={vm.selectedAppt}
            veterinarians={vm.veterinarians}
            services={vm.services}
            pets={vm.pets}
            users={vm.users}
            speciesList={vm.speciesList}
            onClose={() => vm.setSelectedAppt(null)}
            onEdit={vm.setEditAppt}
            onCancel={vm.openCancelModal}
            onDelete={vm.openDeleteModal}
          />
        )}
      </div>

      <AdminCreateAppointmentModal
        isOpen={vm.isCreateOpen}
        onClose={() => vm.setIsCreateOpen(false)}
        onCreate={vm.createAppointment}
        onCheckSlot={vm.checkSlotAvailability}
        veterinarians={vm.veterinarians}
        services={vm.services}
        pets={vm.pets}
        users={vm.users}
        appointments={vm.appointments}
      />

      <AdminEditAppointmentModal
        isOpen={Boolean(vm.editAppt)}
        appointment={vm.editAppt}
        onClose={() => vm.setEditAppt(null)}
        onUpdate={vm.updateAppointment}
        onCheckSlot={vm.checkSlotAvailability}
        veterinarians={vm.veterinarians}
        services={vm.services}
        pets={vm.pets}
      />

      <ConfirmModal
        isOpen={Boolean(vm.cancelAppt)}
        title="Отмена записи"
        description={cancelDt ? `${cancelPetName} — ${cancelServiceName} (${cancelDt.date}, ${cancelDt.time})` : undefined}
        confirmLabel="Подтвердить отмену"
        cancelLabel="Назад"
        tone="destructive"
        loading={vm.isCancelling}
        error={vm.cancelError}
        onClose={vm.closeCancelModal}
        onConfirm={vm.confirmCancelAppt}
      >
        <div className="small muted">Врач: <strong>{cancelVetName}</strong></div>
        <div className="field">
          <span className="field-label">Типичные причины</span>
          <div className="chips">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`chip ${vm.cancelReason === r ? 'on' : ''}`}
                onClick={() => vm.setCancelReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="mc-reason">Причина отмены <span className="req">*</span></label>
          <input
            id="mc-reason"
            className="input"
            value={vm.cancelReason}
            onChange={(e) => vm.setCancelReason(e.target.value)}
            placeholder="Укажите подробную причину отмены…"
          />
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={Boolean(vm.deleteAppt)}
        title="Удалить запись на приём?"
        description={
          vm.deleteAppt
            ? `Запись #${vm.deleteAppt.id.slice(0, 8)} (${deletePetName} — ${deleteServiceName}) будет безвозвратно удалена.`
            : undefined
        }
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        tone="destructive"
        loading={vm.isDeleting}
        error={vm.deleteError}
        onClose={vm.closeDeleteModal}
        onConfirm={vm.confirmDeleteAppt}
      />
    </>
  );
}

/**
 * Страница администрирования записей на приём клиники Chiron.
 */
export default function AdminAppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="island grow">
          <div className="empty">
            <span className="spinner" aria-hidden="true" />
            <span className="muted">Загрузка записей…</span>
          </div>
        </div>
      }
    >
      <AdminAppointmentsContent />
    </Suspense>
  );
}
