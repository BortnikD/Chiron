import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import {
  formatIsoDateDisplay,
  getMoscowDateKey,
  getMoscowTodayIso,
  pluralRu,
  timeToMinutes,
} from '@/shared/lib';

/**
 * Перевод локальной московской даты YYYY-MM-DD в UTC ISO-границу начала суток (00:00:00+03:00).
 */
export function moscowStartInstant(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00+03:00`).toISOString();
}

/**
 * Перевод локальной московской даты YYYY-MM-DD в исключающую верхнюю границу (начало следующих суток).
 */
export function moscowNextDayInstant(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0)).toISOString().slice(0, 10);
  return new Date(`${next}T00:00:00+03:00`).toISOString();
}

/**
 * Смещение даты YYYY-MM-DD на offsetDays календарных дней.
 */
export function shiftIsoDate(baseIso: string, offsetDays: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  if (!y || !m || !d) return getMoscowTodayIso(offsetDays);
  return new Date(Date.UTC(y, m - 1, d + offsetDays, 12, 0, 0)).toISOString().slice(0, 10);
}

/**
 * Текущее время в часовом поясе Europe/Moscow в формате HH:mm и минутах от полуночи.
 */
export function getMoscowNowTime(): { hhmm: string; minutes: number; dateIso: string } {
  const now = new Date();
  const dateIso = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' });
  const hhmm = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow',
  });
  return { hhmm, minutes: timeToMinutes(hhmm), dateIso };
}

/**
 * Дневной заголовок в формате "Понедельник, 26.10.2026".
 */
export function formatWeekdayDateRu(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00+03:00`);
  const weekday = d.toLocaleDateString('ru-RU', {
    weekday: 'long',
    timeZone: 'Europe/Moscow',
  });
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capWeekday}, ${formatIsoDateDisplay(dateIso)}`;
}

/**
 * Проверка, прошла ли запись относительно текущего московского времени.
 */
export function isAppointmentPast(appt: Appointment, nowMs = Date.now()): boolean {
  return new Date(appt.startAt).getTime() < nowMs;
}

/**
 * Эффективная длительность и цена услуги с учётом вида животного.
 */
export function getEffectiveServiceDuration(service?: Service | null): number {
  if (!service) return 30;
  return service.effectiveDurationMin ?? service.durationMin ?? service.baseDurationMin ?? 30;
}

export function getEffectiveServiceBuffer(service?: Service | null): number {
  if (!service) return 0;
  return service.bufferAfterMin ?? 0;
}

export function getEffectiveServicePrice(service?: Service | null): number {
  if (!service) return 0;
  return service.effectivePrice ?? service.price ?? service.basePrice ?? 0;
}

/**
 * Информация о сроке ревакцинации для таблицы, деталей и фильтров прививок.
 */
export type VetVaccinationDueStatus = 'OVERDUE' | 'SOON' | 'LATER' | 'NONE';

export interface VetVaccinationDueInfo {
  label: string;
  text: string;
  cls: 'due-over' | 'due-soon' | 'badge-accent' | 'due-none';
  status: VetVaccinationDueStatus;
}

export function getVetVaccinationDueInfo(nextDueOn?: string | null): VetVaccinationDueInfo {
  if (!nextDueOn) {
    return { label: '—', text: 'не задана', cls: 'due-none', status: 'NONE' };
  }

  const todayIso = getMoscowTodayIso();
  const dueIso = getMoscowDateKey(nextDueOn) || nextDueOn.slice(0, 10);
  const todayMs = Date.parse(`${todayIso}T00:00:00Z`);
  const dueMs = Date.parse(`${dueIso}T00:00:00Z`);

  if (Number.isNaN(dueMs)) {
    return { label: '—', text: 'не задана', cls: 'due-none', status: 'NONE' };
  }

  const diffDays = Math.round((dueMs - todayMs) / 86400000);
  const label = formatIsoDateDisplay(dueIso);

  if (diffDays < 0) {
    return { label, text: 'просрочена', cls: 'due-over', status: 'OVERDUE' };
  }

  if (diffDays <= 30) {
    const text =
      diffDays === 0
        ? 'сегодня'
        : `через ${diffDays} ${pluralRu(diffDays, 'день', 'дня', 'дней')}`;
    return { label, text, cls: 'due-soon', status: 'SOON' };
  }

  const months = Math.max(1, Math.round(diffDays / 30));
  return {
    label,
    text: `через ${months} ${pluralRu(months, 'мес.', 'мес.', 'мес.')}`,
    cls: 'badge-accent',
    status: 'LATER',
  };
}

/**
 * Человекочитаемое имя автора отмены записи.
 */
export function formatCancelledByLabel(
  appt: Appointment,
  vet?: Veterinarian | null,
  pet?: Pet | null,
  currentUserId?: string | null
): string {
  const actorId = appt.cancelledBy;
  if (!actorId) return '—';
  if ((vet?.userId && actorId === vet.userId) || (currentUserId && actorId === currentUserId)) {
    return 'Врач (вы)';
  }
  if (pet?.ownerId && actorId === pet.ownerId) {
    return 'Владелец';
  }
  return `Сотрудник клиники`;
}
