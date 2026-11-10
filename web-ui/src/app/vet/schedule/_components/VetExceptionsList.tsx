'use client';

import React, { useMemo } from 'react';
import { CalendarOff, Plus } from 'lucide-react';
import type { WorkSchedule, ScheduleException } from '@/modules/admin/types';
import { DOW_ORDER, DOW_SHORT, formatIsoDateDisplay } from '@/shared/lib';

export interface VetExceptionsListProps {
  exceptions: ScheduleException[];
  schedules: WorkSchedule[];
  selectedException?: ScheduleException | null;
  onSelectException?: (exception: ScheduleException) => void;
  onAddException?: () => void;
  loading?: boolean;
  hasDetail?: boolean;
}

/**
 * Список исключений врача (отпуска, больничные, особый график) и недельный шаблон.
 */
export const VetExceptionsList: React.FC<VetExceptionsListProps> = ({
  exceptions,
  schedules,
  selectedException,
  onSelectException,
  onAddException,
  loading,
  hasDetail = false,
}) => {
  const myWeek = useMemo(() => {
    return DOW_SHORT.map((dw, i) => {
      const dowEnum = DOW_ORDER[i];
      const w = schedules.find((x) => x.dayOfWeek === dowEnum);
      return {
        dow: dw,
        hours: w ? `${w.startTime.slice(0, 5)}–${w.endTime.slice(0, 5)}` : 'Выходной',
        brk:
          w && w.breakStart && w.breakEnd
            ? `перерыв ${w.breakStart.slice(0, 5)}–${w.breakEnd.slice(0, 5)}`
            : '',
      };
    });
  }, [schedules]);

  const myExceptions = useMemo(() => {
    return exceptions.map((e) => {
      const isAbsence = e.type === 'ABSENCE';
      const range =
        e.startDate === e.endDate
          ? formatIsoDateDisplay(e.startDate)
          : `${formatIsoDateDisplay(e.startDate)} – ${formatIsoDateDisplay(e.endDate)}`;
      const reason =
        e.type === 'CUSTOM_HOURS' && e.startTime && e.endTime
          ? `${e.startTime.slice(0, 5)}–${e.endTime.slice(0, 5)} · ${e.reason || ''}`
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
    ? 'w-full md:max-h-[260px] lg:max-h-none lg:w-[300px] lg:flex-none xl:w-full xl:max-h-[240px] 2xl:w-[300px] 2xl:max-h-none 2xl:flex-none'
    : 'w-full md:max-h-[260px] lg:max-h-none lg:w-[310px] lg:flex-none';

  return (
    <section className={`island ${sizingClass}`} aria-label="Исключения и шаблон графика">
      <div className="island-head">
        <span className="island-title">
          <CalendarOff className="ic" />
          <span>Исключения</span>
        </span>
        {onAddException && (
          <button
            type="button"
            className="btn btn-outline btn-sm btn-icon"
            onClick={onAddException}
            title="Добавить исключение"
            aria-label="Добавить исключение"
          >
            <Plus className="ic" />
          </button>
        )}
      </div>

      <div className="island-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ height: '36px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ height: '36px', borderRadius: '6px' }} />
          </div>
        ) : (
          <div className="col" style={{ gap: 0 }}>
            {myExceptions.length === 0 ? (
              <div className="small muted" style={{ padding: '8px 0' }}>
                Исключений на ближайшее время нет
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
                      padding: '9px 8px',
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

        <div className="col" style={{ gap: '8px', marginTop: '4px' }}>
          <span className="section-title">Недельный шаблон</span>
          <div
            className="dtable"
            style={{ '--cols': '44px 1fr 1fr' } as React.CSSProperties}
          >
            {myWeek.map((w, idx) => (
              <div key={idx} className="trow static compact">
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
