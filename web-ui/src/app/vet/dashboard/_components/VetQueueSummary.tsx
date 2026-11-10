'use client';

import React from 'react';
import { Clock, ChevronRight, UserCheck } from 'lucide-react';
import { formatDateRu, formatSlotTime, getSpeciesTone } from '@/shared/lib';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import type { VetQueueSummaryProps } from './types';
import { getPetName } from './utils';

/**
 * Сводка смены врача:
 * отображает дату смены, следующего пациента в очереди,
 * число ожидающих и завершённых приёмов.
 */
export const VetQueueSummary: React.FC<VetQueueSummaryProps> = ({
  todayAppointments,
  nextAppointment,
  servicesMap,
  petsMap,
  speciesMap,
  onSelectAppointment,
}) => {
  const completedCount = todayAppointments.filter((a) => a.status === 'COMPLETED').length;
  const waitingCount = todayAppointments.filter(
    (a) => a.status === 'PENDING' || a.status === 'CONFIRMED'
  ).length;

  const activeAppt = nextAppointment;

  const todayDateFormatted = formatDateRu(new Date().toISOString(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const activePet =
    activeAppt?.pet || (activeAppt?.petId ? petsMap?.[activeAppt.petId] : undefined);
  const activeTone = getSpeciesTone(
    activePet?.species?.name || activePet?.speciesName || activePet?.speciesId || 'cat',
    speciesMap
  );

  return (
    <section className="island" aria-label="Сводка смены" style={{ flex: 'none', width: '100%' }}>
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
              border: '1px solid var(--border)',
            }}
          >
            <div className="row items-center wrap" style={{ gap: '10px' }}>
              <span className="badge badge-outline" style={{ height: '22px' }}>
                <UserCheck size={13} className="ic" style={{ marginRight: '4px' }} />
                Следующий пациент
              </span>

              <span className={`t-ava sm tone-${activeTone}`}>
                <SpeciesIcon species={activeTone} size={16} />
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
                className="btn btn-outline btn-sm"
                onClick={() => onSelectAppointment(activeAppt)}
              >
                <span>
                  {activeAppt.status === 'CONFIRMED' ? 'Открыть протокол' : 'Открыть запись'}
                </span>
                <ChevronRight size={14} className="ic" />
              </button>
            )}
          </div>
        ) : (
          <div
            className="row items-center between"
            style={{ padding: '6px 0', color: 'var(--muted-foreground)' }}
          >
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
