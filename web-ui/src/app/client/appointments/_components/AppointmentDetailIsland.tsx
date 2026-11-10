'use client';

import React from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import { getDoctorDisplay } from '@/utils/doctorHelpers';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateRu,
  formatDateShort,
  formatSlotTime,
} from '@/shared/lib';

export interface AppointmentDetailIslandProps {
  /** Выбранная запись для детального просмотра */
  appointment: Appointment;
  /** Словарь питомцев клиента по ID */
  petsMap: Record<string, Pet>;
  /** Словарь услуг клиники по ID */
  servicesMap: Record<string, Service>;
  /** Словарь ветеринаров по ID (опционально) */
  veterinariansMap?: Record<string, Veterinarian>;
  /** Функция закрытия острова детального просмотра */
  onClose: () => void;
  /** Функция открытия модального окна отмены записи */
  onRequestCancel: () => void;
}

/**
 * Правый остров детального просмотра выбранной записи на приём:
 * отображает подробные сведения об услуге, питомце, враче, статусе,
 * дате и времени, комментариях клиента и врача, а также действие отмены записи.
 */
export function AppointmentDetailIsland({
  appointment,
  petsMap,
  servicesMap,
  veterinariansMap,
  onClose,
  onRequestCancel,
}: AppointmentDetailIslandProps) {
  const vet =
    (veterinariansMap && appointment.veterinarianId && veterinariansMap[appointment.veterinarianId]) ||
    appointment.veterinarian;
  const doctorName = vet ? getDoctorDisplay(vet).name : appointment.veterinarianName || null;
  const statusShort = APPOINTMENT_STATUS_META[appointment.status]?.short || appointment.status;

  return (
    <section
      className="island detail-island"
      style={{ flex: 'none' }}
      aria-label="Детали записи"
    >
      <div className="island-head">
        <div className="col" style={{ gap: '2px', minWidth: 0 }}>
          <span className="h2" style={{ wordBreak: 'break-word' }}>
            {servicesMap[appointment.serviceId]?.name || 'Приём'}
          </span>
          <span className="cell-sub">
            {formatDateRu(appointment.startAt)}, в {formatSlotTime(appointment.startAt)}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Закрыть"
          onClick={onClose}
        >
          <X className="ic" />
        </button>
      </div>

      <div className="island-body">
        <div className="col" style={{ gap: '16px' }}>
          <div className="row wrap">
            <span className={`badge st badge-${appointment.status}`}>{statusShort}</span>
          </div>

          <dl className="kv" style={{ margin: 0 }}>
            <dt>Питомец</dt>
            <dd>{petsMap[appointment.petId]?.name || 'Питомец'}</dd>

            {doctorName && (
              <>
                <dt>Врач</dt>
                <dd>{doctorName}</dd>
              </>
            )}

            <dt>Дата и время</dt>
            <dd className="tnum">
              {formatDateShort(appointment.startAt)} в {formatSlotTime(appointment.startAt)}
            </dd>

            <dt>Стоимость</dt>
            <dd className="cell-main tnum">
              {appointment.priceSnapshot != null ? formatCurrency(appointment.priceSnapshot) : '—'}
            </dd>
          </dl>

          {appointment.clientComment && (
            <div className="col" style={{ gap: '6px' }}>
              <span className="section-title">Ваш комментарий</span>
              <div className="note">{appointment.clientComment}</div>
            </div>
          )}

          {appointment.vetNotes && (
            <div className="col" style={{ gap: '6px' }}>
              <span className="section-title">Заметки врача</span>
              <div className="note">{appointment.vetNotes}</div>
            </div>
          )}

          {appointment.status === 'CANCELLED' && (
            <div className="alert alert-info">
              <AlertCircle className="ic" />
              <div>
                <b>Запись отменена.</b>{' '}
                {appointment.cancelReason ? `Причина: ${appointment.cancelReason}` : ''}
              </div>
            </div>
          )}
        </div>
      </div>

      {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
        <div className="island-foot">
          <span className="small muted">Отмена доступна до начала приёма</span>
          <button
            type="button"
            className="btn btn-destructive-outline"
            onClick={onRequestCancel}
          >
            <XCircle className="ic" />
            <span>Отменить запись</span>
          </button>
        </div>
      )}
    </section>
  );
}
