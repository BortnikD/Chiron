import type { AppointmentStatus, DayOfWeek, UserRole } from '@/shared/types';

export const APPOINTMENT_STATUS_META: Record<
  AppointmentStatus,
  { label: string; short: string; cls: string }
> = {
  PENDING: { label: 'Ожидает подтверждения', short: 'Ожидает', cls: 'badge-PENDING' },
  CONFIRMED: { label: 'Подтверждена', short: 'Подтверждена', cls: 'badge-CONFIRMED' },
  COMPLETED: { label: 'Завершена', short: 'Завершена', cls: 'badge-COMPLETED' },
  CANCELLED: { label: 'Отменена', short: 'Отменена', cls: 'badge-CANCELLED' },
  NO_SHOW: { label: 'Неявка', short: 'Неявка', cls: 'badge-NO_SHOW' },
};

export const APPOINTMENT_STATUS_LIST: AppointmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

export const ALLOWED_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED'],
  NO_SHOW: ['NO_SHOW'],
};

export function canTransitionAppointmentStatus(
  from: AppointmentStatus,
  to: AppointmentStatus
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const USER_ROLE_META: Record<UserRole, { label: string; cls: string }> = {
  CLIENT: { label: 'Клиент', cls: 'badge-outline' },
  VETERINARIAN: { label: 'Ветеринар', cls: 'badge-accent' },
  ADMIN: { label: 'Администратор', cls: 'badge-CONFIRMED' },
};

export const DOW_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

export const DOW_FULL = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
] as const;

export const DOW_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const DOW_TO_INDEX: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

export const DOW_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Пн',
  TUESDAY: 'Вт',
  WEDNESDAY: 'Ср',
  THURSDAY: 'Чт',
  FRIDAY: 'Пт',
  SATURDAY: 'Сб',
  SUNDAY: 'Вс',
};

export const SPEC_TONES: Record<string, string> = {
  '5eed0002-0000-0000-0000-000000000001': 'ther',
  '5eed0002-0000-0000-0000-000000000002': 'surg',
  '5eed0002-0000-0000-0000-000000000003': 'dent',
  '5eed0002-0000-0000-0000-000000000004': 'derm',
  '5eed0002-0000-0000-0000-000000000005': 'opht',
  '5eed0002-0000-0000-0000-000000000006': 'prev',
};

export function getSpecTone(specId?: string | null): string {
  return (specId && SPEC_TONES[specId]) || 'ther';
}

export function getHomeByRole(role?: UserRole | null): string {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'VETERINARIAN') return '/vet/dashboard';
  return '/client/dashboard';
}
