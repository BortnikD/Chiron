'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WorkSchedule, ScheduleException } from '@/modules/clinic/types';
import type { Appointment, Pet } from '@/modules/client/types';
import {
  APPOINTMENT_STATUS_META,
  DOW_ORDER,
  DOW_SHORT,
  formatDateRu,
  formatSlotTime,
  getMoscowDateKey,
  getMoscowTodayIso,
  timeToMinutes,
} from '@/shared/lib';
import { getPetName } from '../../dashboard/_components/utils';
import { VET_STATUS_COLORS } from '../../dashboard/_components/vetTimelineUtils';

const PPM = 1.4;
const CAL_HOUR_PX = `${60 * PPM}px`;

const px = (n: number): string => `${Math.round(n)}px`;

export interface VetWeeklyScheduleTableProps {
  loading: boolean;
  schedules: WorkSchedule[];
  exceptions: ScheduleException[];
  appointments: Appointment[];
  servicesMap: Record<string, string>;
  petsMap: Record<string, Pet>;
  todayIso?: string;
  nowMinutes?: number;
  selectedAppt: Appointment | null;
  onSelectAppt: (appt: Appointment) => void;
  onSelectException?: (exc: ScheduleException) => void;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

export const VetWeeklyScheduleTable: React.FC<VetWeeklyScheduleTableProps> = ({
  loading,
  schedules,
  exceptions,
  appointments,
  servicesMap,
  petsMap,
  todayIso,
  nowMinutes,
  selectedAppt,
  onSelectAppt,
  onSelectException,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
}) => {
  const effectiveToday = todayIso || getMoscowTodayIso();

  const weekDays = useMemo(() => {
    const [y, m, dayNum] = getMoscowTodayIso().split('-').map(Number);
    const monday = new Date(Date.UTC(y, m - 1, dayNum, 12, 0, 0));
    const day = monday.getUTCDay();
    monday.setUTCDate(monday.getUTCDate() + (day === 0 ? -6 : 1 - day) + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setUTCDate(d.getUTCDate() + i);
      const iso = getMoscowDateKey(d);
      const monthShort = formatDateRu(d.toISOString(), { month: 'short' }).replace('.', '');
      return {
        i,
        date: d,
        iso,
        dow: DOW_SHORT[i],
        short: `${d.getUTCDate()} ${monthShort}`,
        isToday: iso === effectiveToday,
        isWeekend: i >= 5,
      };
    });
  }, [weekOffset, effectiveToday]);

  const weekRangeTitle = useMemo(() => {
    if (weekDays.length < 7) return '';
    return `${weekDays[0].short} – ${weekDays[6].short} ${weekDays[6].date.getUTCFullYear()}`;
  }, [weekDays]);

  const { h0, h1 } = useMemo(() => {
    let minH = 8;
    let maxH = 19;
    schedules.forEach((s) => {
      minH = Math.min(minH, Math.floor(timeToMinutes(s.startTime.slice(0, 5)) / 60));
      maxH = Math.max(maxH, Math.ceil(timeToMinutes(s.endTime.slice(0, 5)) / 60));
    });
    exceptions.forEach((e) => {
      if (e.type === 'CUSTOM_HOURS' && e.startTime && e.endTime) {
        minH = Math.min(minH, Math.floor(timeToMinutes(e.startTime.slice(0, 5)) / 60));
        maxH = Math.max(maxH, Math.ceil(timeToMinutes(e.endTime.slice(0, 5)) / 60));
      }
    });
    appointments.forEach((a) => {
      if (a.status === 'CANCELLED') return;
      const sMin = timeToMinutes(formatSlotTime(a.startAt));
      const eMin = timeToMinutes(formatSlotTime(a.endAt));
      minH = Math.min(minH, Math.floor(sMin / 60));
      maxH = Math.max(maxH, Math.ceil(eMin / 60));
    });
    return { h0: minH, h1: Math.max(minH + 2, maxH) };
  }, [schedules, exceptions, appointments]);

  const calHeight = px((h1 - h0) * 60 * PPM);

  const calHours = useMemo(
    () =>
      Array.from({ length: h1 - h0 }, (_, i) => ({
        label: `${String(h0 + i).padStart(2, '0')}:00`,
        top: px(i * 60 * PPM),
      })),
    [h0, h1]
  );

  const showNowLine =
    typeof nowMinutes === 'number' && nowMinutes >= h0 * 60 && nowMinutes <= h1 * 60;
  const nowTop = showNowLine ? px((nowMinutes - h0 * 60) * PPM) : null;

  return (
    <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="island-head">
        <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm btn-icon"
            aria-label="Предыдущая неделя"
            onClick={onPrevWeek}
          >
            <ChevronLeft className="ic" />
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onCurrentWeek}>
            Эта неделя
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm btn-icon"
            aria-label="Следующая неделя"
            onClick={onNextWeek}
          >
            <ChevronRight className="ic" />
          </button>
          <span className="island-title" style={{ marginLeft: '6px' }}>
            {weekRangeTitle}
          </span>
        </div>


      </div>

      <div className="island-body" style={{ overflowX: 'auto', paddingBottom: '16px' }}>
        {loading ? (
          <div className="col" style={{ gap: '10px' }}>
            <div className="skeleton" style={{ height: '40px' }} />
            <div className="skeleton" style={{ height: '420px' }} />
          </div>
        ) : (
          <div
            className="week"
            style={{
              gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))',
              minWidth: '580px',
            }}
          >
            <div className="week-h" style={{ background: 'var(--muted)' }} />
            {weekDays.map((d) => (
              <div
                key={d.i}
                className={`week-h ${d.isToday ? 'today' : ''} ${d.isWeekend ? 'we' : ''}`}
              >
                <span className="wh-dow">{d.dow}</span>
                <span className="wh-date">{d.short}</span>
              </div>
            ))}

            <div className="week-t" style={{ height: calHeight }}>
              {calHours.map((h) => (
                <span key={h.label} className="wt-label" style={{ top: h.top }}>
                  {h.label}
                </span>
              ))}
            </div>

            {weekDays.map((d) => {
              const exc = exceptions.find((e) => e.startDate <= d.iso && e.endDate >= d.iso);
              const sched = schedules.find((s) => s.dayOfWeek === DOW_ORDER[d.i]);
              const start =
                exc?.type === 'CUSTOM_HOURS' && exc.startTime
                  ? exc.startTime.slice(0, 5)
                  : sched?.startTime.slice(0, 5) || '';
              const end =
                exc?.type === 'CUSTOM_HOURS' && exc.endTime
                  ? exc.endTime.slice(0, 5)
                  : sched?.endTime.slice(0, 5) || '';
              const bs = exc?.type === 'CUSTOM_HOURS' ? '' : sched?.breakStart?.slice(0, 5) || '';
              const be = exc?.type === 'CUSTOM_HOURS' ? '' : sched?.breakEnd?.slice(0, 5) || '';

              const dayAppts = appointments.filter(
                (a) => getMoscowDateKey(a.startAt) === d.iso && a.status !== 'CANCELLED'
              );

              return (
                <div
                  key={d.i}
                  className={`week-c ${d.isWeekend ? 'we' : ''} ${d.isToday ? 'today' : ''}`}
                  style={{ height: calHeight, '--hp': CAL_HOUR_PX } as React.CSSProperties}
                >
                  {exc?.type === 'ABSENCE' ? (
                    <button
                      type="button"
                      className="wk-block wk-off"
                      style={{
                        top: 0,
                        height: calHeight,
                        left: 0,
                        right: 0,
                        width: '100%',
                        border: 0,
                        borderRadius: 0,
                        padding: '0 6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: '12px',
                        cursor: onSelectException ? 'pointer' : 'default',
                      }}
                      onClick={() => onSelectException?.(exc)}
                      title={`Отсутствие · ${exc.reason || 'Отпуск/Больничный'}`}
                    >
                      <span>Отсутствие · {exc.reason || 'Отпуск'}</span>
                    </button>
                  ) : (
                    <>
                      {start && end && (
                        <div
                          className="wk-block wk-work"
                          style={{
                            top: px(Math.max(0, timeToMinutes(start) - h0 * 60) * PPM),
                            height: px(Math.max(0, timeToMinutes(end) - timeToMinutes(start)) * PPM),
                          }}
                        />
                      )}
                      {bs && be && (
                        <div
                          className="wk-block wk-break"
                          style={{
                            top: px(Math.max(0, timeToMinutes(bs) - h0 * 60) * PPM),
                            height: px(Math.max(0, timeToMinutes(be) - timeToMinutes(bs)) * PPM),
                          }}
                        >
                          Перерыв
                        </div>
                      )}
                      {dayAppts.map((a) => {
                        const sTime = formatSlotTime(a.startAt);
                        const eTime = formatSlotTime(a.endAt);
                        const topMin = Math.max(0, timeToMinutes(sTime) - h0 * 60);
                        const durPx = Math.max(24, (timeToMinutes(eTime) - timeToMinutes(sTime)) * PPM - 3);
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
                              top: px(topMin * PPM),
                              height: px(durPx),
                              '--st': VET_STATUS_COLORS[a.status],
                            } as React.CSSProperties}
                            onClick={() => onSelectAppt(a)}
                            title={`${sTime}–${eTime} · ${petName} (${svcName}) — ${APPOINTMENT_STATUS_META[a.status]?.short || a.status}`}
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
                    </>
                  )}

                  {d.isToday && nowTop && (
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
            <i style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)' }} />
            Рабочие часы
          </span>
          <span>
            <i style={{ background: 'var(--muted)' }} />
            Перерыв
          </span>
          <span>
            <i style={{ background: 'color-mix(in oklch, var(--destructive) 25%, transparent)' }} />
            Отсутствие
          </span>
          <span>
            <i style={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
            Запись
          </span>
        </div>
      </div>
    </section>
  );
};
