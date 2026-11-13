import type { Appointment, Pet } from '@/modules/client/types';
import type { WorkSchedule } from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import {
  APPOINTMENT_STATUS_META,
  DOW_ORDER,
  formatSlotTime,
  timeToMinutes,
} from '@/shared/lib';
import { getPetName } from './utils';

export const VET_STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'var(--st-pending-fg)',
  CONFIRMED: 'var(--st-confirmed-fg)',
  COMPLETED: 'var(--st-completed-fg)',
  CANCELLED: 'var(--st-cancelled-fg)',
  NO_SHOW: 'var(--st-noshow-fg)',
};

export const VET_DAY_STAT_ORDER: Array<[AppointmentStatus, string]> = [
  ['COMPLETED', 'завершено'],
  ['CONFIRMED', 'подтверждено'],
  ['PENDING', 'ожидает'],
  ['CANCELLED', 'отменено'],
  ['NO_SHOW', 'неявка'],
];

export type TimelineItem =
  | { kind: 'now'; key: string }
  | { kind: 'break'; key: string }
  | { kind: 'appt'; key: string; appt: Appointment; isNow: boolean; isPast: boolean; isNext: boolean };

export function resolveTodaySchedule(todayIso: string, workSchedules: WorkSchedule[]): WorkSchedule | null {
  const d = new Date(`${todayIso}T12:00:00+03:00`);
  const dayIdx = (d.getUTCDay() + 6) % 7;
  const dowEnum = DOW_ORDER[dayIdx];
  return workSchedules.find((s) => s.dayOfWeek === dowEnum) || null;
}

export function computeDayBounds(
  todaySchedule: WorkSchedule | null,
  todayAppointments: Appointment[]
): { dayStartMin: number; dayEndMin: number } {
  let minM = 9 * 60;
  let maxM = 18 * 60;
  if (todaySchedule) {
    minM = Math.min(minM, Math.floor(timeToMinutes(todaySchedule.startTime) / 60) * 60);
    maxM = Math.max(maxM, Math.ceil(timeToMinutes(todaySchedule.endTime) / 60) * 60);
  }
  todayAppointments.forEach((a) => {
    const s = timeToMinutes(formatSlotTime(a.startAt));
    const e = timeToMinutes(formatSlotTime(a.endAt));
    minM = Math.min(minM, Math.floor(s / 60) * 60);
    maxM = Math.max(maxM, Math.ceil(e / 60) * 60);
  });
  return { dayStartMin: minM, dayEndMin: Math.max(minM + 60, maxM) };
}

export function buildDayHourTicks(dayStartMin: number, dayEndMin: number) {
  const dayLen = dayEndMin - dayStartMin;
  const startH = Math.floor(dayStartMin / 60);
  const endH = Math.floor(dayEndMin / 60);
  const list: Array<{ l: string; label: string; cls: string }> = [];
  for (let h = startH; h <= endH; h++) {
    list.push({
      l: `${((h * 60 - dayStartMin) / dayLen) * 100}%`,
      label: `${String(h).padStart(2, '0')}:00`,
      cls: `${h === endH ? 'last ' : ''}${h % 2 ? 'odd' : 'even'}`,
    });
  }
  return list;
}

export function buildDayStripBlocks(
  todayAppointments: Appointment[],
  petsMap: Record<string, Pet>,
  dayStartMin: number,
  dayLen: number
) {
  const toPct = (min: number) =>
    `${Math.max(0, Math.min(100, ((min - dayStartMin) / dayLen) * 100))}%`;

  return todayAppointments.map((a) => {
    const sTime = formatSlotTime(a.startAt);
    const eTime = formatSlotTime(a.endAt);
    const sMin = timeToMinutes(sTime);
    const eMin = Math.max(sMin + 10, timeToMinutes(eTime));
    const petName = getPetName(a, petsMap);
    const statusLabel = APPOINTMENT_STATUS_META[a.status]?.label || a.status;
    return {
      appt: a,
      left: toPct(sMin),
      width: `calc(${Math.max(1.5, ((eMin - sMin) / dayLen) * 100)}% - 2px)`,
      color: VET_STATUS_COLORS[a.status],
      tip: `${sTime}–${eTime} · ${petName} · ${statusLabel}`,
    };
  });
}

export function buildTimelineRows(params: {
  todayAppointments: Appointment[];
  hasBreak: boolean;
  breakStartMin: number;
  nowMinutes: number;
  dayStartMin: number;
  dayEndMin: number;
  nextAppointment: Appointment | null;
}): TimelineItem[] {
  const {
    todayAppointments,
    hasBreak,
    breakStartMin,
    nowMinutes,
    dayStartMin,
    dayEndMin,
    nextAppointment,
  } = params;

  const items: TimelineItem[] = [];
  let nowPlaced = false;
  let breakPlaced = false;
  const sorted = todayAppointments
    .slice()
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  sorted.forEach((a) => {
    const sMin = timeToMinutes(formatSlotTime(a.startAt));
    const eMin = timeToMinutes(formatSlotTime(a.endAt));

    if (hasBreak && !breakPlaced && sMin >= breakStartMin) {
      if (!nowPlaced && nowMinutes >= dayStartMin && nowMinutes < breakStartMin) {
        items.push({ kind: 'now', key: 'now-line' });
        nowPlaced = true;
      }
      items.push({ kind: 'break', key: 'lunch-break' });
      breakPlaced = true;
    }

    if (!nowPlaced && nowMinutes >= dayStartMin && sMin > nowMinutes) {
      items.push({ kind: 'now', key: 'now-line' });
      nowPlaced = true;
    }

    const isNow = sMin <= nowMinutes && eMin > nowMinutes;
    const isPast = sMin < nowMinutes && !isNow;
    const isNext = nextAppointment?.id === a.id;
    items.push({ kind: 'appt', key: a.id, appt: a, isNow, isPast, isNext });
  });

  if (!nowPlaced && sorted.length > 0 && nowMinutes >= dayStartMin && nowMinutes <= dayEndMin) {
    items.push({ kind: 'now', key: 'now-line' });
  }

  return items;
}
