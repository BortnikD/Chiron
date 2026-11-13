import type {
  CreateScheduleExceptionRequest,
  CreateWorkScheduleRequest,
  ScheduleException,
  UpdateScheduleExceptionRequest,
  UpdateWorkScheduleRequest,
  WorkSchedule,
} from '@/modules/admin/types';
import type { Specialization, Veterinarian } from '@/modules/clinic/types';
import { DOW_ORDER, formatIsoDateDisplay } from '@/shared/lib';
import type { DayOfWeek, ScheduleExceptionType } from '@/shared/types';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export interface WorkScheduleSavePayload {
  scheduleId?: string;
  veterinarianId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
}

export interface ScheduleExceptionSavePayload {
  exceptionId?: string;
  veterinarianId: string;
  type: ScheduleExceptionType;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export type DeleteScheduleTarget =
  | { type: 'schedule'; id: string; dowName: string }
  | { type: 'exception'; exception: ScheduleException }
  | null;

export function resolveScheduleTab(tabParam: string | null): 'sched' | 'exc' {
  return tabParam === 'exc' || tabParam === 'exceptions' ? 'exc' : 'sched';
}

export function resolveFreeDayIndex(schedules: WorkSchedule[], dayIdx?: number): number {
  if (dayIdx !== undefined) return dayIdx;
  const scheduledDows = new Set(schedules.map((s) => s.dayOfWeek));
  const firstFree = DOW_ORDER.findIndex((d) => !scheduledDows.has(d));
  return firstFree >= 0 ? firstFree : 0;
}

export function buildWorkScheduleUpdatePayload(data: WorkScheduleSavePayload): UpdateWorkScheduleRequest {
  return {
    startTime: data.startTime,
    endTime: data.endTime,
    breakStart: data.breakStart,
    breakEnd: data.breakEnd,
  };
}

export function buildWorkScheduleCreatePayload(data: WorkScheduleSavePayload): CreateWorkScheduleRequest {
  return {
    veterinarianId: data.veterinarianId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    breakStart: data.breakStart,
    breakEnd: data.breakEnd,
  };
}

export function buildExceptionUpdatePayload(
  data: ScheduleExceptionSavePayload
): UpdateScheduleExceptionRequest {
  return {
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.type === 'CUSTOM_HOURS' ? data.startTime : null,
    endTime: data.type === 'CUSTOM_HOURS' ? data.endTime : null,
    reason: data.reason || null,
  };
}

export function buildExceptionCreatePayload(
  data: ScheduleExceptionSavePayload
): CreateScheduleExceptionRequest {
  return {
    veterinarianId: data.veterinarianId,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    reason: data.reason,
  };
}

export function findVetDisplayName(
  vets: Veterinarian[],
  vetId: string,
  specsMap: Record<string, string> | Specialization[]
): string | undefined {
  const target = vets.find((v) => v.id === vetId);
  if (!target) return undefined;
  const map = Array.isArray(specsMap)
    ? Object.fromEntries(specsMap.map((s) => [s.id, s.name]))
    : specsMap;
  return getDoctorDisplay(target, map).fullName;
}

export function buildDeleteConfirmMeta(target: DeleteScheduleTarget): {
  title: string;
  description: string;
} {
  if (!target) return { title: '', description: '' };
  if (target.type === 'schedule') {
    return {
      title: `Удалить рабочий график на ${target.dowName}?`,
      description: `Рабочий график на ${target.dowName} будет удалён, день станет выходным.`,
    };
  }
  const ex = target.exception;
  const typeLabel = ex.type === 'ABSENCE' ? 'Отсутствие' : 'Особые часы';
  const range =
    ex.startDate === ex.endDate
      ? formatIsoDateDisplay(ex.startDate)
      : `${formatIsoDateDisplay(ex.startDate)} – ${formatIsoDateDisplay(ex.endDate)}`;
  return {
    title: 'Удалить исключение из расписания?',
    description: `Исключение (${typeLabel}, ${range}) будет удалено.`,
  };
}
