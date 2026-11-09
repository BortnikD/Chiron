import { AvailableSlotResponse, Veterinarian } from '../../../../types';
import { getDoctorDisplay } from '../../../../utils/doctorHelpers';
import { DAY_NAMES_RU, GroupedDaySlots } from './constants';

/**
 * Группировка списка доступных слотов по календарным датам.
 */
export function groupSlotsByDay(slots: AvailableSlotResponse[], todayStr: string): GroupedDaySlots[] {
  const groups: Record<string, AvailableSlotResponse[]> = {};

  slots.forEach((slot) => {
    const key = new Date(slot.startAt).toLocaleDateString('ru-RU', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(slot);
  });

  return Object.entries(groups).map(([dateLabel, daySlots]) => {
    const firstSlot = new Date(daySlots[0].startAt);
    const isToday = firstSlot.toISOString().split('T')[0] === todayStr;
    return {
      dateLabel,
      dow: DAY_NAMES_RU[firstSlot.getDay()],
      note: isToday ? 'сегодня' : `${daySlots.length} окон`,
      slots: daySlots,
    };
  });
}

/**
 * Определение отображаемого имени врача для сводки и подтверждения.
 */
export function resolveDoctorDisplayName(
  isAnyVet: boolean,
  selectedVet: Veterinarian | null,
  selectedSlot: AvailableSlotResponse | null,
  veterinarians: Veterinarian[],
  specsMap: Record<string, string>
): string {
  if (!isAnyVet && selectedVet) {
    return getDoctorDisplay(selectedVet, specsMap).name;
  }
  if (selectedSlot && selectedSlot.veterinarianIds.length > 0) {
    const match = veterinarians.find((v) => v.id === selectedSlot.veterinarianIds[0]);
    return match?.userId ? getDoctorDisplay(match, specsMap).name : 'Дежурный врач';
  }
  return 'Любой врач';
}

/**
 * Человекочитаемая локализация ошибок бэкенда при оформлении записи.
 */
export function parseBookingError(err: any): string {
  const msg = err?.message || err?.error?.message || '';
  if (msg.includes('SUNDAY') || msg.includes('does not work')) {
    return 'Врач не ведёт приём в этот день недели.';
  }
  if (msg.includes('overlaps')) {
    return 'Выбранное время уже занято другим клиентом. Выберите другое окно.';
  }
  if (msg.includes('outside working hours')) {
    return 'Выбранное время выходит за рамки рабочего графика врача.';
  }
  if (msg.includes('absent')) {
    return 'Врач отсутствует в этот день (отпуск или больничный).';
  }
  return msg || 'Не удалось оформить запись. Попробуйте выбрать другое время.';
}
