'use client';

import React, { useState, useEffect } from 'react';
import type { Appointment, Pet } from '@/modules/client/types';
import { ConfirmModal } from '@/shared/components';
import { formatDateShort, formatSlotTime } from '@/shared/lib';

export interface VetCancelAppointmentModalProps {
  appointment: Appointment | null;
  petsMap?: Record<string, Pet>;
  servicesMap?: Record<string, string>;
  loading?: boolean;
  error?: string | null;
  onConfirm: (cancelReason: string | null) => Promise<void> | void;
  onClose: () => void;
}

/**
 * Диалог подтверждения отмены записи врачом с необязательной причиной отмены.
 */
export const VetCancelAppointmentModal: React.FC<VetCancelAppointmentModalProps> = ({
  appointment,
  petsMap,
  servicesMap,
  loading = false,
  error = null,
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (appointment) {
      setReason('');
    }
  }, [appointment]);

  if (!appointment) return null;

  const petName =
    appointment.pet?.name ||
    appointment.petName ||
    petsMap?.[appointment.petId]?.name ||
    'Пациент';
  const serviceName =
    appointment.serviceName ||
    appointment.service?.name ||
    servicesMap?.[appointment.serviceId] ||
    'Приём';

  return (
    <ConfirmModal
      isOpen={!!appointment}
      title="Отменить запись?"
      description={`${petName} — ${serviceName}, ${formatDateShort(appointment.startAt)} в ${formatSlotTime(appointment.startAt)}. Будут записаны автор и время отмены.`}
      confirmLabel="Отменить запись"
      cancelLabel="Не сейчас"
      tone="destructive"
      size="sm"
      loading={loading}
      error={error}
      onConfirm={() => onConfirm(reason.trim() || null)}
      onClose={onClose}
    >
      <div className="field">
        <label className="field-label" htmlFor="vet-cancel-reason">
          Причина отмены
        </label>
        <textarea
          id="vet-cancel-reason"
          className="textarea"
          maxLength={1000}
          placeholder="Укажите причину (необязательно)"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 1000))}
          disabled={loading}
        />
        <span className="field-hint">Увидит владелец питомца</span>
      </div>
    </ConfirmModal>
  );
};
