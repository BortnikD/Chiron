'use client';

import React, { useState, useEffect } from 'react';
import { Appointment, Veterinarian, Service, Pet, User } from '../../../../types';
import { adminApi } from '../../../../api';
import { AlertCircle, X } from 'lucide-react';
import { getVetName, getServiceName, getPet, formatDateTime } from './utils';

export interface AdminCancelAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  users: User[];
  onClose: () => void;
  onSuccess: (updated: Appointment) => void;
}

const COMMON_REASONS = [
  'По просьбе клиента',
  'Врач не может принять',
  'Питомец выздоровел',
  'Ошибка при записи',
  'Клиент не выходит на связь',
];

/**
 * Модальное окно отмены записи на приём с указанием причины.
 */
export const AdminCancelAppointmentModal: React.FC<AdminCancelAppointmentModalProps> = ({
  isOpen,
  appointment,
  veterinarians,
  services,
  pets,
  users,
  onClose,
  onSuccess,
}) => {
  const [cancelReason, setCancelReason] = useState<string>('По просьбе клиента');
  const [cancelledBy, setCancelledBy] = useState<string>('Администратор');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCancelReason('По просьбе клиента');
    setCancelledBy('Администратор');
    setError(null);
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const pet = getPet(appointment.petId, pets);
  const serviceName = getServiceName(appointment.serviceId, services);
  const vetName = getVetName(appointment.veterinarianId, veterinarians, users);
  const dt = formatDateTime(appointment.startAt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setError('Укажите причину отмены');
      return;
    }

    setCancelling(true);
    setError(null);
    try {
      const payload = {
        status: 'CANCELLED' as const,
        cancelReason: cancelReason.trim(),
        cancelledBy: cancelledBy.trim() || 'Администратор',
      };

      const updated = await adminApi.updateAppointment(appointment.id, payload);
      onSuccess(updated || { ...appointment, ...payload });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Ошибка при отмене записи');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog dialog-sm"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-head">
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <div>
              <span className="dialog-title">Отмена записи</span>
              <span className="dialog-desc">
                {pet?.name || 'Питомец'} — {serviceName} ({dt.date}, {dt.time})
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              onClick={onClose}
              aria-label="Закрыть"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            <div className="small muted">
              Врач: <strong>{vetName}</strong>
            </div>

            <div className="field">
              <span className="field-label">Типичные причины</span>
              <div className="chips">
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`chip ${cancelReason === r ? 'on' : ''}`}
                    onClick={() => setCancelReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="mc-reason">
                Причина отмены <span className="req">*</span>
              </label>
              <input
                id="mc-reason"
                className="input"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Укажите подробную причину отмены…"
                required
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="mc-by">
                Кем отменена
              </label>
              <input
                id="mc-by"
                className="input"
                value={cancelledBy}
                onChange={(e) => setCancelledBy(e.target.value)}
                placeholder="Администратор"
              />
            </div>

            {error && (
              <div className="alert" role="alert">
                <AlertCircle size={16} />
                <div>{error}</div>
              </div>
            )}
          </div>

          <div className="dialog-foot">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={cancelling}
            >
              Назад
            </button>
            <button
              type="submit"
              className="btn btn-destructive"
              disabled={cancelling}
            >
              {cancelling ? 'Отмена…' : 'Подтвердить отмену'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
