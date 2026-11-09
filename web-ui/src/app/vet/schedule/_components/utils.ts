import { DayOfWeek } from '../../../../types';

export const DOWS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const DOWS_FULL = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

export const INDEX_TO_DOW: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const H0 = 8;
export const H1 = 19;
export const PPM = 1.4; // Пикселей на минуту
export const CAL_HOUR_PX = `${60 * PPM}px`;
export const CAL_HEIGHT = `${(H1 - H0) * 60 * PPM}px`;

export function tm(t: string): number {
  if (!t) return 0;
  const parts = t.split(':');
  return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
}

export function px(n: number): string {
  return `${Math.round(n)}px`;
}

export function formatIsoDisplay(iso?: string | null): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export const STATUS_SHORT: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};
