'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, XCircle, Repeat } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian, Species } from '@/modules/clinic/types';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { AppointmentStatusBadge } from '@/shared/components';
import {
  formatCurrency,
  formatDateShort,
  formatSlotTime,
  getSpeciesTone,
  getSpeciesStyle,
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
  speciesList?: Species[];
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
  speciesList = [],
  parentApptsMap = {},
  currentUserId,
  onSelectFollowUpParent,
  onClose,
  onRequestCancel,
}: AppointmentDetailIslandProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const pet = petsMap[appointment.petId] || appointment.pet;
  const service = servicesMap[appointment.serviceId] || appointment.service;
  const servicesCount = appointment.services?.length || 1;
  const primaryServiceName =
    appointment.services?.[0]?.nameSnapshot || appointment.serviceName || service?.name || 'Приём';
  const headerServiceName =
    servicesCount > 1
      ? `${primaryServiceName} (+${servicesCount - 1})`
      : primaryServiceName;
  const petName = pet?.name || appointment.petName || 'Питомец';
  const speciesName =
    pet?.species?.name ||
    pet?.speciesName ||
    (pet?.speciesId ? speciesMap[pet.speciesId] : undefined) ||
    '';
  const vetName = resolveVetName(appointment, veterinariansMap);
  const tone = getSpeciesTone(pet?.species?.name || speciesName || pet?.speciesId || 'cat', speciesList);

  const dateLabel = formatDateShort(appointment.startAt);
  const timeRange = `${formatSlotTime(appointment.startAt)}–${formatSlotTime(appointment.endAt)}`;
  const durationMin = computeDurationMinutes(appointment.startAt, appointment.endAt);
  const price =
    appointment.actualTotal ??
    appointment.estimatedTotal ??
    appointment.priceSnapshot ??
    appointment.price;

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
      <button
        type="button"
        className="detail-pinned-close"
        aria-label="Закрыть"
        onClick={onClose}
      >
        <X className="ic" />
      </button>

      <div className="island-head">
        <div className="row" style={{ minWidth: 0, gap: 12 }}>
          <PetAvatar
            pet={pet}
            tone={tone}
            species={tone}
            iconSize={20}
            variant="full"
            className={`t-ava tone-${tone} detail-head-ava`}
            style={getSpeciesStyle(pet?.speciesId, speciesList)}
          />
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <span className="h2" style={{ wordBreak: 'break-word' }}>
              {petName} — {headerServiceName}
            </span>
            <span className="cell-sub tnum">
              {dateLabel}, {timeRange}
            </span>
          </div>
        </div>
      </div>

      <div className="island-body">
        <div className="col" style={{ gap: '16px' }}>
          <div className="row wrap">
            <AppointmentStatusBadge status={appointment.status} />
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
            <dd>
              {appointment.veterinarianId ? (
                <Link href={`/veterinarians?open=${appointment.veterinarianId}`} className="linkish">
                  {vetName}
                </Link>
              ) : (
                vetName
              )}
            </dd>

            <dt>Дата и время</dt>
            <dd className="tnum">
              {dateLabel}, {timeRange}
              {durationMin != null && <span className="muted"> · {durationMin} мин</span>}
            </dd>

            <dt>Стоимость</dt>
            <dd className="tnum font-bold">{price != null ? formatCurrency(price) : '—'}</dd>

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

          {appointment.services && appointment.services.length > 1 && (
            <div className="col" style={{ gap: '6px' }}>
              <span className="section-title">
                Состав услуг ({appointment.services.length})
              </span>
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  background: 'color-mix(in srgb, var(--card) 60%, transparent)',
                }}
              >
                {appointment.services.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      gap: '12px',
                      borderBottom:
                        idx < appointment.services!.length - 1
                          ? '1px solid var(--border)'
                          : 'none',
                    }}
                  >
                    <div className="col" style={{ gap: '2px', minWidth: 0, flex: 1 }}>
                      <div className="row items-center" style={{ gap: '8px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--foreground)' }}>
                          {s.nameSnapshot}
                        </span>
                        {s.isPerformed === true ? (
                          <span
                            className="badge badge-success"
                            style={{ fontSize: '10px', height: '18px', padding: '0 6px' }}
                          >
                            Оказана
                          </span>
                        ) : s.isPerformed === false ? (
                          <span
                            className="badge badge-outline"
                            style={{ fontSize: '10px', height: '18px', padding: '0 6px' }}
                          >
                            Не оказана
                          </span>
                        ) : null}
                      </div>
                      {s.durationMinSnapshot ? (
                        <span className="cell-sub text-xs">
                          {s.durationMinSnapshot} мин
                        </span>
                      ) : null}
                    </div>
                    <div
                      className="tnum font-bold text-sm"
                      style={{ flexShrink: 0, color: 'var(--foreground)' }}
                    >
                      {formatCurrency(s.priceSnapshot)}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'color-mix(in srgb, var(--muted) 40%, transparent)',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <span className="small muted">Итого по услугам:</span>
                  <span
                    className="tnum font-bold text-sm"
                    style={{ color: 'var(--primary-text, var(--primary))' }}
                  >
                    {formatCurrency(price)}
                  </span>
                </div>
              </div>
            </div>
          )}

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
