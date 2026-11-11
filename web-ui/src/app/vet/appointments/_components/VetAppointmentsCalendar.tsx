'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { ScheduleException, WorkSchedule } from '@/modules/clinic/types';
import {
  APPOINTMENT_STATUS_META,
  DOW_ORDER,
  DOW_SHORT,
  formatDateRu,
  formatIsoDateDisplay,
  formatSlotTime,
  getMoscowDateKey,
  timeToMinutes,
} from '@/shared/lib';
import type { CalendarMode } from '../_hooks/useVetAppointments';
import { getPetName } from '../../dashboard/_components/utils';
import { VET_STATUS_COLORS } from '../../dashboard/_components/vetTimelineUtils';

const PPM = 1.4;
const px = (n: number) => `${Math.round(n)}px`;

export interface VetAppointmentsCalendarProps {
  calMode: CalendarMode;
  calDayIsos: string[];
  todayIso: string;
  nowMinutes: number;
  appointments: Appointment[];
  exceptions: ScheduleException[];
  workSchedules: WorkSchedule[];
  petsMap: Record<string, Pet>;
  servicesMap: Record<string, string>;
  selectedAppt: Appointment | null;
  loading: boolean;
  onModeChange: (mode: CalendarMode) => void;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  onSelectAppointment: (appt: Appointment) => void;
}

export const VetAppointmentsCalendar: React.FC<VetAppointmentsCalendarProps> = ({
  calMode,
  calDayIsos,
  todayIso,
  nowMinutes,
  appointments,
  exceptions,
  workSchedules,
  petsMap,
  servicesMap,
  selectedAppt,
  loading,
  onModeChange,
  onPrev,
  onToday,
  onNext,
  onSelectAppointment,
}) => {
  const { h0, h1 } = useMemo(() => {
    let minH = 8;
    let maxH = 19;
    appointments.forEach((a) => {
      const sMin = timeToMinutes(formatSlotTime(a.startAt));
      const eMin = timeToMinutes(formatSlotTime(a.endAt));
      minH = Math.min(minH, Math.floor(sMin / 60));
      maxH = Math.max(maxH, Math.ceil(eMin / 60));
    });
    return { h0: minH, h1: Math.max(minH + 2, maxH) };
  }, [appointments]);

  const calHeightPx = px((h1 - h0) * 60 * PPM);
  const calHourPx = px(60 * PPM);

  const calHours = useMemo(
    () =>
      Array.from({ length: h1 - h0 }, (_, i) => ({
        label: `${String(h0 + i).padStart(2, '0')}:00`,
        top: px(i * 60 * PPM),
      })),
    [h0, h1]
  );

  const days = useMemo(
    () =>
      calDayIsos.map((iso) => {
        const d = new Date(`${iso}T12:00:00+03:00`);
        const dayIdx = (d.getUTCDay() + 6) % 7;
        const monShort = formatDateRu(d.toISOString(), { month: 'short' }).replace('.', '');
        return {
          iso,
          dayIdx,
          dow: DOW_SHORT[dayIdx],
          short: `${d.getUTCDate()} ${monShort}`,
          isToday: iso === todayIso,
          isWeekend: dayIdx >= 5,
        };
      }),
    [calDayIsos, todayIso]
  );

  const title = useMemo(() => {
    if (calDayIsos.length === 1) {
      const first = days[0];
      return `${first.dow}, ${formatIsoDateDisplay(first.iso)}`;
    }
    return `${formatIsoDateDisplay(calDayIsos[0])} – ${formatIsoDateDisplay(calDayIsos[calDayIsos.length - 1])}`;
  }, [calDayIsos, days]);

  const showNowLine = nowMinutes >= h0 * 60 && nowMinutes <= h1 * 60;
  const nowTop = px((nowMinutes - h0 * 60) * PPM);

  return (
    <section className="island grow">
      <div className="island-head">
        <div className="row" style={{ gap: '8px' }}>
          <button type="button" className="btn btn-outline btn-sm btn-icon" aria-label="Назад" onClick={onPrev}>
            <ChevronLeft className="ic" />
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onToday}>
            Сегодня
          </button>
          <button type="button" className="btn btn-outline btn-sm btn-icon" aria-label="Вперёд" onClick={onNext}>
            <ChevronRight className="ic" />
          </button>
          <span className="island-title" style={{ marginLeft: '6px' }}>
            {title}
          </span>
        </div>

        <div className="seg">
          <button
            type="button"
            className={`seg-item ${calMode === 'day' ? 'on' : ''}`}
            onClick={() => onModeChange('day')}
          >
            День
          </button>
          <button
            type="button"
            className={`seg-item ${calMode === 'week' ? 'on' : ''}`}
            onClick={() => onModeChange('week')}
          >
            Неделя
          </button>
        </div>
      </div>

      <div className="island-body">
        {loading && appointments.length === 0 ? (
          <div className="skeleton" style={{ height: '420px' }} />
        ) : (
          <div
            className="week"
            style={{
              gridTemplateColumns: `52px repeat(${days.length}, minmax(0, 1fr))`,
              minWidth: days.length > 1 ? '560px' : '280px',
            }}
          >
            <div className="week-h" style={{ background: 'var(--muted)' }} />
            {days.map((d) => (
              <div
                key={d.iso}
                className={`week-h ${d.isToday ? 'today' : ''} ${d.isWeekend ? 'we' : ''}`}
              >
                <span className="wh-dow">{d.dow}</span>
                <span className="wh-date">{d.short}</span>
              </div>
            ))}

            <div className="week-t" style={{ height: calHeightPx }}>
              {calHours.map((h) => (
                <span key={h.label} className="wt-label" style={{ top: h.top }}>
                  {h.label}
                </span>
              ))}
            </div>

            {days.map((d) => {
              const exc = exceptions.find((e) => e.startDate <= d.iso && e.endDate >= d.iso);
              const sched = workSchedules.find((s) => s.dayOfWeek === DOW_ORDER[d.dayIdx]);
              const dayAppts = appointments.filter((a) => getMoscowDateKey(a.startAt) === d.iso);

              return (
                <div
                  key={d.iso}
                  className={`week-c ${d.isWeekend ? 'we' : ''} ${d.isToday ? 'today' : ''}`}
                  style={{ height: calHeightPx, '--hp': calHourPx } as React.CSSProperties}
                >
                  {exc?.type === 'ABSENCE' && (
                    <div className="wk-block wk-off" style={{ top: 0, height: calHeightPx }}>
                      Отсутствие · {exc.reason || 'Отпуск'}
                    </div>
                  )}

                  {!exc && sched?.breakStart && sched?.breakEnd && (
                    <div
                      className="wk-block wk-break"
                      style={{
                        top: px(Math.max(0, timeToMinutes(sched.breakStart) - h0 * 60) * PPM),
                        height: px(Math.max(12, timeToMinutes(sched.breakEnd) - timeToMinutes(sched.breakStart)) * PPM),
                      }}
                    >
                      Перерыв
                    </div>
                  )}

                  {dayAppts.map((a) => {
                    const sTime = formatSlotTime(a.startAt);
                    const eTime = formatSlotTime(a.endAt);
                    const sMin = timeToMinutes(sTime);
                    const eMin = Math.max(sMin + 15, timeToMinutes(eTime));
                    const durPx = Math.max(24, (eMin - sMin) * PPM - 3);
                    const petName = getPetName(a, petsMap);
                    const svcName =
                      a.serviceName || a.service?.name || servicesMap[a.serviceId] || 'Приём';
                    const isSel = selectedAppt?.id === a.id;

                    return (
                      <button
                        key={a.id}
                        type="button"
                        className={`wk-block wk-appt ${a.status} ${isSel ? 'sel' : ''} ${durPx < 56 ? 'sm' : ''}`}
                        style={{
                          top: px(Math.max(0, sMin - h0 * 60) * PPM),
                          height: px(durPx),
                          '--st': VET_STATUS_COLORS[a.status],
                        } as React.CSSProperties}
                        title={`${sTime}–${eTime} ${petName}, ${svcName} — ${APPOINTMENT_STATUS_META[a.status]?.label || a.status}`}
                        onClick={() => onSelectAppointment(a)}
                      >
                        <span className="wk-time">
                          {sTime}
                          <span className="wk-end">–{eTime}</span>
                        </span>
                        <span className="wk-pet">{petName}</span>
                        <span className="wk-svc">{svcName}</span>
                      </button>
                    );
                  })}

                  {d.isToday && showNowLine && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: nowTop,
                        height: '2px',
                        background: 'var(--primary)',
                        zIndex: 5,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="legend" style={{ marginTop: '12px' }}>
          <span>
            <i style={{ background: 'var(--st-pending-fg)' }} />
            Ожидает
          </span>
          <span>
            <i style={{ background: 'var(--st-confirmed-fg)' }} />
            Подтверждена
          </span>
          <span>
            <i style={{ background: 'var(--st-completed-fg)' }} />
            Завершена
          </span>
          <span>
            <i style={{ background: 'var(--st-noshow-fg)' }} />
            Неявка
          </span>
          <span>
            <i style={{ background: 'var(--st-cancelled-fg)' }} />
            Отменена
          </span>
        </div>
      </div>
    </section>
  );
};
