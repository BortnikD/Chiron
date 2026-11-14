import type { AvailableSlotResponse } from '@/modules/clinic/types';
import { formatIsoDateDisplay, formatWeekdayShortRu, getMoscowDateKey } from '@/shared/lib';

export interface FollowUpDayGroup {
  dateIso: string;
  dow: string;
  dateLabel: string;
  slots: AvailableSlotResponse[];
}

export function groupFollowUpSlotsByDay(slots: AvailableSlotResponse[]): FollowUpDayGroup[] {
  const groups: Record<string, AvailableSlotResponse[]> = {};
  slots.forEach((sl) => {
    const key = getMoscowDateKey(sl.startAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(sl);
  });

  return Object.entries(groups).map(([dateIso, daySlots]) => ({
    dateIso,
    dow: formatWeekdayShortRu(dateIso),
    dateLabel: formatIsoDateDisplay(dateIso),
    slots: daySlots,
  }));
}
