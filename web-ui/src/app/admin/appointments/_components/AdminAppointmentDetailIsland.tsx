'use client';

import React from 'react';
import { X, Trash2, Edit2, AlertCircle } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Veterinarian, Service } from '@/modules/clinic/types';
import type { User } from '@/shared/types';
import {
  APPOINTMENT_STATUS_META,
  canTransitionAppointmentStatus,
  formatCurrency,
  formatDateShort,
  formatDateTimeCompact,
  formatSlotTime,
} from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export interface AdminAppointmentDetailIslandProps {
  appointment: Appointment;
  veterinarians: Veterinarian[];
  services: Service[];
  pets: Pet[];
  users: User[];
  onClose: () => void;
  onEdit: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
}

/**
 * Правый master-detail остров с детальной информацией о записи, клиенте, питомце и враче.
 */
export const AdminAppointmentDetailIsland: React.FC<AdminAppointmentDetailIslandProps> = ({
  appointment,
  veterinarians,
  services,
  pets,
  users,
  onClose,
  onEdit,
  onCancel,
  onDelete,
}) => {
  const pet = pets.find((p) => p.id === appointment.petId);
  const serviceName = services.find((s) => s.id === appointment.serviceId)?.name || 'Услуга клиники';
  const rawVet = veterinarians.find((v) => v.id === appointment.veterinarianId);
  const vetName = getDoctorDisplay(rawVet).fullName;
  const ownerName = (pet?.ownerId && users.find((u) => u.id === pet.ownerId)?.fullName) || '—';
  const cancelledByName =
    (appointment.cancelledBy && users.find((u) => u.id === appointment.cancelledBy)?.fullName) ||
    appointment.cancelledBy ||
    '—';
  const dtStart = formatDateTimeCompact(appointment.startAt);
  const dtEnd = formatDateTimeCompact(appointment.endAt);
  const sInfo = APPOINTMENT_STATUS_META[appointment.status] || {
    label: appointment.status,
    short: appointment.status,
    cls: 'badge-outline',
  };

  return (
    <section className="island detail-island" aria-label="Запись">
      <div className="island-head">
        <div className="col" style={{ gap: 2 }}>
          <span className="h2" style={{ wordBreak: 'break-word' }}>
            {pet?.name || 'Питомец'} — {serviceName}
          </span>
          <span className="cell-sub tnum">
            {dtStart.date}, {dtStart.time}–{dtEnd.time}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      <div className="island-body" style={{ paddingTop: 14 }}>
        <div className="col" style={{ gap: 16 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <span className={`badge st ${sInfo.cls}`}>{sInfo.label}</span>
            {appointment.followUpOf && (
              <span className="badge badge-accent">Повторный приём</span>
            )}
          </div>

          <dl className="kv" style={{ margin: 0 }}>
            <dt>Питомец</dt>
            <dd>{pet?.name || 'Питомец'}</dd>
            <dt>Владелец</dt>
            <dd>{ownerName}</dd>
            <dt>Врач</dt>
            <dd>{vetName}</dd>
            <dt>Услуга</dt>
            <dd>{serviceName}</dd>
            <dt>Время</dt>
            <dd className="tnum">
              {dtStart.date}, {dtStart.time}–{dtEnd.time}
            </dd>
            <dt>Цена</dt>
            <dd className="tnum">
              {formatCurrency(appointment.priceSnapshot || appointment.price)}
            </dd>
            {appointment.followUpOf && (
              <>
                <dt>Повторный к</dt>
                <dd className="tnum">{appointment.followUpOf.slice(0, 8)}…</dd>
              </>
            )}
          </dl>

          <div className="col" style={{ gap: 6 }}>
            <span className="section-title">Комментарий клиента</span>
            <div className="note">{appointment.clientComment || '—'}</div>
          </div>

          <div className="col" style={{ gap: 6 }}>
            <span className="section-title">Заметки врача</span>
            <div className="note">
              {appointment.vetNotes || appointment.notes || '—'}
            </div>
          </div>

          {appointment.status === 'CANCELLED' && (
            <dl className="kv" style={{ margin: 0 }}>
              <dt>Отменил</dt>
              <dd>{cancelledByName}</dd>
              <dt>Когда</dt>
              <dd className="tnum">
                {appointment.cancelledAt
                  ? `${formatDateShort(appointment.cancelledAt)}, ${formatSlotTime(appointment.cancelledAt)}`
                  : '—'}
              </dd>
              <dt>Причина</dt>
              <dd>
                {appointment.cancelReason || appointment.cancellationReason || '—'}
              </dd>
            </dl>
          )}
        </div>
      </div>

      <div className="island-foot">
        <button
          type="button"
          className="btn btn-destructive-outline btn-sm"
          onClick={() => onDelete(appointment)}
        >
          <Trash2 size={14} />
          Удалить
        </button>
        {appointment.status !== 'CANCELLED' &&
          canTransitionAppointmentStatus(appointment.status, 'CANCELLED') && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onCancel(appointment)}
            >
              <AlertCircle size={14} />
              Отменить
            </button>
          )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => onEdit(appointment)}
        >
          <Edit2 size={14} />
          Изменить
        </button>
      </div>
    </section>
  );
};
