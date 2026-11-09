import { DayOfWeek, Specialization, User } from '../../../../types';

export const DOW_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Пн',
  TUESDAY: 'Вт',
  WEDNESDAY: 'Ср',
  THURSDAY: 'Чт',
  FRIDAY: 'Пт',
  SATURDAY: 'Сб',
  SUNDAY: 'Вс',
};

export const DOW_ORDER: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const SPEC_TONES: Record<string, string> = {
  '5eed0002-0000-0000-0000-000000000001': 'ther',
  '5eed0002-0000-0000-0000-000000000002': 'surg',
  '5eed0002-0000-0000-0000-000000000003': 'dent',
  '5eed0002-0000-0000-0000-000000000004': 'derm',
  '5eed0002-0000-0000-0000-000000000005': 'opht',
  '5eed0002-0000-0000-0000-000000000006': 'prev',
};

export const getSpecTone = (id?: string) => (id && SPEC_TONES[id]) || 'ther';

export const getUserName = (userId: string, users: User[] = []) => {
  const user = users.find((u) => u.id === userId);
  return user ? user.fullName : `Врач (${userId.slice(0, 8)})`;
};

export const getUserInitials = (userId: string, users: User[] = []) => {
  const user = users.find((u) => u.id === userId);
  if (!user) return 'ВР';
  const parts = (user.fullName || '').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] ? parts[0].slice(0, 2) : 'ВР').toUpperCase();
};

export const getUserEmail = (userId: string, users: User[] = []) => {
  const user = users.find((u) => u.id === userId);
  return user?.email || '—';
};

export const getSpecName = (specId?: string, specializations: Specialization[] = []) => {
  if (!specId) return 'Не указана';
  const s = specializations.find((sp) => sp.id === specId);
  return s ? s.name : 'Специализация';
};
