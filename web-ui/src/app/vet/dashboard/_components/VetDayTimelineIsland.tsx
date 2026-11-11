'use client';

import React, { useMemo } from 'react';
import { Clock, Repeat } from 'lucide-react';
import type { Appointment, Pet } from '@/modules/client/types';
import type { WorkSchedule } from '@/modules/clinic/types';
import {
  APPOINTMENT_STATUS_META,
  formatSlotTime,
  getSpeciesTone,
  timeToMinutes,
} from '@/shared/lib';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { formatWeekdayDateRu } from './vetHelpers';
import { getPetName } from './utils';
import {
  buildDayHourTicks,
  buildDayStripBlocks,
  buildTimelineRows,
  computeDayBounds,
  resolveTodaySchedule,
  VET_DAY_STAT_ORDER,
  VET_STATUS_COLORS,
} from './vetTimelineUtils';

export interface VetDayTimelineIslandProps {
  todayIso: string;
  nowHhmm: string;
  nowMinutes: number;
  todayAppointments: Appointment[];
  selectedAppointment: Appointment | null;
  nextAppointment: Appointment | null;
  workSchedules: WorkSchedule[];
  servicesMap: Record<string, string>;
  petsMap: Record<string, Pet>;
  speciesMap: Record<string, string>;
  loading?: boolean;
  onSelectAppointment: (appt: Appointment) => void;
}

export const VetDayTimelineIsland: React.FC<VetDayTimelineIslandProps> = ({
  todayIso,
  nowHhmm,
  nowMinutes,
  todayAppointments,
  selectedAppointment,
  nextAppointment,
  workSchedules,
  servicesMap,
  petsMap,
  speciesMap,
  loading = false,
  onSelectAppointment,
}) => {
  const dateHeader = useMemo(() => formatWeekdayDateRu(todayIso), [todayIso]);

  const todaySchedule = useMemo(
    () => resolveTodaySchedule(todayIso, workSchedules),
    [todayIso, workSchedules]
  );

  const { dayStartMin, dayEndMin } = useMemo(
    () => computeDayBounds(todaySchedule, todayAppointments),
    [todaySchedule, todayAppointments]
  );

  const dayLen = dayEndMin - dayStartMin;
  const breakStartStr = todaySchedule?.breakStart?.slice(0, 5) || '13:00';
  const breakEndStr = todaySchedule?.breakEnd?.slice(0, 5) || '14:00';
  const hasBreak = todaySchedule ? Boolean(todaySchedule.breakStart && todaySchedule.breakEnd) : true;
  const breakStartMin = timeToMinutes(breakStartStr);
  const breakEndMin = timeToMinutes(breakEndStr);

  const dayStats = useMemo(
    () =>
      VET_DAY_STAT_ORDER.map(([status, label]) => ({
        status,
        label,
        n: todayAppointments.filter((a) => a.status === status).length,
        color: VET_STATUS_COLORS[status],
      })).filter((d) => d.n > 0),
    [todayAppointments]
  );

  const dayHours = useMemo(() => buildDayHourTicks(dayStartMin, dayEndMin), [dayStartMin, dayEndMin]);

  const toPct = (min: number) =>
    `${Math.max(0, Math.min(100, ((min - dayStartMin) / dayLen) * 100))}%`;

  const dayBlocks = useMemo(
    () => buildDayStripBlocks(todayAppointments, petsMap, dayStartMin, dayLen),
    [todayAppointments, petsMap, dayStartMin, dayLen]
  );

  const timelineItems = useMemo(
    () =>
      buildTimelineRows({
        todayAppointments,
        hasBreak,
        breakStartMin,
        nowMinutes,
        dayStartMin,
        dayEndMin,
        nextAppointment,
      }),
    [todayAppointments, hasBreak, breakStartMin, nowMinutes, dayStartMin, dayEndMin, nextAppointment]
  );

  const showNowPin = nowMinutes >= dayStartMin && nowMinutes <= dayEndMin;

  return (
    <section className="island grow" aria-label="Таймлайн дня">
      <div className="island-head">
        <span className="island-title">
          <Clock className="ic" />
          <span>{dateHeader}</span>
        </span>
        <div className="chips">
          {dayStats.map((d) => (
            <span key={d.status} className="day-stat">
              <i style={{ background: d.color }} />
              <b>{d.n}</b>
              {d.label}
            </span>
          ))}
        </div>
      </div>

      <div className="day-strip-wrap">
        <div
          className="day-strip"
          aria-label={`Загрузка дня ${dayHours[0]?.label || '09:00'}–${dayHours[dayHours.length - 1]?.label || '18:00'}`}
        >
          {dayHours.map((h) => (
            <span key={h.label} className={`ds-tick ${h.cls}`} style={{ left: h.l }}>
              <span>{h.label}</span>
            </span>
          ))}
          {hasBreak && breakEndMin > breakStartMin && (
            <div
              className="ds-break"
              style={{
                left: toPct(breakStartMin),
                width: `${((breakEndMin - breakStartMin) / dayLen) * 100}%`,
              }}
              title={`Перерыв ${breakStartStr}–${breakEndStr}`}
            />
          )}
          {dayBlocks.map((b) => (
            <button
              key={b.appt.id}
              type="button"
              className="ds-block"
              style={{ left: b.left, width: b.width, background: b.color }}
              title={b.tip}
              aria-label={b.tip}
              onClick={() => onSelectAppointment(b.appt)}
            />
          ))}
          {showNowPin && (
            <div className="ds-now" style={{ left: toPct(nowMinutes) }}>
              <span>{nowHhmm}</span>
            </div>
          )}
        </div>
      </div>

      <div className="island-body">
        {loading && todayAppointments.length === 0 ? (
          <div className="col" style={{ gap: '8px' }}>
            <div className="skeleton" style={{ height: '58px' }} />
            <div className="skeleton" style={{ height: '58px' }} />
            <div className="skeleton" style={{ height: '58px' }} />
          </div>
        ) : todayAppointments.length === 0 ? (
          <div className="empty">
            <div className="empty-art">
              <Clock className="ic ic-20" />
            </div>
            <span className="empty-title">На сегодня приёмов нет</span>
            <span>Новые записи на текущую смену появятся здесь автоматически</span>
          </div>
        ) : (
          <div className="timeline">
            {timelineItems.map((item) => {
              if (item.kind === 'now') {
                return (
                  <div key={item.key} className="tl-row tl-now-row">
                    <span className="tl-time">
                      <span className="tl-now-pill">{nowHhmm}</span>
                    </span>
                    <div className="tl-now" />
                  </div>
                );
              }
              if (item.kind === 'break') {
                return (
                  <div key={item.key} className="tl-row">
                    <span className="tl-time">{breakStartStr}</span>
                    <div className="tl-break">Перерыв до {breakEndStr}</div>
                  </div>
                );
              }

              const a = item.appt;
              const startStr = formatSlotTime(a.startAt);
              const endStr = formatSlotTime(a.endAt);
              const pet = a.pet || petsMap[a.petId];
              const petName = getPetName(a, petsMap);
              const speciesName =
                pet?.species?.name ||
                pet?.speciesName ||
                (pet?.speciesId && speciesMap[pet.speciesId]) ||
                '';
              const tone = getSpeciesTone(
                pet?.species?.name || pet?.speciesName || pet?.speciesId || 'cat',
                speciesMap
              );
              const serviceName =
                a.serviceName || a.service?.name || servicesMap[a.serviceId] || 'Приём';
              const stShort = APPOINTMENT_STATUS_META[a.status]?.short || a.status;
              const stColor = VET_STATUS_COLORS[a.status];
              const isSel = selectedAppointment?.id === a.id;

              return (
                <div key={item.key} className="tl-row">
                  <span className="tl-time">
                    {startStr}
                    <span className="tl-time-end">{endStr}</span>
                  </span>
                  <button
                    type="button"
                    className={`tl-card tl-appt ${item.isNext ? 'next' : item.isNow ? 'now' : ''} ${isSel ? 'sel' : ''} ${item.isPast ? 'past' : ''}`}
                    style={{ '--st': stColor } as React.CSSProperties}
                    onClick={() => onSelectAppointment(a)}
                  >
                    <span
                      className="pet-ava"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'color-mix(in srgb, var(--st) 16%, transparent)',
                        color: 'var(--st)',
                      }}
                    >
                      <SpeciesIcon species={tone} size={20} />
                    </span>
                    <span className="col grow" style={{ gap: '1px' }}>
                      <span className="row" style={{ gap: '8px' }}>
                        <span className="cell-main">{petName}</span>
                        {speciesName && <span className="muted small">{speciesName}</span>}
                        {item.isNext && (
                          <span className="badge badge-accent" style={{ height: '20px' }}>
                            Следующий
                          </span>
                        )}
                      </span>
                      <span className="cell-sub">{serviceName}</span>
                    </span>
                    {a.followUpOf && (
                      <span title="Повторный приём" style={{ color: 'var(--primary-text)', display: 'inline-flex' }}>
                        <Repeat className="ic" aria-label="Повторный приём" />
                      </span>
                    )}
                    <span className={`badge st badge-${a.status}`}>{stShort}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
