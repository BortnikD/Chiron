'use client';

import React from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';
import { Appointment, Pet, Service, Veterinarian } from '../../../../types';
import { getDoctorDisplay } from '../../../../utils/doctorHelpers';
import { STATUS_SHORT } from './constants';

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
  // Определение имени врача из словаря либо из свойств записи
  const doctorName =
    (veterinariansMap && appointment.veterinarianId && veterinariansMap[appointment.veterinarianId]
      ? getDoctorDisplay(veterinariansMap[appointment.veterinarianId]).name
      : appointment.veterinarianName || appointment.veterinarian?.user?.fullName) || null;

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
            {new Date(appointment.startAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            , в{' '}
            {new Date(appointment.startAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Europe/Moscow',
            })}
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
            <span className={`badge st badge-${appointment.status}`}>
              {STATUS_SHORT[appointment.status] || appointment.status}
            </span>
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
              {new Date(appointment.startAt).toLocaleDateString('ru-RU')} в{' '}
              {new Date(appointment.startAt).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>

            <dt>Стоимость</dt>
            <dd className="cell-main tnum">
              {appointment.priceSnapshot
                ? `${appointment.priceSnapshot.toLocaleString('ru-RU')} ₽`
                : '—'}
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

      {/* Возможность отмены записи до начала приёма */}
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
