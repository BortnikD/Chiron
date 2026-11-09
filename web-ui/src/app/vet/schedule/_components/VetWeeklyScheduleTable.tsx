'use client';

import React, { useMemo } from 'react';
import { WorkSchedule, ScheduleException, Appointment } from '../../../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DOWS,
  INDEX_TO_DOW,
  H0,
  H1,
  PPM,
  CAL_HOUR_PX,
  CAL_HEIGHT,
  tm,
  px,
  STATUS_SHORT,
} from './utils';

export interface VetWeeklyScheduleTableProps {
  loading: boolean;
  schedules: WorkSchedule[];
  exceptions: ScheduleException[];
  appointments: Appointment[];
  services: Record<string, string>;
  pets: Record<string, string>;
  selectedAppt: Appointment | null;
  onSelectAppt: (appt: Appointment) => void;
  selectedException?: ScheduleException | null;
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
  // Вычисление понедельника текущей отображаемой недели
  const mondayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // getDay(): 0 = Вс, 1 = Пн ... 6 = Сб
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday + weekOffset * 7);
    return d;
  }, [weekOffset]);

  // Дни недели для сетки
  const weekDays = useMemo(() => {
    const todayIso = new Date().toISOString().split('T')[0];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mondayDate);
      d.setDate(d.getDate() + i);

      const iso = d.toISOString().split('T')[0];
      const isToday = iso === todayIso;
      const isWeekend = i >= 5;
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('ru-RU', { month: 'short' });

      return {
        i,
        date: d,
        iso,
        dow: DOWS[i],
        short: `${dayNum} ${monthShort}`,
        isToday,
        isWeekend,
      };
    });
  }, [mondayDate]);

  // Заголовок диапазона недели
  const weekRangeTitle = useMemo(() => {
    if (weekDays.length < 7) return '';
    const first = weekDays[0];
    const last = weekDays[6];
    return `${first.short} – ${last.short} ${last.date.getFullYear()}`;
  }, [weekDays]);

  // Часовые метки для левой шкалы времени (08:00 - 18:00)
  const calHours = useMemo(() => {
    const list = [];
    for (let h = H0; h < H1; h++) {
      list.push({
        label: `${String(h).padStart(2, '0')}:00`,
        top: px((h - H0) * 60 * PPM),
      });
    }
    return list;
  }, []);

  // Блоки для столбца дня (рабочее время, перерыв, отсутствие, записи)
  const getBlocksForDay = (dayDate: Date, dayIso: string, dayIndex: number) => {
    const blocks: React.ReactNode[] = [];

    // 1. Проверяем исключения на этот день
    const exc = exceptions.find((e) => e.startDate <= dayIso && e.endDate >= dayIso);

    if (exc && exc.type === 'ABSENCE') {
      // Весь день отсутствие
      blocks.push(
        <div
          key={`exc-${exc.id}`}
          className="wk-block wk-off"
          style={{
            top: 0,
            height: CAL_HEIGHT,
            backgroundColor: 'color-mix(in srgb, var(--destructive) 25%, transparent)',
            borderRadius: 0,
            left: 0,
            right: 0,
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
        </div>
      );
      return blocks;
    }

    // 2. Рабочие часы по графику или особым часам
    const dowEnum = INDEX_TO_DOW[dayIndex];
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
      const topMin = Math.max(0, tm(start) - H0 * 60);
      const heightMin = Math.max(0, tm(end) - tm(start));

      // Подложка рабочего времени
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

      // Перерыв
      if (bs && be) {
        const brkTopMin = Math.max(0, tm(bs) - H0 * 60);
        const brkHeightMin = Math.max(0, tm(be) - tm(bs));
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

    // 3. Записи на этот день
    const dayAppts = appointments.filter((a) => {
      const apptDateIso = new Date(a.startAt).toISOString().split('T')[0];
      return apptDateIso === dayIso && a.status !== 'CANCELLED';
    });

    dayAppts.forEach((a) => {
      const sDate = new Date(a.startAt);
      const eDate = new Date(a.endAt);
      const sTime = `${String(sDate.getHours()).padStart(2, '0')}:${String(sDate.getMinutes()).padStart(2, '0')}`;
      const eTime = `${String(eDate.getHours()).padStart(2, '0')}:${String(eDate.getMinutes()).padStart(2, '0')}`;

      const topMin = Math.max(0, tm(sTime) - H0 * 60);
      const durMin = Math.max(20, tm(eTime) - tm(sTime));
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
          title={`${sTime}–${eTime} · ${petName} (${svcName}) — ${STATUS_SHORT[a.status] || a.status}`}
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
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onCurrentWeek}
          >
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

        <span className="small muted">
          Только просмотр · график меняет администратор
        </span>
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
              minWidth: '640px',
            }}
          >
            {/* Левый верхний пустой угол */}
            <div className="week-h" style={{ background: 'var(--muted)' }} />

            {/* Шапка 7 дней */}
            {weekDays.map((d) => (
              <div
                key={d.i}
                className={`week-h ${d.isToday ? 'today' : ''} ${d.isWeekend ? 'we' : ''}`}
              >
                <span className="wh-dow">{d.dow}</span>
                <span className="wh-date">{d.short}</span>
              </div>
            ))}

            {/* Левая шкала времени */}
            <div className="week-t" style={{ height: CAL_HEIGHT }}>
              {calHours.map((h, idx) => (
                <span key={idx} className="wt-label" style={{ top: h.top }}>
                  {h.label}
                </span>
              ))}
            </div>

            {/* 7 столбцов дней */}
            {weekDays.map((d) => (
              <div
                key={d.i}
                className={`week-c ${d.isWeekend ? 'we' : ''} ${d.isToday ? 'today' : ''}`}
                style={{
                  height: CAL_HEIGHT,
                  // @ts-ignore
                  '--hp': CAL_HOUR_PX,
                }}
              >
                {getBlocksForDay(d.date, d.iso, d.i)}
              </div>
            ))}
          </div>
        )}

        {/* Легенда */}
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
