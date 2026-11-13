'use client';

import React, { useMemo } from 'react';
import { CalendarDays, RefreshCw, Pencil, Trash2, Plus } from 'lucide-react';
import type { WorkSchedule } from '@/modules/admin/types';
import type { Veterinarian } from '@/modules/clinic/types';
import { SearchCombobox, type SearchComboboxOption } from '@/shared/components';
import {
  DOW_SHORT,
  DOW_FULL,
  DOW_ORDER,
  timeToMinutes,
  formatDurationMinutes,
} from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export interface WeeklyScheduleMatrixProps {
  vets: Veterinarian[];
  specsMap?: Record<string, string>;
  selectedVetId: string;
  selectedVetName: string;
  schedules: WorkSchedule[];
  loadingVets: boolean;
  loadingSchedule: boolean;
  onSelectVet: (vetId: string) => void;
  onRefresh: () => void;
  onAddDay: (dayIndex: number) => void;
  onEditDay: (schedule: WorkSchedule, dayIndex: number) => void;
  onDeleteDay: (scheduleId: string, dowName: string) => void;
}

const H0 = 8;
const H1 = 20;
const RANGE_MIN = (H1 - H0) * 60;
const HOURS = Array.from({ length: H1 - H0 + 1 }, (_, i) => H0 + i);

function pctX(t: string): string {
  const p = ((timeToMinutes(t) - H0 * 60) / RANGE_MIN) * 100;
  return `${Math.max(0, Math.min(100, p))}%`;
}

function pctW(a: string, b: string): string {
  const p = ((timeToMinutes(b) - timeToMinutes(a)) / RANGE_MIN) * 100;
  return `${Math.max(0, Math.min(100, p))}%`;
}

export const WeeklyScheduleMatrix: React.FC<WeeklyScheduleMatrixProps> = ({
  vets,
  specsMap,
  selectedVetId,
  selectedVetName,
  schedules,
  loadingVets,
  loadingSchedule,
  onSelectVet,
  onRefresh,
  onAddDay,
  onEditDay,
  onDeleteDay,
}) => {
  const vetOptions = useMemo<SearchComboboxOption[]>(
    () =>
      vets.map((v) => {
        const doc = getDoctorDisplay(v, specsMap);
        return {
          value: v.id,
          label: doc.fullName,
          hint: doc.specName,
        };
      }),
    [vets, specsMap]
  );

  const scheduleRows = useMemo(() => {
    return DOW_SHORT.map((shortName, i) => {
      const ws = schedules.find((s) => s.dayOfWeek === DOW_ORDER[i]);
      if (!ws) {
        return {
          dayIndex: i,
          dowShort: shortName,
          dowFull: DOW_FULL[i],
          hasSchedule: false,
          totalHours: '—',
          mins: 0,
          rowCls: 'off',
          ws: null as WorkSchedule | null,
          segments: [] as { left: string; width: string; cls: string; label: string }[],
        };
      }

      const start = ws.startTime.slice(0, 5);
      const end = ws.endTime.slice(0, 5);
      const bs = ws.breakStart ? ws.breakStart.slice(0, 5) : '';
      const be = ws.breakEnd ? ws.breakEnd.slice(0, 5) : '';

      const durMins =
        timeToMinutes(end) -
        timeToMinutes(start) -
        (bs && be ? timeToMinutes(be) - timeToMinutes(bs) : 0);

      const seg = (a: string, b: string, kind: 'work' | 'brk', label: string) => ({
        left: pctX(a),
        width: pctW(a, b),
        cls: `${kind} ${timeToMinutes(b) - timeToMinutes(a) < 90 ? 'narrow' : ''}`,
        label,
      });

      const segments =
        bs && be
          ? [
              seg(start, bs, 'work', `${start}–${bs}`),
              seg(bs, be, 'brk', 'перерыв'),
              seg(be, end, 'work', `${be}–${end}`),
            ]
          : [seg(start, end, 'work', `${start}–${end}`)];

      return {
        dayIndex: i,
        dowShort: shortName,
        dowFull: DOW_FULL[i],
        hasSchedule: true,
        totalHours: formatDurationMinutes(durMins),
        mins: durMins,
        rowCls: i >= 5 ? 'we' : '',
        ws,
        segments,
      };
    });
  }, [schedules]);

  const totalWeekMins = useMemo(
    () => scheduleRows.reduce((acc, r) => acc + r.mins, 0),
    [scheduleRows]
  );

  return (
    <>
      <section className="island filters" aria-label="Врач">
        <div className="field" style={{ width: 280 }}>
          <label className="field-label" htmlFor="sch-vet">
            Врач
          </label>
          <SearchCombobox
            id="sch-vet"
            value={selectedVetId}
            options={vetOptions}
            onChange={onSelectVet}
            disabled={loadingVets}
            placeholder="Найдите врача…"
            ariaLabel="Найдите врача"
          />
        </div>

        <div className="spacer" />

        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onRefresh}
          aria-label="Обновить график"
          title="Обновить график"
        >
          <RefreshCw className={`ic ${loadingSchedule ? 'animate-spin' : ''}`} />
        </button>
      </section>

      <section className="island grow" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="island-head">
          <span className="island-title">
            <CalendarDays className="ic" />
            <span>Недельный график · {selectedVetName}</span>
          </span>
          <span className="small muted">
            Дни без записи — выходные · исключения важнее графика
          </span>
        </div>

        <div className="island-body" style={{ overflowX: 'auto', paddingBottom: '16px' }}>
          {loadingSchedule ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: '56px', borderRadius: '8px' }}
                />
              ))}
            </div>
          ) : (
            <div className="sch" style={{ minWidth: '680px' }}>
              <div className="sch-row sch-head">
                <span className="sch-day" />
                <div className="sch-scale">
                  {HOURS.map((h, idx) => (
                    <span
                      key={h}
                      className={idx === 0 ? 'first' : idx === HOURS.length - 1 ? 'last' : undefined}
                      style={{ left: `${(idx / (HOURS.length - 1)) * 100}%` }}
                    >
                      {`${String(h).padStart(2, '0')}:00`}
                    </span>
                  ))}
                </div>
                <span className="sch-act" />
              </div>

              {scheduleRows.map((r) => (
                <div key={r.dayIndex} className={`sch-row ${r.rowCls}`}>
                  <div className="sch-day">
                    <span className="cell-main sch-dl">{r.dowFull}</span>
                    <span className="cell-main sch-ds">{r.dowShort}</span>
                    <span className="sch-total">{r.totalHours}</span>
                  </div>

                  <div className="sch-track">
                    {r.hasSchedule ? (
                      r.segments.map((seg, sIdx) => (
                        <div
                          key={sIdx}
                          className={`sch-seg ${seg.cls}`}
                          style={{ left: seg.left, width: seg.width }}
                          title={seg.label}
                        >
                          <span className="sch-seg-t">{seg.label}</span>
                        </div>
                      ))
                    ) : (
                      <span className="sch-off">Выходной</span>
                    )}
                  </div>

                  <div className="sch-act">
                    {r.hasSchedule && r.ws ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          aria-label={`Изменить ${r.dowFull}`}
                          title={`Изменить ${r.dowFull}`}
                          onClick={() => onEditDay(r.ws!, r.dayIndex)}
                        >
                          <Pencil className="ic" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-icon"
                          style={{ color: 'var(--destructive)' }}
                          aria-label={`Удалить ${r.dowFull}`}
                          title={`Сделать выходным (${r.dowFull})`}
                          onClick={() => onDeleteDay(r.ws!.id, r.dowFull)}
                        >
                          <Trash2 className="ic" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => onAddDay(r.dayIndex)}
                      >
                        <Plus className="ic" />
                        <span>Рабочий день</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="sch-foot">
                <span className="legend">
                  <span>
                    <i style={{ background: 'var(--primary)' }} />
                    Приём
                  </span>
                  <span>
                    <i className="sch-lg-brk" />
                    Перерыв
                  </span>
                </span>
                <span className="small">
                  Итого за неделю: <b>{formatDurationMinutes(totalWeekMins)}</b>
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
