import { DayOfWeek } from '../../../../types';

/**
 * Сокращенные названия дней недели (Пн - Вс)
 */
export const DOWS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/**
 * Полные названия дней недели (Понедельник - Воскресенье)
 */
export const DOWS_FULL = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

/**
 * Соответствие перечисления DayOfWeek индексу дня (0 - Пн, 6 - Вс)
 */
export const DOW_TO_INDEX: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

/**
 * Соответствие индекса дня недели перечислению DayOfWeek
 */
export const INDEX_TO_DOW: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

/**
 * Границы временной шкалы: от 08:00 до 20:00
 */
export const H0 = 8;
export const H1 = 20;

/**
 * Перевод строки времени "HH:MM" в минуты от начала суток
 */
export function tm(t: string): number {
  if (!t) return 0;
  const parts = t.split(':');
  return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
}

/**
 * Расчет позиции точки времени в процентах от шкалы H0-H1
 */
export function pctX(t: string): string {
  const m = tm(t);
  const p = ((m - H0 * 60) / ((H1 - H0) * 60)) * 100;
  return `${Math.max(0, Math.min(100, p))}%`;
}

/**
 * Расчет ширины интервала времени в процентах от шкалы H0-H1
 */
export function pctW(a: string, b: string): string {
  const p = ((tm(b) - tm(a)) / ((H1 - H0) * 60)) * 100;
  return `${Math.max(0, Math.min(100, p))}%`;
}

/**
 * Форматирование количества минут в читаемый вид (напр. "8 ч 30 мин")
 */
export function fmtH(m: number): string {
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h} ч${rem ? ` ${rem} мин` : ''}`;
}

/**
 * Форматирование даты ISO (YYYY-MM-DD) в формат DD.MM.YYYY
 */
export function formatIsoDisplay(iso?: string | null): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}
