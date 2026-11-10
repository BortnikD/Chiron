'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WorkSchedule, ScheduleException } from '@/modules/clinic/types';
import type { Appointment } from '@/modules/client/types';
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

const H0 = 8;
const H1 = 19;
const PPM = 1.4;
const CAL_HOUR_PX = `${60 * PPM}px`;
const CAL_HEIGHT = `${(H1 - H0) * 60 * PPM}px`;

const px = (n: number): string => `${Math.round(n)}px`;

export interface VetWeeklyScheduleTableProps {
  loading: boolean;
  schedules: WorkSchedule[];
  exceptions: ScheduleException[];
  appointments: Appointment[];
  services: Record<string, string>;
  pets: Record<string, string>;
  selectedAppt: Appointment | null;
  onSelectAppt: (appt: Appointment) => void;
  onSelectException?: (exc: ScheduleException) => void;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

/**
 * Недельная сетка рабочих часов, перерывов врача и записей на приём.
 */
export const VetWeeklyScheduleTable: React.FC<VetWeeklyScheduleTableProps> = ({
  loading,
  schedules,
  exceptions,
  appointments,
  services,
  pets,
  selectedAppt,
  onSelectAppt,
  onSelectException,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
}) => {
  const mondayDate = useMemo(() => {
    const todayMoscow = getMoscowTodayIso();
    const [y, m, dayNum] = todayMoscow.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1, dayNum, 12, 0, 0));
    const day = d.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diffToMonday + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    const todayIso = getMoscowTodayIso();

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mondayDate);
      d.setUTCDate(d.getUTCDate() + i);

      const iso = getMoscowDateKey(d);
      const isToday = iso === todayIso;
      const isWeekend = i >= 5;
      const dayNum = d.getUTCDate();
      const monthShort = formatDateRu(d.toISOString(), { month: 'short' });

      return {
        i,
        date: d,
        iso,
        dow: DOW_SHORT[i],
        short: `${dayNum} ${monthShort}`,
        isToday,
        isWeekend,
      };
    });
  }, [mondayDate]);

  const weekRangeTitle = useMemo(() => {
    if (weekDays.length < 7) return '';
    const first = weekDays[0];
    const last = weekDays[6];
    return `${first.short} – ${last.short} ${last.date.getUTCFullYear()}`;
  }, [weekDays]);

  const calHours = useMemo(
    () =>
      Array.from({ length: H1 - H0 }, (_, i) => ({
        label: `${String(H0 + i).padStart(2, '0')}:00`,
        top: px(i * 60 * PPM),
      })),
    []
  );

  const getBlocksForDay = (dayIso: string, dayIndex: number) => {
    const blocks: React.ReactNode[] = [];

    const exc = exceptions.find((e) => e.startDate <= dayIso && e.endDate >= dayIso);

    if (exc && exc.type === 'ABSENCE') {
      blocks.push(
        <button
          key={`exc-${exc.id}`}
          type="button"
          className="wk-block wk-off"
          style={{
            top: 0,
            height: CAL_HEIGHT,
            backgroundColor: 'color-mix(in srgb, var(--destructive) 25%, transparent)',
            border: 0,
            borderRadius: 0,
            left: 0,
            right: 0,
            margin: 0,
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--destructive)',
            fontWeight: 600,
            fontSize: '12px',
            cursor: onSelectException ? 'pointer' : 'default',
          }}
          onClick={() => onSelectException?.(exc)}
          title={`Отсутствие · ${exc.reason || 'Отпуск/Больничный'}`}
        >
          <span>Отсутствие · {exc.reason || 'Отпуск/Больничный'}</span>
        </button>
      );
      return blocks;
    }

    const dowEnum = DOW_ORDER[dayIndex];
    const sched = schedules.find((s) => s.dayOfWeek === dowEnum);

    let start = '';
    let end = '';
    let bs = '';
    let be = '';

    if (exc && exc.type === 'CUSTOM_HOURS' && exc.startTime && exc.endTime) {
      start = exc.startTime.slice(0, 5);
      end = exc.endTime.slice(0, 5);
    } else if (sched) {
      start = sched.startTime.slice(0, 5);
      end = sched.endTime.slice(0, 5);
      bs = sched.breakStart ? sched.breakStart.slice(0, 5) : '';
      be = sched.breakEnd ? sched.breakEnd.slice(0, 5) : '';
    }

    if (start && end) {
      const topMin = Math.max(0, timeToMinutes(start) - H0 * 60);
      const heightMin = Math.max(0, timeToMinutes(end) - timeToMinutes(start));

      blocks.push(
        <div
          key="work-bg"
          className="wk-block wk-work"
          style={{
            top: px(topMin * PPM),
            height: px(heightMin * PPM),
          }}
        />
      );

      if (bs && be) {
        const brkTopMin = Math.max(0, timeToMinutes(bs) - H0 * 60);
        const brkHeightMin = Math.max(0, timeToMinutes(be) - timeToMinutes(bs));
        blocks.push(
          <div
            key="brk"
            className="wk-block wk-break"
            style={{
              top: px(brkTopMin * PPM),
              height: px(brkHeightMin * PPM),
            }}
          >
            <span>Перерыв</span>
          </div>
        );
      }
    }

    const dayAppts = appointments.filter((a) => {
      const apptDateIso = getMoscowDateKey(a.startAt);
      return apptDateIso === dayIso && a.status !== 'CANCELLED';
    });

    dayAppts.forEach((a) => {
      const sTime = formatSlotTime(a.startAt);
      const eTime = formatSlotTime(a.endAt);

      const topMin = Math.max(0, timeToMinutes(sTime) - H0 * 60);
      const durMin = Math.max(20, timeToMinutes(eTime) - timeToMinutes(sTime));
      const petName = pets[a.petId] || 'Пациент';
      const svcName = services[a.serviceId] || 'Приём';
      const isSel = selectedAppt?.id === a.id;

      blocks.push(
        <button
          key={`appt-${a.id}`}
          type="button"
          className={`wk-block wk-appt ${a.status} ${isSel ? 'sel' : ''} ${durMin < 40 ? 'sm' : ''}`}
          style={{
            top: px(topMin * PPM),
            height: px(durMin * PPM - 3),
            textAlign: 'left',
            cursor: 'pointer',
            zIndex: 10,
          }}
          onClick={() => onSelectAppt(a)}
          title={`${sTime}–${eTime} · ${petName} (${svcName}) — ${
            APPOINTMENT_STATUS_META[a.status]?.short || a.status
          }`}
        >
          <span className="wk-time">
            {sTime}
            <span className="wk-end">–{eTime}</span>
          </span>
          <span className="wk-pet">{petName}</span>
          <span className="wk-svc">{svcName}</span>
        </button>
      );
    });

    return blocks;
  };

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

        <span className="small muted">Только просмотр · график меняет администратор</span>
      </div>

      <div className="island-body" style={{ overflowX: 'auto', paddingBottom: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} />
          </div>
        ) : (
          <div
            className="week"
            style={{
              gridTemplateColumns: '52px repeat(7, minmax(0, 1fr))',
              minWidth: '540px',
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

            <div className="week-t" style={{ height: CAL_HEIGHT }}>
              {calHours.map((h, idx) => (
                <span key={idx} className="wt-label" style={{ top: h.top }}>
                  {h.label}
                </span>
              ))}
            </div>

            {weekDays.map((d) => (
              <div
                key={d.i}
                className={`week-c ${d.isWeekend ? 'we' : ''} ${d.isToday ? 'today' : ''}`}
                style={
                  {
                    height: CAL_HEIGHT,
                    '--hp': CAL_HOUR_PX,
                  } as React.CSSProperties
                }
              >
                {getBlocksForDay(d.iso, d.i)}
              </div>
            ))}
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
            <i style={{ background: 'color-mix(in srgb, var(--destructive) 25%, transparent)' }} />
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
