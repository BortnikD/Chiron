'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  CalendarCheck,
  CheckCheck,
  ChevronRight,
  Stethoscope,
  X,
} from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { AppointmentStatus } from '@/shared/types';
import {
  APPOINTMENT_STATUS_META,
  calculateAgeRu,
  canTransitionAppointmentStatus,
  formatApiError,
  formatDateRu,
  formatSlotTime,
  formatWeightRu,
  getSpeciesTone,
  timeToMinutes,
} from '@/shared/lib';
import { PetAvatar } from '@/components/ui/EntityAvatar';
import { VetCancelAppointmentModal } from './VetCancelAppointmentModal';
import { getPetName } from './utils';

const NEXT_ACTIONS: Array<{ to: AppointmentStatus; label: string; cls: string }> = [
  { to: 'CONFIRMED', label: 'Подтвердить', cls: 'btn-primary' },
  { to: 'COMPLETED', label: 'Завершить', cls: 'btn-primary' },
  { to: 'NO_SHOW', label: 'Неявка', cls: 'btn-outline' },
  { to: 'CANCELLED', label: 'Отменить', cls: 'btn-destructive-outline' },
];

export interface VetDashboardSideColumnProps {
  nowMinutes: number;
  nextAppointment: Appointment | null;
  pendingAppointments: Appointment[];
  servicesMap: Record<string, string>;
  petsMap: Record<string, Pet>;
  speciesMap: Record<string, string>;
  loading?: boolean;
  selectedAppointmentId?: string | null;
  onExpandPending?: () => void;
  onSelectAppointment: (appt: Appointment) => void;
  onUpdateStatus: (
    apptId: string,
    status: AppointmentStatus,
    cancelReason?: string | null
  ) => Promise<void>;
}

export const VetDashboardSideColumn: React.FC<VetDashboardSideColumnProps> = ({
  nowMinutes,
  nextAppointment,
  pendingAppointments,
  servicesMap,
  petsMap,
  speciesMap,
  loading = false,
  selectedAppointmentId = null,
  onExpandPending,
  onSelectAppointment,
  onUpdateStatus,
}) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAllPending, setShowAllPending] = useState(false);
  const visiblePending = showAllPending ? pendingAppointments : pendingAppointments.slice(0, 8);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const nextPet = nextAppointment
    ? nextAppointment.pet || petsMap[nextAppointment.petId] || null
    : null;
  const nextSpeciesName = nextPet
    ? nextPet.species?.name ||
      nextPet.speciesName ||
      speciesMap[nextPet.speciesId] ||
      '—'
    : '—';
  const nextTone = nextPet
    ? getSpeciesTone(
        nextPet.species?.name || nextPet.speciesName || nextPet.speciesId,
        speciesMap
      )
    : 'cat';

  const nextInLabel = (() => {
    if (!nextAppointment) return '—';
    const sMin = timeToMinutes(formatSlotTime(nextAppointment.startAt));
    const eMin = timeToMinutes(formatSlotTime(nextAppointment.endAt));
    const diff = sMin - nowMinutes;
    if (diff > 0) {
      return `через ${diff >= 60 ? `${Math.floor(diff / 60)} ч ` : ''}${diff % 60} мин`;
    }
    if (nowMinutes < eMin) return 'идёт сейчас';
    return 'ранее сегодня';
  })();

  const nextActions = nextAppointment
    ? NEXT_ACTIONS.filter(
        (act) =>
          nextAppointment.status !== act.to &&
          canTransitionAppointmentStatus(nextAppointment.status, act.to)
      )
    : [];

  const handleQuickStatus = async (appt: Appointment, to: AppointmentStatus) => {
    if (to === 'CANCELLED') {
      setCancelError(null);
      setCancelTarget(appt);
      return;
    }
    setBusyId(appt.id);
    try {
      await onUpdateStatus(appt.id, to);
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmCancel = async (reason: string | null) => {
    if (!cancelTarget) return;
    setBusyId(cancelTarget.id);
    setCancelError(null);
    try {
      await onUpdateStatus(cancelTarget.id, 'CANCELLED', reason);
      setCancelTarget(null);
    } catch (err: unknown) {
      setCancelError(formatApiError(err, 'Не удалось отменить запись'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="content-col w-full md:w-[340px] xl:w-[400px] flex-none">
        <section className="island" style={{ flex: 'none' }} aria-label="Ближайший приём">
          <div className="island-head">
            <span className="island-title">
              <Stethoscope className="ic" />
              Ближайший приём
            </span>
            <span className="small muted">{nextInLabel}</span>
          </div>

          {nextAppointment ? (
            <div className="col" style={{ gap: '14px', padding: '0 16px 16px' }}>
              <div className="row">
                <PetAvatar
                  pet={nextPet}
                  tone={nextTone}
                  species={nextTone}
                  iconSize={26}
                  variant="full"
                  className={`t-ava tone-${nextTone}`}
                  style={{ width: '56px', height: '56px', borderRadius: '16px' }}
                />
                <div className="col" style={{ gap: '2px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 650 }}>
                    {getPetName(nextAppointment, petsMap)}
                  </span>
                  <span className="muted">
                    {nextSpeciesName} · {calculateAgeRu(nextPet?.birthDate)} ·{' '}
                    {formatWeightRu(nextPet?.weightKg)}
                  </span>
                </div>
              </div>

              <div className="row between">
                <span className="kpi-value accent" style={{ fontSize: '30px' }}>
                  {formatSlotTime(nextAppointment.startAt)}
                </span>
                <span className={`badge st badge-${nextAppointment.status}`}>
                  {APPOINTMENT_STATUS_META[nextAppointment.status]?.label || nextAppointment.status}
                </span>
              </div>

              <span className="cell-main">
                {nextAppointment.serviceName ||
                  nextAppointment.service?.name ||
                  servicesMap[nextAppointment.serviceId] ||
                  'Приём'}{' '}
                <span className="muted" style={{ fontWeight: 400 }}>
                  · до {formatSlotTime(nextAppointment.endAt)}
                </span>
              </span>

              {nextAppointment.clientComment && (
                <div className="note">«{nextAppointment.clientComment}»</div>
              )}

              {nextPet?.notes && (
                <div className="alert alert-info">
                  <AlertCircle className="ic" />
                  <div>{nextPet.notes}</div>
                </div>
              )}

              <div className="row wrap" style={{ gap: '6px' }}>
                {nextActions.map((b) => (
                  <button
                    key={b.to}
                    type="button"
                    className={`btn ${b.cls}`}
                    disabled={busyId === nextAppointment.id}
                    onClick={() => void handleQuickStatus(nextAppointment, b.to)}
                  >
                    {b.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onSelectAppointment(nextAppointment)}
                >
                  Открыть
                  <ChevronRight className="ic" />
                </button>
              </div>
            </div>
          ) : (
            <div className="empty" style={{ padding: '24px 16px' }}>
              <span>{loading ? 'Загрузка…' : 'Ближайших приёмов на сегодня нет'}</span>
            </div>
          )}
        </section>

        <section className="island grow" aria-label="Ожидают подтверждения">
          <div className="island-head">
            <span className="island-title">
              <CalendarCheck className="ic" />
              Ожидают подтверждения{' '}
              <span className="count">{pendingAppointments.length}</span>
            </span>
          </div>
          <div className="island-body" style={{ padding: '0 8px 8px' }}>
            {pendingAppointments.length === 0 ? (
              <div className="empty" style={{ padding: '24px' }}>
                <CheckCheck className="ic ic-20" />
                <span>Все записи подтверждены</span>
              </div>
            ) : (
              <>
              {visiblePending.map((a) => {
                const dd = formatDateRu(a.startAt, { day: '2-digit' });
                const mon = formatDateRu(a.startAt, { month: 'short' }).replace('.', '');
                const startStr = formatSlotTime(a.startAt);
                const petName = getPetName(a, petsMap);
                const svcName =
                  a.serviceName || a.service?.name || servicesMap[a.serviceId] || 'Приём';

                return (
                  <div
                    key={a.id}
                    className={`lrow ${selectedAppointmentId === a.id ? 'sel' : ''}`}
                    style={{ cursor: 'default' }}
                  >
                    <span className="datebox">
                      <b>{dd}</b>
                      <span>{mon}</span>
                    </span>
                    <span className="col" style={{ gap: 0 }}>
                      <button
                        type="button"
                        className="linkish"
                        style={{ color: 'var(--foreground)', fontWeight: 600, textAlign: 'left' }}
                        onClick={() => onSelectAppointment(a)}
                      >
                        {startStr} · {petName}
                      </button>
                      <span className="cell-sub">{svcName}</span>
                    </span>
                    <span className="row" style={{ gap: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busyId === a.id}
                        onClick={() => void handleQuickStatus(a, 'CONFIRMED')}
                      >
                        Подтвердить
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label="Отменить запись"
                        title="Отменить"
                        disabled={busyId === a.id}
                        onClick={() => void handleQuickStatus(a, 'CANCELLED')}
                      >
                        <X className="ic" />
                      </button>
                    </span>
                  </div>
                );
              })}
              {!showAllPending && pendingAppointments.length > 8 && (
                <div style={{ padding: '8px 8px 4px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-block"
                    onClick={() => {
                      setShowAllPending(true);
                      onExpandPending?.();
                    }}
                  >
                    Показать все ({pendingAppointments.length})
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        </section>
      </div>

      <VetCancelAppointmentModal
        appointment={cancelTarget}
        petsMap={petsMap}
        servicesMap={servicesMap}
        loading={busyId !== null}
        error={cancelError}
        onConfirm={handleConfirmCancel}
        onClose={() => !busyId && setCancelTarget(null)}
      />
    </>
  );
};
