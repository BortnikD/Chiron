import type { AvailableSlotResponse } from '@/modules/clinic/types';
import { formatIsoDateDisplay, getMoscowDateKey } from '@/shared/lib';

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

  return Object.entries(groups).map(([dateIso, daySlots]) => {
    const d = new Date(`${dateIso}T12:00:00+03:00`);
    const rawDow = d.toLocaleDateString('ru-RU', {
      weekday: 'short',
      timeZone: 'Europe/Moscow',
    });
    return {
      dateIso,
      dow: rawDow.charAt(0).toUpperCase() + rawDow.slice(1),
      dateLabel: formatIsoDateDisplay(dateIso),
      slots: daySlots,
    };
  });
}
