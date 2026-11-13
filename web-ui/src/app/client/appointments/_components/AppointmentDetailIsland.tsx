'use client';

import React from 'react';
import Link from 'next/link';
import { X, XCircle, Repeat } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import {
  APPOINTMENT_STATUS_META,
  formatCurrency,
  formatDateShort,
  formatSlotTime,
} from '@/shared/lib';
import {
  computeDurationMinutes,
  formatFollowUpParentLabel,
  resolveCancelledByLabel,
  resolveVetName,
} from './utils';

export interface AppointmentDetailIslandProps {
  appointment: Appointment;
  petsMap: Record<string, Pet>;
  servicesMap: Record<string, Service>;
  veterinariansMap: Record<string, Veterinarian>;
  speciesMap?: Record<string, string>;
  parentApptsMap?: Record<string, Appointment>;
  currentUserId?: string;
  onSelectFollowUpParent: (appointmentId: string) => void;
  onClose: () => void;
  onRequestCancel: () => void;
}

/**
 * Правый остров детального просмотра выбранной записи на приём.
 */
export function AppointmentDetailIsland({
  appointment,
  petsMap,
  servicesMap,
  veterinariansMap,
  speciesMap = {},
  parentApptsMap = {},
  currentUserId,
  onSelectFollowUpParent,
  onClose,
  onRequestCancel,
}: AppointmentDetailIslandProps) {
  const pet = petsMap[appointment.petId] || appointment.pet;
  const service = servicesMap[appointment.serviceId] || appointment.service;
  const serviceName = service?.name || appointment.serviceName || 'Приём';
  const petName = pet?.name || appointment.petName || 'Питомец';
  const speciesName =
    pet?.species?.name ||
    pet?.speciesName ||
    (pet?.speciesId ? speciesMap[pet.speciesId] : undefined) ||
    '';
  const vetName = resolveVetName(appointment, veterinariansMap);
  const statusLabel =
    APPOINTMENT_STATUS_META[appointment.status]?.label || appointment.status;

  const dateLabel = formatDateShort(appointment.startAt);
  const timeRange = `${formatSlotTime(appointment.startAt)}–${formatSlotTime(appointment.endAt)}`;
  const durationMin = computeDurationMinutes(appointment.startAt, appointment.endAt);
  const price = appointment.priceSnapshot ?? appointment.price;

  const parentAppt = appointment.followUpOf
    ? parentApptsMap[appointment.followUpOf]
    : undefined;
  const parentLabel = appointment.followUpOf
    ? formatFollowUpParentLabel(parentAppt, servicesMap)
    : '';

  const cancelledByLabel = resolveCancelledByLabel(
    appointment.cancelledBy,
    currentUserId,
    veterinariansMap
  );
  const cancelledAtLabel = appointment.cancelledAt
    ? `${formatDateShort(appointment.cancelledAt)} ${formatSlotTime(appointment.cancelledAt)}`
    : '—';
  const cancelReasonText =
    appointment.cancelReason || appointment.cancellationReason || 'Не указана';

  const canCancel =
    (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') &&
    new Date(appointment.startAt).getTime() > Date.now();

  return (
    <section className="island detail-island" aria-label="Детали записи">
      <div className="island-head">
        <div className="col" style={{ gap: '2px', minWidth: 0 }}>
          <span className="h2" style={{ wordBreak: 'break-word' }}>
            {serviceName}
          </span>
          <span className="cell-sub tnum">
            {dateLabel}, {timeRange}
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
            <span className={`badge st badge-${appointment.status}`}>{statusLabel}</span>
            {appointment.followUpOf && (
              <span className="badge badge-accent">
                <Repeat className="ic" style={{ width: '12px', height: '12px' }} />
                Повторный приём
              </span>
            )}
          </div>

          <dl className="kv" style={{ margin: 0 }}>
            <dt>Питомец</dt>
            <dd>
              <Link
                href={`/client/pets?sel=${encodeURIComponent(appointment.petId)}&tab=appts`}
                className="linkish"
              >
                {petName}
              </Link>
              {speciesName && <span className="muted"> · {speciesName}</span>}
            </dd>

            <dt>Врач</dt>
            <dd>{vetName}</dd>

            <dt>Дата и время</dt>
            <dd className="tnum">
              {dateLabel}, {timeRange}
              {durationMin != null && <span className="muted"> · {durationMin} мин</span>}
            </dd>

            <dt>Стоимость</dt>
            <dd className="tnum">{price != null ? formatCurrency(price) : '—'}</dd>

            {appointment.followUpOf && (
              <>
                <dt>Исходный приём</dt>
                <dd>
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => onSelectFollowUpParent(appointment.followUpOf!)}
                  >
                    {parentLabel}
                  </button>
                </dd>
              </>
            )}
          </dl>

          <div className="col" style={{ gap: '6px' }}>
            <span className="section-title">Ваш комментарий</span>
            <div className="note">{appointment.clientComment || '—'}</div>
          </div>

          <div className="col" style={{ gap: '6px' }}>
            <span className="section-title">Заметки врача</span>
            <div className="note">
              {appointment.vetNotes || appointment.notes || 'Врач ещё не оставил заметок'}
            </div>
          </div>

          {appointment.status === 'CANCELLED' && (
            <div className="col" style={{ gap: '6px' }}>
              <span className="section-title">Отмена</span>
              <dl className="kv" style={{ margin: 0 }}>
                <dt>Кто отменил</dt>
                <dd>{cancelledByLabel}</dd>
                <dt>Когда</dt>
                <dd className="tnum">{cancelledAtLabel}</dd>
                <dt>Причина</dt>
                <dd>{cancelReasonText}</dd>
              </dl>
            </div>
          )}
        </div>
      </div>

      {canCancel && (
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
