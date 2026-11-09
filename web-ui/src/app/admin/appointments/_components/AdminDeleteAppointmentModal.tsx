'use client';

import React from 'react';
import { Appointment } from '../../../../types';

export interface AdminDeleteAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  petName?: string;
  serviceName?: string;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Диалог подтверждения безвозвратного удаления записи на приём.
 */
export const AdminDeleteAppointmentModal: React.FC<AdminDeleteAppointmentModalProps> = ({
  isOpen,
  appointment,
  petName = 'Питомец',
  serviceName = 'Услуга',
  isDeleting = false,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !appointment) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog dialog-sm"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <span className="dialog-title">Удалить запись на приём?</span>
          <span className="dialog-desc">
            Запись #{appointment.id.slice(0, 8)} ({petName} — {serviceName}) будет безвозвратно удалена.
          </span>
        </div>
        <div className="dialog-foot">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Удаление…' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
};
