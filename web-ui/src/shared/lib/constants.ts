import type React from 'react';
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

export const VET_STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'var(--st-pending-fg)',
  CONFIRMED: 'var(--st-confirmed-fg)',
  COMPLETED: 'var(--st-completed-fg)',
  CANCELLED: 'var(--st-cancelled-fg)',
  NO_SHOW: 'var(--st-noshow-fg)',
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

export const DEFAULT_SPEC_COLORS: Record<string, string> = {
  ther: '#3b82f6', // Синий (Терапия)
  surg: '#ef4444', // Терракотово-красный (Хирургия)
  dent: '#a855f7', // Фиолетовый (Стоматология)
  derm: '#10b981', // Изумрудный (Дерматология)
  opht: '#06b6d4', // Голубой (Офтальмология)
  prev: '#f59e0b', // Янтарный (Профилактика)
};

/**
 * Палитра цветов, откалиброванных для надёжной контрастности и читаемости
 * в обеих темах оформления (тёмной и светлой).
 * Перцептивная яркость (HSP/YIQ) находится в безопасном диапазоне 45–220,
 * что исключает «слепые» цвета (слишком тёмные для Dark mode или слишком бледные для Light mode).
 */
export const THEME_SAFE_PALETTE: Array<{ hex: string; name: string }> = [
  { hex: '#3B82F6', name: 'Синий (Терапия)' },
  { hex: '#0284C7', name: 'Океан' },
  { hex: '#06B6D4', name: 'Циан (Офтальмология)' },
  { hex: '#0D9488', name: 'Морская волна' },
  { hex: '#10B981', name: 'Изумруд (Дерматология)' },
  { hex: '#16A34A', name: 'Зелёный' },
  { hex: '#84CC16', name: 'Лайм' },
  { hex: '#D97706', name: 'Янтарный (Профилактика)' },
  { hex: '#F97316', name: 'Оранжевый' },
  { hex: '#EF4444', name: 'Коралл (Хирургия)' },
  { hex: '#E11D48', name: 'Малиновый' },
  { hex: '#EC4899', name: 'Розовый' },
  { hex: '#A855F7', name: 'Пурпурный (Стоматология)' },
  { hex: '#8B5CF6', name: 'Фиолетовый' },
  { hex: '#6366F1', name: 'Индиго' },
  { hex: '#64748B', name: 'Стальной' },
];

/**
 * Валидация и перцептивная оценка HEX-цвета для светлой и тёмной темы.
 */
export function validateThemeSafeColor(hex?: string | null): {
  valid: boolean;
  brightness?: number;
  warning?: string;
} {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return { valid: false, warning: 'Введите корректный HEX-код вида #RRGGBB' };
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = Math.round((r * 299 + g * 587 + b * 114) / 1000);

  if (brightness < 45) {
    return {
      valid: false,
      brightness,
      warning: 'Цвет слишком тёмный — сольётся с фоном в тёмной теме',
    };
  }
  if (brightness > 220) {
    return {
      valid: false,
      brightness,
      warning: 'Цвет слишком светлый — сольётся с фоном в светлой теме',
    };
  }
  return { valid: true, brightness };
}

const speciesColorRegistry = new Map<string, string>();
const specColorRegistry = new Map<string, string>();

export function clearSpeciesColorRegistry(): void {
  speciesColorRegistry.clear();
}

export function clearSpecializationColorRegistry(): void {
  specColorRegistry.clear();
}

export function registerSpecializationColors(
  specs?: ReadonlyArray<{ id: string; color?: string | null }> | Map<string, { color?: string | null }> | Record<string, any> | null
) {
  if (!specs) return;
  if (Array.isArray(specs)) {
    for (const s of specs) {
      if (s?.id && s.color) specColorRegistry.set(s.id, s.color);
    }
  } else if (specs instanceof Map) {
    for (const [id, s] of specs.entries()) {
      if (s?.color) specColorRegistry.set(id, s.color);
    }
  } else if (typeof specs === 'object') {
    for (const [id, s] of Object.entries(specs)) {
      if (typeof s === 'string' && s.startsWith('#')) specColorRegistry.set(id, s);
      else if (s && typeof s === 'object' && s.color) specColorRegistry.set(id, s.color);
    }
  }
}

export function getSpecColor(
  specId?: string | null,
  specsSource?: ReadonlyArray<{ id: string; color?: string | null }> | Map<string, { color?: string | null }> | Record<string, any>
): string | undefined {
  if (!specId) return undefined;
  if (specsSource) {
    if (Array.isArray(specsSource)) {
      const found = specsSource.find((s) => s.id === specId);
      if (found?.color) {
        specColorRegistry.set(specId, found.color);
        return found.color;
      }
    } else if (specsSource instanceof Map) {
      const found = specsSource.get(specId);
      if (found?.color) {
        specColorRegistry.set(specId, found.color);
        return found.color;
      }
    } else if (typeof specsSource === 'object') {
      const item = (specsSource as Record<string, any>)[specId];
      if (typeof item === 'string' && item.startsWith('#')) {
        specColorRegistry.set(specId, item);
        return item;
      }
      if (item && typeof item === 'object' && item.color) {
        specColorRegistry.set(specId, item.color);
        return item.color;
      }
    }
  }
  const fromRegistry = specColorRegistry.get(specId);
  if (fromRegistry) return fromRegistry;

  const tone = SPEC_TONES[specId];
  if (tone && DEFAULT_SPEC_COLORS[tone]) {
    return DEFAULT_SPEC_COLORS[tone];
  }
  return undefined;
}

export function getSpecStyle(
  specId?: string | null,
  specsSource?: any
): React.CSSProperties | undefined {
  const color = getSpecColor(specId, specsSource);
  return color ? ({ '--tone': color } as React.CSSProperties) : undefined;
}

export function getSpecTone(specId?: string | null): string {
  return (specId && SPEC_TONES[specId]) || 'ther';
}

export type SpeciesTone = 'dog' | 'cat' | 'rab' | 'par' | 'pig' | 'fer';

export const DEFAULT_SPECIES_COLORS: Record<SpeciesTone, string> = {
  cat: '#edb345', // Amber / Chart-3 (Кошка)
  dog: '#5aa3ec', // Blue / Chart-2 (Собака)
  rab: '#ac89e8', // Purple / Chart-4 (Кролик)
  par: '#8ed643', // Green / Chart-1 (Попугай)
  pig: '#f17070', // Red / Chart-5 (Морская свинка)
  fer: '#47c7c7', // Teal / Chart-6 (Хорёк)
};

export function registerSpeciesColors(
  species?: ReadonlyArray<{ id: string; name?: string; color?: string | null }> | Map<string, { name?: string; color?: string | null }> | Record<string, any> | null
) {
  if (!species) return;
  if (Array.isArray(species)) {
    for (const s of species) {
      if (s?.id && s.color) {
        speciesColorRegistry.set(s.id, s.color);
        if (s.name) speciesColorRegistry.set(s.name.toLowerCase().trim(), s.color);
      }
    }
  } else if (species instanceof Map) {
    for (const [id, s] of species.entries()) {
      if (s?.color) {
        speciesColorRegistry.set(id, s.color);
        if (s.name) speciesColorRegistry.set(s.name.toLowerCase().trim(), s.color);
      }
    }
  } else if (typeof species === 'object') {
    for (const [id, s] of Object.entries(species)) {
      if (typeof s === 'string' && s.startsWith('#')) {
        speciesColorRegistry.set(id, s);
      } else if (s && typeof s === 'object' && s.color) {
        speciesColorRegistry.set(id, s.color);
        if (s.name) speciesColorRegistry.set(s.name.toLowerCase().trim(), s.color);
      }
    }
  }
}

export function getSpeciesColor(
  speciesIdOrName?: string | null,
  speciesSource?: ReadonlyArray<{ id: string; name?: string; color?: string | null }> | Map<string, { color?: string | null }> | Record<string, any>
): string | undefined {
  if (!speciesIdOrName) return undefined;
  const lookupKey = speciesIdOrName.trim().toLowerCase();

  if (speciesSource) {
    if (Array.isArray(speciesSource)) {
      const found = speciesSource.find(
        (s) => s.id === speciesIdOrName || (s.name && s.name.toLowerCase().trim() === lookupKey)
      );
      if (found?.color) {
        speciesColorRegistry.set(speciesIdOrName, found.color);
        if (found.name) speciesColorRegistry.set(found.name.toLowerCase().trim(), found.color);
        return found.color;
      }
    } else if (speciesSource instanceof Map) {
      const found = speciesSource.get(speciesIdOrName);
      if (found?.color) {
        speciesColorRegistry.set(speciesIdOrName, found.color);
        return found.color;
      }
    } else if (typeof speciesSource === 'object') {
      const item = (speciesSource as Record<string, any>)[speciesIdOrName] || (speciesSource as Record<string, any>)[lookupKey];
      if (typeof item === 'string' && item.startsWith('#')) {
        speciesColorRegistry.set(speciesIdOrName, item);
        return item;
      }
      if (item && typeof item === 'object' && item.color) {
        speciesColorRegistry.set(speciesIdOrName, item.color);
        return item.color;
      }
    }
  }

  const fromRegistry = speciesColorRegistry.get(speciesIdOrName) || speciesColorRegistry.get(lookupKey);
  if (fromRegistry) return fromRegistry;

  return undefined;
}

export function getSpeciesStyle(
  speciesIdOrName?: string | null,
  speciesSource?: any
): React.CSSProperties | undefined {
  const color = getSpeciesColor(speciesIdOrName, speciesSource);
  return color ? ({ '--tone': color } as React.CSSProperties) : undefined;
}

export function getHomeByRole(role?: UserRole | null): string {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'VETERINARIAN') return '/vet/dashboard';
  return '/client/dashboard';
}
