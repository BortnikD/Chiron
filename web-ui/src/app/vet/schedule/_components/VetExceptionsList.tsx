'use client';

import React, { useMemo } from 'react';
import { CalendarOff } from 'lucide-react';
import type { WorkSchedule, ScheduleException } from '@/modules/clinic/types';
import { DOW_ORDER, DOW_SHORT, formatIsoDateDisplay, getMoscowTodayIso } from '@/shared/lib';
import { shiftIsoDate } from '../../dashboard/_components/vetHelpers';

export interface VetExceptionsListProps {
  exceptions: ScheduleException[];
  schedules: WorkSchedule[];
  selectedException?: ScheduleException | null;
  onSelectException?: (exception: ScheduleException) => void;
  loading?: boolean;
  hasDetail?: boolean;
}

/**
 * Список предстоящих исключений врача (на ближайшие 60 дней) и недельный шаблон.
 */
export const VetExceptionsList: React.FC<VetExceptionsListProps> = ({
  exceptions,
  schedules,
  selectedException,
  onSelectException,
  loading = false,
  hasDetail = false,
}) => {
  const myWeek = useMemo(
    () =>
      DOW_SHORT.map((dw, i) => {
        const w = schedules.find((x) => x.dayOfWeek === DOW_ORDER[i]);
        return {
          dow: dw,
          hours: w ? `${w.startTime.slice(0, 5)}–${w.endTime.slice(0, 5)}` : 'Выходной',
          brk:
            w && w.breakStart && w.breakEnd
              ? `перерыв ${w.breakStart.slice(0, 5)}–${w.breakEnd.slice(0, 5)}`
              : '',
        };
      }),
    [schedules]
  );

  const myExceptions = useMemo(() => {
    const todayIso = getMoscowTodayIso();
    const limitIso = shiftIsoDate(todayIso, 60);

    return exceptions
      .filter((e) => e.endDate >= todayIso && e.startDate <= limitIso)
      .slice()
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((e) => {
        const isAbsence = e.type === 'ABSENCE';
        const range =
          e.startDate === e.endDate
            ? formatIsoDateDisplay(e.startDate)
            : `${formatIsoDateDisplay(e.startDate)} – ${formatIsoDateDisplay(e.endDate)}`;
        const reason =
          e.type === 'CUSTOM_HOURS' && e.startTime && e.endTime
            ? `${e.startTime.slice(0, 5)}–${e.endTime.slice(0, 5)} · ${e.reason || 'Особые часы'}`
            : e.reason || '—';

        return {
          id: e.id,
          raw: e,
          range,
          reason,
          label: isAbsence ? 'Отсутствие' : 'Особые часы',
          cls: isAbsence ? 'due-over' : 'badge-accent',
        };
      });
  }, [exceptions]);

  const sizingClass = hasDetail
    ? 'w-full lg:w-[300px] lg:flex-none xl:w-full 2xl:w-[300px] 2xl:flex-none'
    : 'w-full lg:w-[340px] lg:flex-none';

  return (
    <section className={`island ${sizingClass}`} aria-label="Исключения и шаблон графика">
      <div className="island-head">
        <span className="island-title">
          <CalendarOff className="ic" />
          <span>Исключения</span>
        </span>
      </div>

      <div className="island-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {loading ? (
          <div className="col" style={{ gap: '8px' }}>
            <div className="skeleton" style={{ height: '38px' }} />
            <div className="skeleton" style={{ height: '38px' }} />
          </div>
        ) : (
          <div className="col" style={{ gap: 0 }}>
            {myExceptions.length === 0 ? (
              <div className="small muted" style={{ padding: '8px 0' }}>
                На ближайшие 60 дней исключений нет
              </div>
            ) : (
              myExceptions.map((e) => {
                const isSelected = selectedException?.id === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    className={`lrow ${isSelected ? 'sel' : ''}`}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      borderRadius: isSelected ? '8px' : 0,
                      padding: '10px 6px',
                      width: '100%',
                    }}
                    onClick={() => onSelectException?.(e.raw)}
                  >
                    <span className="col" style={{ gap: 0, gridColumn: '1 / 3', minWidth: 0 }}>
                      <span className="cell-main tnum">{e.range}</span>
                      <span className="cell-sub">{e.reason}</span>
                    </span>
                    <span className={`badge ${e.cls}`}>{e.label}</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        <div className="col" style={{ gap: '6px' }}>
          <span className="section-title">Недельный шаблон</span>
          <div
            className="dtable"
            style={{ '--cols': '40px 1fr 1fr' } as React.CSSProperties}
          >
            {myWeek.map((w) => (
              <div key={w.dow} className="trow static compact">
                <span className="cell-main">{w.dow}</span>
                <span className="tnum">{w.hours}</span>
                <span className="small muted">{w.brk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
