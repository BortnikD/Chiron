'use client';

import React from 'react';
import { Clock, Stethoscope, ChevronRight, CheckCircle2, UserCheck } from 'lucide-react';
import { VetQueueSummaryProps } from './types';
import { formatSlotTime, getPetName } from './utils';
import { SpeciesIcon } from '../../../../components/ui/SpeciesIcon';

/**
 * Сводка смены врача:
 * отображает дату смены, текущего/следующего пациента на приёме,
 * число ожидающих в очереди и завершённых приёмов.
 */
export const VetQueueSummary: React.FC<VetQueueSummaryProps> = ({
  todayAppointments,
  nextAppointment,
  currentAppointment,
  servicesMap,
  petsMap,
  onSelectAppointment,
}) => {
  const completedCount = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
  const inProgressAppt =
    currentAppointment || todayAppointments.find((a) => a.status === 'IN_PROGRESS') || null;
  const waitingCount = todayAppointments.filter(
    (a) => a.status === 'PENDING' || a.status === 'CONFIRMED'
  ).length;

  // Активный пациент: тот, кто сейчас на приёме, либо следующий в очереди
  const activeAppt = inProgressAppt || nextAppointment;

  const todayDateFormatted = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="island" aria-label="Сводка смены" style={{ width: '100%' }}>
      <div className="island-head">
        <span className="island-title">
          <Clock className="ic" />
          <span style={{ textTransform: 'capitalize' }}>{todayDateFormatted}</span>
        </span>
        <div className="chips">
          <span className="day-stat" title="Всего приёмов по расписанию">
            <i style={{ background: 'var(--st-confirmed-fg)' }} />
            <b>{todayAppointments.length}</b> на сегодня
          </span>
          <span className="day-stat" title="Успешно завершённые консультации">
            <i style={{ background: 'var(--st-completed-fg)' }} />
            <b>{completedCount}</b> завершено
          </span>
          <span className="day-stat" title="Ожидают в живой очереди или по времени">
            <i style={{ background: 'var(--st-pending-fg)' }} />
            <b>{waitingCount}</b> в очереди
          </span>
        </div>
      </div>

      <div className="island-body" style={{ paddingTop: '8px', paddingBottom: '10px' }}>
        {activeAppt ? (
          <div
            className="row wrap between items-center"
            style={{
              padding: '8px 12px',
              background: 'var(--muted)',
              borderRadius: 'var(--radius)',
              gap: '10px',
              border: activeAppt.status === 'IN_PROGRESS' ? '1px solid var(--primary)' : '1px solid var(--border)',
            }}
          >
            <div className="row items-center wrap" style={{ gap: '10px' }}>
              <span
                className={`badge ${
                  activeAppt.status === 'IN_PROGRESS' ? 'badge-accent' : 'badge-outline'
                }`}
                style={{ height: '22px' }}
              >
                {activeAppt.status === 'IN_PROGRESS' ? (
                  <>
                    <Stethoscope size={13} className="ic" style={{ marginRight: '4px' }} />
                    Идёт приём
                  </>
                ) : (
                  <>
                    <UserCheck size={13} className="ic" style={{ marginRight: '4px' }} />
                    Следующий пациент
                  </>
                )}
              </span>

              <span className="pet-ava" style={{ width: '24px', height: '24px' }}>
                <SpeciesIcon species="cat" size={16} />
              </span>

              <span className="cell-main" style={{ fontWeight: 650 }}>
                {getPetName(activeAppt, petsMap)}
              </span>

              <span className="cell-sub" style={{ color: 'var(--muted-foreground)' }}>
                {servicesMap[activeAppt.serviceId] || 'Приём'}
              </span>

              <span className="tnum muted small" style={{ fontWeight: 500 }}>
                {formatSlotTime(activeAppt.startAt)} – {formatSlotTime(activeAppt.endAt)}
              </span>
            </div>

            {onSelectAppointment && (
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => onSelectAppointment(activeAppt)}
                style={{ cursor: 'pointer' }}
              >
                <span>{activeAppt.status === 'IN_PROGRESS' ? 'Открыть протокол' : 'Пригласить в кабинет'}</span>
                <ChevronRight size={14} className="ic" />
              </button>
            )}
          </div>
        ) : (
          <div className="row items-center between" style={{ padding: '6px 0', color: 'var(--muted-foreground)' }}>
            <span className="small">
              {todayAppointments.length === 0
                ? 'На сегодня приёмов нет. Свободный график.'
                : 'Все запланированные на сегодня приёмы завершены.'}
            </span>
            <span className="small muted">
              Завершено {completedCount} из {todayAppointments.length}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
