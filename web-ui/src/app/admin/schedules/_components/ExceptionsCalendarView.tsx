'use client';

import React, { useMemo } from 'react';
import { CalendarOff } from 'lucide-react';
import type { ScheduleException } from '@/modules/admin/types';
import type { Veterinarian } from '@/modules/clinic/types';
import { formatIsoDateDisplay, getMoscowTodayIso } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export interface ExceptionsCalendarViewProps {
  exceptions: ScheduleException[];
  vets: Veterinarian[];
  vetFilter: string;
  onEdit: (exception: ScheduleException) => void;
}

const NDAYS = 35;

export const ExceptionsCalendarView: React.FC<ExceptionsCalendarViewProps> = ({
  exceptions,
  vets,
  vetFilter,
  onEdit,
}) => {
  const todayIso = getMoscowTodayIso();

  const ganttDays = useMemo(() => {
    const [y, m, day] = todayIso.split('-').map(Number);
    const baseMs = Date.UTC(y, m - 1, day);
    return Array.from({ length: NDAYS }, (_, i) => {
      const d = new Date(baseMs + i * 86400000);
      const dow = d.getUTCDay();
      const isMonday = dow === 1;
      const isWeekend = dow === 0 || dow === 6;
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const label = isMonday || i === 0 ? `${d.getUTCDate()}.${mm}` : '';
      return { i, iso: `${yyyy}-${mm}-${dd}`, label, isWeekend };
    });
  }, [todayIso]);

  const ganttLanes = useMemo(() => {
    const t0 = Date.parse(todayIso);
    const targetVets = vetFilter ? vets.filter((v) => v.id === vetFilter) : vets;

    return targetVets.map((v) => {
      const vetName = getDoctorDisplay(v).fullName;
      const vetExc = exceptions.filter((e) => e.veterinarianId === v.id);

      const bars = vetExc
        .map((e) => {
          const offStart = Math.floor((Date.parse(e.startDate) - t0) / 86400000);
          const offEnd = Math.floor((Date.parse(e.endDate) - t0) / 86400000);
          if (offEnd < 0 || offStart >= NDAYS) return null;

          const a = Math.max(0, offStart);
          const b = Math.min(NDAYS - 1, offEnd);
          const isAbsence = e.type === 'ABSENCE';

          return {
            id: e.id,
            left: `${(a / NDAYS) * 100}%`,
            width: `${Math.max(1, ((b - a + 1) / NDAYS) * 100)}%`,
            bg: isAbsence
              ? 'color-mix(in srgb, var(--destructive) 70%, transparent)'
              : 'var(--primary)',
            tip: `${vetName}: ${isAbsence ? 'Отсутствие' : 'Особые часы'}, ${formatIsoDateDisplay(e.startDate)}–${formatIsoDateDisplay(e.endDate)}${e.reason ? ` · ${e.reason}` : ''}`,
            exception: e,
          };
        })
        .filter((b): b is NonNullable<typeof b> => Boolean(b));

      return { vetId: v.id, vetName, bars };
    });
  }, [vets, exceptions, vetFilter, todayIso]);

  return (
    <section className="island" style={{ flex: 'none' }} aria-label="Календарь исключений">
      <div className="island-head">
        <span className="island-title">
          <CalendarOff className="ic" />
          <span>Календарь исключений</span>
        </span>
        <div className="legend">
          <span>
            <i style={{ background: 'color-mix(in srgb, var(--destructive) 65%, transparent)' }} />
            Отсутствие
          </span>
          <span>
            <i style={{ background: 'var(--primary)' }} />
            Особые часы
          </span>
        </div>
      </div>

      <div className="island-body" style={{ overflowX: 'auto', padding: '12px 14px' }}>
        <div style={{ minWidth: '760px' }}>
          <div className="row" style={{ gap: 0, paddingLeft: '130px', marginBottom: '4px' }}>
            {ganttDays.map((d) => (
              <span
                key={d.iso}
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: 'center',
                  fontSize: '10px',
                  fontWeight: d.isWeekend ? 600 : 400,
                }}
                className="muted"
              >
                {d.label}
              </span>
            ))}
          </div>

          {ganttLanes.map((lane) => (
            <div
              key={lane.vetId}
              className="row"
              style={{
                gap: 0,
                height: '28px',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              <span
                className="small"
                style={{
                  width: '130px',
                  flex: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  paddingRight: '8px',
                }}
                title={lane.vetName}
              >
                {lane.vetName}
              </span>

              <div className="grow" style={{ position: 'relative', height: '100%' }}>
                {lane.bars.map((bar) => (
                  <button
                    key={bar.id}
                    type="button"
                    aria-label={bar.tip}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      height: '16px',
                      left: bar.left,
                      width: bar.width,
                      background: bar.bg,
                      borderRadius: '4px',
                      border: 0,
                      padding: 0,
                      cursor: 'pointer',
                    }}
                    title={bar.tip}
                    onClick={() => onEdit(bar.exception)}
                  />
                ))}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: '2px',
                    background: 'var(--primary)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
