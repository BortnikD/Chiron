'use client';

import React, { useMemo } from 'react';
import { Veterinarian, WorkSchedule } from '../../../../types';
import { CalendarDays, RefreshCw, Pencil, Trash2, Plus } from 'lucide-react';
import {
  DOWS,
  DOWS_FULL,
  INDEX_TO_DOW,
  tm,
  pctX,
  pctW,
  fmtH,
} from './utils';

export interface WeeklyScheduleMatrixProps {
  vets: Veterinarian[];
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

/**
 * Матричная сетка недельного расписания врача (Пн-Вс).
 * Отображает шкалу времени от 08:00 до 20:00, слоты приёма и перерывов,
 * суммарные часы за день/неделю, а также кнопки добавления/редактирования/удаления.
 */
export const WeeklyScheduleMatrix: React.FC<WeeklyScheduleMatrixProps> = ({
  vets,
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
  // Вычисление данных строк расписания на 7 дней недели
  const scheduleRows = useMemo(() => {
    return DOWS.map((shortName, i) => {
      const dowEnum = INDEX_TO_DOW[i];
      const ws = schedules.find((s) => s.dayOfWeek === dowEnum);

      if (!ws) {
        return {
          dayIndex: i,
          dowShort: shortName,
          dowFull: DOWS_FULL[i],
          hasSchedule: false,
          totalHours: '—',
          mins: 0,
          rowCls: 'off',
          ws: null,
          segments: [],
        };
      }

      const start = ws.startTime.slice(0, 5);
      const end = ws.endTime.slice(0, 5);
      const bs = ws.breakStart ? ws.breakStart.slice(0, 5) : '';
      const be = ws.breakEnd ? ws.breakEnd.slice(0, 5) : '';

      const durMins = tm(end) - tm(start) - (bs && be ? tm(be) - tm(bs) : 0);
      const isWeekend = i >= 5;

      const segments: { left: string; width: string; cls: string; label: string }[] = [];

      if (bs && be) {
        // Интервал работы до обеденного перерыва
        segments.push({
          left: pctX(start),
          width: pctW(start, bs),
          cls: `work ${tm(bs) - tm(start) < 90 ? 'narrow' : ''}`,
          label: `${start}–${bs}`,
        });
        // Интервал перерыва
        segments.push({
          left: pctX(bs),
          width: pctW(bs, be),
          cls: `brk ${tm(be) - tm(bs) < 90 ? 'narrow' : ''}`,
          label: 'перерыв',
        });
        // Интервал работы после перерыва
        segments.push({
          left: pctX(be),
          width: pctW(be, end),
          cls: `work ${tm(end) - tm(be) < 90 ? 'narrow' : ''}`,
          label: `${be}–${end}`,
        });
      } else {
        segments.push({
          left: pctX(start),
          width: pctW(start, end),
          cls: `work ${tm(end) - tm(start) < 90 ? 'narrow' : ''}`,
          label: `${start}–${end}`,
        });
      }

      return {
        dayIndex: i,
        dowShort: shortName,
        dowFull: DOWS_FULL[i],
        hasSchedule: true,
        totalHours: fmtH(durMins),
        mins: durMins,
        rowCls: isWeekend ? 'we' : '',
        ws,
        segments,
      };
    });
  }, [schedules]);

  // Суммарное количество отработанных минут за всю неделю
  const totalWeekMins = useMemo(() => {
    return scheduleRows.reduce((acc, r) => acc + r.mins, 0);
  }, [scheduleRows]);

  return (
    <>
      {/* Панель выбора врача */}
      <section className="island filters" aria-label="Врач">
        <div className="field" style={{ width: '320px' }}>
          <span className="field-label">Врач</span>
          <select
            className="select"
            value={selectedVetId}
            onChange={(e) => onSelectVet(e.target.value)}
            disabled={loadingVets}
          >
            {vets.map((v) => (
              <option key={v.id} value={v.id}>
                {v.user?.fullName || `Врач (${v.id.substring(0, 6)})`}
              </option>
            ))}
          </select>
        </div>

        <div className="spacer" />

        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          onClick={onRefresh}
          title="Обновить график"
        >
          <RefreshCw className={`ic ${loadingSchedule ? 'animate-spin' : ''}`} />
        </button>
      </section>

      {/* Основной остров с визуальным расписанием .sch */}
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
              {/* Шкала времени от 08:00 до 20:00 (13 делений) */}
              <div className="sch-row sch-head">
                <span className="sch-day" />
                <div className="sch-scale">
                  <span className="first" style={{ left: '0%' }}>
                    08:00
                  </span>
                  <span style={{ left: '8.333%' }}>09:00</span>
                  <span style={{ left: '16.666%' }}>10:00</span>
                  <span style={{ left: '25%' }}>11:00</span>
                  <span style={{ left: '33.333%' }}>12:00</span>
                  <span style={{ left: '41.666%' }}>13:00</span>
                  <span style={{ left: '50%' }}>14:00</span>
                  <span style={{ left: '58.333%' }}>15:00</span>
                  <span style={{ left: '66.666%' }}>16:00</span>
                  <span style={{ left: '75%' }}>17:00</span>
                  <span style={{ left: '83.333%' }}>18:00</span>
                  <span style={{ left: '91.666%' }}>19:00</span>
                  <span className="last" style={{ left: '100%' }}>
                    20:00
                  </span>
                </div>
                <span className="sch-act" />
              </div>

              {/* 7 строк по дням недели */}
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
                          className="btn btn-ghost btn-sm btn-icon text-[var(--destructive)]"
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

              {/* Подвал с легендой и итоговыми часами */}
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
                  Итого за неделю: <b>{fmtH(totalWeekMins)}</b>
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
