'use client';

import React, { useMemo } from 'react';
import { WorkSchedule, ScheduleException } from '../../../../types';
import { CalendarOff, Plus } from 'lucide-react';
import { DOWS, INDEX_TO_DOW, formatIsoDisplay } from './utils';

export interface VetExceptionsListProps {
  exceptions: ScheduleException[];
  schedules: WorkSchedule[];
  selectedException?: ScheduleException | null;
  onSelectException?: (exception: ScheduleException) => void;
  onAddException?: () => void;
  loading?: boolean;
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
}) => {
  // Недельный шаблон графика врача на 7 дней
  const myWeek = useMemo(() => {
    return DOWS.map((dw, i) => {
      const dowEnum = INDEX_TO_DOW[i];
      const w = schedules.find((x) => x.dayOfWeek === dowEnum);
      return {
        dow: dw,
        hours: w ? `${w.startTime.slice(0, 5)}–${w.endTime.slice(0, 5)}` : 'Выходной',
        brk: w && w.breakStart && w.breakEnd ? `перерыв ${w.breakStart.slice(0, 5)}–${w.breakEnd.slice(0, 5)}` : '',
      };
    });
  }, [schedules]);

  // Список исключений текущего врача
  const myExceptions = useMemo(() => {
    return exceptions.map((e) => {
      const isAbsence = e.type === 'ABSENCE';
      const range =
        e.startDate === e.endDate
          ? formatIsoDisplay(e.startDate)
          : `${formatIsoDisplay(e.startDate)} – ${formatIsoDisplay(e.endDate)}`;
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

  return (
    <section
      className="island"
      style={{ width: '340px', flex: 'none', display: 'flex', flexDirection: 'column' }}
    >
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
                  <div
                    key={e.id}
                    className="row between"
                    style={{
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border)',
                      cursor: onSelectException ? 'pointer' : 'default',
                      backgroundColor: isSelected ? 'var(--muted)' : undefined,
                      borderRadius: isSelected ? '6px' : undefined,
                      paddingLeft: isSelected ? '8px' : undefined,
                      paddingRight: isSelected ? '8px' : undefined,
                    }}
                    onClick={() => onSelectException?.(e.raw)}
                  >
                    <div className="col" style={{ gap: 0 }}>
                      <span className="cell-main tnum">{e.range}</span>
                      <span className="cell-sub">{e.reason}</span>
                    </div>
                    <span className={`badge ${e.cls}`}>{e.label}</span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Недельный шаблон графика */}
        <div className="col" style={{ gap: '8px', marginTop: '12px' }}>
          <span className="section-title">Недельный шаблон</span>
          <div
            className="dtable"
            style={{
              // @ts-ignore
              '--cols': '44px 1fr 1fr',
            }}
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
