'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { CalendarOff } from 'lucide-react';
import type { ScheduleException } from '@/modules/admin/types';
import type { Veterinarian } from '@/modules/clinic/types';
import { formatIsoDateDisplay, getMoscowTodayIso, getDoctorDisplay, getSpecStyle, getSpecTone } from '@/shared/lib';
import { VetAvatar } from '@/components/ui/EntityAvatar';

export interface ExceptionsCalendarViewProps {
  exceptions: ScheduleException[];
  vets: Veterinarian[];
  specsMap?: Record<string, string>;
  vetFilter: string;
  typeFilter?: string;
  fromFilter?: string;
  toFilter?: string;
  onEdit: (exception: ScheduleException) => void;
}

const NAME_COL_WIDTH = 230;
const DAY_COL_WIDTH = 50; // Фиксированная одинаковая ширина каждого дня для любого диапазона
const DOW_RU = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

export const ExceptionsCalendarView: React.FC<ExceptionsCalendarViewProps> = ({
  exceptions,
  vets,
  specsMap,
  vetFilter,
  typeFilter = '',
  fromFilter = '',
  toFilter = '',
  onEdit,
}) => {
  const todayIso = useMemo(() => getMoscowTodayIso(), []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Вычисление диапазона дат строго по фильтрам дат (по умолчанию: вчера + 7 дней)
  const { startMs, numDays, ganttDays } = useMemo(() => {
    const effFrom = fromFilter || getMoscowTodayIso(-1);
    const effTo = toFilter || getMoscowTodayIso(6);

    const [fy, fm, fd] = effFrom.split('-').map(Number);
    const baseStartMs = Date.UTC(fy, fm - 1, fd);

    const [ey, em, ed] = effTo.split('-').map(Number);
    let baseEndMs = Date.UTC(ey, em - 1, ed);

    if (baseEndMs < baseStartMs) {
      baseEndMs = baseStartMs + 7 * 86400000;
    }

    const calculatedDays = Math.round((baseEndMs - baseStartMs) / 86400000) + 1;
    const totalDays = Math.max(1, Math.min(365, calculatedDays));

    const days = Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(baseStartMs + i * 86400000);
      const dow = d.getUTCDay();
      const isWeekend = dow === 0 || dow === 6;
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;
      const isToday = iso === todayIso;

      return { i, iso, label: `${dd}.${mm}`, isWeekend, isToday, dd, mm, dow };
    });

    return { startMs: baseStartMs, numDays: totalDays, ganttDays: days };
  }, [fromFilter, toFilter, todayIso]);

  const todayIndex = useMemo(() => {
    return ganttDays.findIndex((d) => d.isToday);
  }, [ganttDays]);

  const timelineWidth = numDays * DAY_COL_WIDTH;

  // Автоскролл к полоске "Сегодня" при первой загрузке, если сегодня вне видимой области
  useEffect(() => {
    if (todayIndex >= 0 && scrollContainerRef.current) {
      const targetScroll = Math.max(0, todayIndex * DAY_COL_WIDTH - 160);
      scrollContainerRef.current.scrollLeft = targetScroll;
    }
  }, [todayIndex]);

  const ganttLanes = useMemo(() => {
    const isAllVets = !vetFilter || vetFilter === 'ALL';
    const targetVets = isAllVets ? vets : vets.filter((v) => v.id === vetFilter);

    return targetVets.map((v) => {
      const doc = getDoctorDisplay(v, specsMap);
      const vetName = doc.fullName;
      const vetExc = exceptions.filter(
        (e) => e.veterinarianId === v.id && (!typeFilter || e.type === typeFilter)
      );

      const bars = vetExc
        .map((e) => {
          const eStartMs = Date.parse(e.startDate);
          const eEndMs = Date.parse(e.endDate);
          const offStart = Math.floor((eStartMs - startMs) / 86400000);
          const offEnd = Math.floor((eEndMs - startMs) / 86400000);
          if (offEnd < 0 || offStart >= numDays) return null;

          const a = Math.max(0, offStart);
          const b = Math.min(numDays - 1, offEnd);
          const isAbsence = e.type === 'ABSENCE';

          const leftPx = a * DAY_COL_WIDTH;
          const widthPx = Math.max(16, (b - a + 1) * DAY_COL_WIDTH);

          return {
            id: e.id,
            leftPx,
            widthPx,
            bg: isAbsence
              ? 'color-mix(in srgb, var(--destructive) 75%, transparent)'
              : 'var(--primary)',
            tip: `${vetName}: ${isAbsence ? 'Отсутствие' : 'Особые часы'}, ${formatIsoDateDisplay(e.startDate)}–${formatIsoDateDisplay(e.endDate)}${e.reason ? ` · ${e.reason}` : ''}`,
            exception: e,
          };
        })
        .filter((b): b is NonNullable<typeof b> => Boolean(b));

      return {
        vetId: v.id,
        vet: v,
        vetName,
        initials: doc.initials,
        tone: getSpecTone(v.specializationId),
        specStyle: getSpecStyle(v.specializationId),
        bars,
      };
    });
  }, [vets, specsMap, exceptions, vetFilter, typeFilter, startMs, numDays]);

  return (
    <section className="island" style={{ flex: 'none' }} aria-label="Календарь исключений">
      <div className="island-head" style={{ gap: 12, padding: '12px 16px' }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <CalendarOff className="ic text-primary" size={18} />
          <span className="island-title" style={{ fontSize: '15px' }}>
            Таймлайн исключений
          </span>
          <span className="small muted">
            ({numDays} {numDays === 1 ? 'день' : numDays < 5 ? 'дня' : 'дней'})
          </span>
        </div>

        <div className="legend" style={{ gap: 12, fontSize: '12px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i style={{ width: 10, height: 10, borderRadius: 2, background: 'color-mix(in srgb, var(--destructive) 75%, transparent)' }} />
            Отсутствие
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)' }} />
            Особые часы
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, borderTop: '2px dashed var(--primary)', display: 'inline-block' }} />
            Текущий день
          </span>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="island-body"
        style={{
          overflowX: 'auto',
          padding: '0 0 12px 0',
          scrollbarGutter: 'stable',
        }}
      >
        <div style={{ minWidth: `${NAME_COL_WIDTH + timelineWidth}px` }}>
          {/* Шапка с датами: столбец врача статичен (sticky) */}
          <div
            className="row"
            style={{
              gap: 0,
              position: 'relative',
              height: '42px',
              borderBottom: '1px solid var(--border)',
              alignItems: 'stretch',
            }}
          >
            {/* Статичная шапка колонки врача */}
            <div
              style={{
                width: `${NAME_COL_WIDTH}px`,
                flex: 'none',
                position: 'sticky',
                left: 0,
                zIndex: 6,
                background: 'var(--card)',
                paddingLeft: '16px',
                paddingRight: '12px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '1px 0 0 var(--border)',
              }}
            >
              Врач
            </div>

            {/* Ячейки дней с одинаковой фиксированной шириной */}
            {ganttDays.map((d) => (
              <div
                key={d.iso}
                style={{
                  width: `${DAY_COL_WIDTH}px`,
                  flex: 'none',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 0',
                  borderRight: '1px solid color-mix(in srgb, var(--border) 40%, transparent)',
                  background: d.isToday
                    ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                    : d.isWeekend
                    ? 'color-mix(in srgb, var(--muted) 20%, transparent)'
                    : undefined,
                }}
                title={d.isToday ? 'Сегодня' : undefined}
              >
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: d.isToday ? 'var(--primary)' : d.isWeekend ? 'var(--muted-foreground)' : 'var(--muted-foreground)',
                    lineHeight: 1.1,
                  }}
                >
                  {DOW_RU[d.dow]}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: d.isToday ? 750 : 500,
                    color: d.isToday ? 'var(--primary-foreground)' : 'var(--foreground)',
                    background: d.isToday ? 'var(--primary)' : undefined,
                    borderRadius: '4px',
                    padding: d.isToday ? '1px 5px' : '0',
                    lineHeight: 1.2,
                    marginTop: '2px',
                  }}
                >
                  {d.label}
                </span>
              </div>
            ))}
          </div>

          {/* Строки врачей: столбец ФИО статичен (sticky) */}
          {ganttLanes.map((lane) => (
            <div
              key={lane.vetId}
              className="row"
              style={{
                gap: 0,
                height: '38px',
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              {/* Статичное ФИО врача с фото и непрозрачным фоном */}
              <div
                className="small"
                style={{
                  width: `${NAME_COL_WIDTH}px`,
                  flex: 'none',
                  position: 'sticky',
                  left: 0,
                  zIndex: 4,
                  background: 'var(--card)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  paddingLeft: '14px',
                  paddingRight: '10px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '100%',
                  boxShadow: '1px 0 0 var(--border)',
                }}
                title={lane.vetName}
              >
                <VetAvatar
                  vet={lane.vet}
                  initials={lane.initials}
                  tone={lane.tone}
                  style={lane.specStyle}
                  variant="thumb"
                  className="t-ava xs round"
                  alt={lane.vetName}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lane.vetName}
                </span>
              </div>

              {/* Таймлайн с полосками и линией "Сегодня" */}
              <div
                style={{
                  position: 'relative',
                  width: `${timelineWidth}px`,
                  height: '100%',
                  flex: 'none',
                }}
              >
                {/* Фоновая сетка дней с равным шагом */}
                {ganttDays.map((d) => (
                  <div
                    key={d.iso}
                    style={{
                      position: 'absolute',
                      left: `${d.i * DAY_COL_WIDTH}px`,
                      top: 0,
                      bottom: 0,
                      width: `${DAY_COL_WIDTH}px`,
                      borderRight: '1px solid color-mix(in srgb, var(--border) 40%, transparent)',
                      background: d.isToday
                        ? 'color-mix(in srgb, var(--primary) 5%, transparent)'
                        : d.isWeekend
                        ? 'color-mix(in srgb, var(--muted) 20%, transparent)'
                        : undefined,
                    }}
                  />
                ))}

                {/* Вертикальная пунктирная линия текущего дня */}
                {todayIndex >= 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${todayIndex * DAY_COL_WIDTH + DAY_COL_WIDTH / 2}px`,
                      width: '2px',
                      borderLeft: '2px dashed var(--primary)',
                      zIndex: 2,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Полоски отсутствий / особых часов */}
                {lane.bars.map((bar) => (
                  <button
                    key={bar.id}
                    type="button"
                    aria-label={bar.tip}
                    style={{
                      position: 'absolute',
                      top: '7px',
                      height: '24px',
                      left: `${bar.leftPx}px`,
                      width: `${bar.widthPx}px`,
                      background: bar.bg,
                      borderRadius: '5px',
                      border: 0,
                      padding: '0 6px',
                      cursor: 'pointer',
                      zIndex: 3,
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    }}
                    title={bar.tip}
                    onClick={() => onEdit(bar.exception)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
