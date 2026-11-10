import type { ScheduleException } from '@/modules/admin/types';
import type { DayOfWeek, ScheduleExceptionType } from '@/shared/types';

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
