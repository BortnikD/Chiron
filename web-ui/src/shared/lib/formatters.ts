export const MOSCOW_TIMEZONE = 'Europe/Moscow';

/**
 * Возвращает текущую (или смещённую на offsetDays дней) дату YYYY-MM-DD по московскому времени.
 */
export function getMoscowTodayIso(offsetDays = 0): string {
  const baseIso = new Date().toLocaleDateString('en-CA', { timeZone: MOSCOW_TIMEZONE });
  if (offsetDays === 0) return baseIso;
  const [y, m, d] = baseIso.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + offsetDays, 12, 0, 0));
  return shifted.toISOString().slice(0, 10);
}

/**
 * Извлекает календарную дату YYYY-MM-DD в часовом поясе Europe/Moscow из ISO-строки или Date.
 */
export function getMoscowDateKey(input?: string | Date | null): string {
  if (!input) return '';
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { timeZone: MOSCOW_TIMEZONE });
}

/**
 * Возвращает инициалы пользователя (2 символа в верхнем регистре).
 */
export function getUserInitials(
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
  } | null,
  fallback = 'CH'
): string {
  if (!user) return fallback;
  const first = user.firstName?.trim().charAt(0) || '';
  const last = user.lastName?.trim().charAt(0) || '';
  if (first || last) return `${first}${last}`.toUpperCase();
  const parts = (user.fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return fallback;
}

export function formatCurrency(amount?: number | null): string {
  if (amount == null || Number.isNaN(amount)) return '0 ₽';
  return `${Math.round(amount).toLocaleString('ru-RU')} ₽`;
}

export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

export function formatSlotTime(isoStr?: string | null): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr;
    return d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });
  } catch {
    return isoStr;
  }
}

export function formatDateRu(
  isoStr?: string | null,
  includeYearOrOptions: boolean | Intl.DateTimeFormatOptions = true
): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr;
    const options: Intl.DateTimeFormatOptions =
      typeof includeYearOrOptions === 'boolean'
        ? {
            day: 'numeric',
            month: 'long',
            year: includeYearOrOptions ? 'numeric' : undefined,
            timeZone: 'Europe/Moscow',
          }
        : { timeZone: 'Europe/Moscow', ...includeYearOrOptions };
    return d.toLocaleDateString('ru-RU', options);
  } catch {
    return isoStr;
  }
}

export function formatDateShort(isoStr?: string | null): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Moscow',
    });
  } catch {
    return isoStr;
  }
}

export function formatIsoDateDisplay(iso?: string | null): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export function formatDateTimeCompact(iso: string): { date: string; time: string; rawDate: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    timeZone: 'Europe/Moscow',
  });
  const time = formatSlotTime(iso);
  return { date, time, rawDate: d.toLocaleDateString('en-CA', { timeZone: 'Europe/Moscow' }) };
}

export function timeToMinutes(t: string): number {
  if (!t) return 0;
  const parts = t.split(':');
  return Number(parts[0] || 0) * 60 + Number(parts[1] || 0);
}

export function formatDurationMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h} ч${rem ? ` ${rem} мин` : ''}`;
}

export function pluralRu(count: number, one: string, two: string, five: string): string {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return five;
  if (n1 > 1 && n1 < 5) return two;
  if (n1 === 1) return one;
  return five;
}

export function calculateAgeRu(birthDate?: string | null, emptyLabel = '—'): string {
  if (!birthDate) return emptyLabel;
  try {
    const birthIso = /^\d{4}-\d{2}-\d{2}/.test(birthDate)
      ? birthDate.slice(0, 10)
      : getMoscowDateKey(birthDate);
    const bParts = birthIso.split('-').map(Number);
    if (bParts.length !== 3 || bParts.some(Number.isNaN)) return emptyLabel;

    const [by, bm, bd] = bParts;
    const [ny, nm, nd] = getMoscowTodayIso().split('-').map(Number);

    let years = ny - by;
    let months = nm - bm;

    if (nd < bd) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) return emptyLabel;
    if (years === 0 && months <= 0) return 'Меньше месяца';
    if (years === 0) return `${months} ${pluralRu(months, 'месяц', 'месяца', 'месяцев')}`;
    if (months === 0) return `${years} ${pluralRu(years, 'год', 'года', 'лет')}`;
    return `${years} ${pluralRu(years, 'г.', 'г.', 'л.')} ${months} мес.`;
  } catch {
    return emptyLabel;
  }
}

export function toIdNameMap<T extends { id: string; name: string }>(
  items: readonly T[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of items) {
    map[item.id] = item.name;
  }
  return map;
}

export function getSpeciesTone(
  speciesIdOrName?: string | null,
  speciesMap?: Record<string, string> | ReadonlyArray<{ id: string; name: string }>
): 'dog' | 'rab' | 'par' | 'cat' {
  let resolved = speciesIdOrName || '';
  if (speciesIdOrName && speciesMap) {
    if (Array.isArray(speciesMap)) {
      const match = (speciesMap as ReadonlyArray<{ id: string; name: string }>).find(
        (s) => s.id === speciesIdOrName
      );
      resolved = match?.name || resolved;
    } else {
      const recordMap = speciesMap as Record<string, string>;
      if (recordMap[speciesIdOrName]) {
        resolved = recordMap[speciesIdOrName];
      }
    }
  }
  const norm = resolved.toLowerCase();
  if (norm.includes('соб') || norm.includes('dog') || norm.includes('000000000002')) return 'dog';
  if (norm.includes('крол') || norm.includes('rab') || norm.includes('000000000003')) return 'rab';
  if (norm.includes('попуг') || norm.includes('птиц') || norm.includes('bird') || norm.includes('par') || norm.includes('000000000004')) return 'par';
  return 'cat';
}

const ERROR_FIELD_LABELS: Record<string, string> = {
  currentPassword: 'Текущий пароль',
  newPassword: 'Новый пароль',
  password: 'Пароль',
  email: 'Email',
  phone: 'Телефон',
  firstName: 'Имя',
  lastName: 'Фамилия',
  middleName: 'Отчество',
  name: 'Название',
  description: 'Описание',
  basePrice: 'Базовая цена',
  baseDurationMin: 'Базовая длительность',
  bufferAfterMin: 'Буфер',
  experienceYears: 'Стаж',
  bio: 'Описание',
  photoUrl: 'Фото (URL)',
  administeredOn: 'Дата введения',
  nextDueOn: 'Следующая дата',
  birthDate: 'Дата рождения',
  weightKg: 'Вес',
  startDate: 'Дата начала',
  endDate: 'Дата окончания',
  startTime: 'Время начала',
  endTime: 'Время окончания',
  startAt: 'Время начала',
  endAt: 'Время окончания',
  veterinarianId: 'Врач',
  petId: 'Питомец',
  serviceId: 'Услуга',
  speciesId: 'Вид животного',
  reason: 'Причина',
};

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function formatApiError(err: unknown, fallback = 'Произошла ошибка'): string {
  if (!err || typeof err !== 'object') {
    return typeof err === 'string' && err.trim() ? err : fallback;
  }

  const candidate = err as {
    status?: number;
    message?: string;
    violations?: Array<{ field?: string; message?: string }>;
    rawError?: { name?: string; exception?: string; message?: string } | null;
  };

  if (Array.isArray(candidate.violations) && candidate.violations.length > 0) {
    const parts = candidate.violations
      .map((v) => {
        const msg = (v.message || '').trim();
        if (!msg) return '';
        const fieldLabel = v.field ? ERROR_FIELD_LABELS[v.field] : undefined;
        return fieldLabel ? `${fieldLabel}: ${msg}` : msg;
      })
      .filter(Boolean);
    if (parts.length > 0) {
      return parts.join('; ');
    }
  }

  const rawName = candidate.rawError?.name || candidate.rawError?.exception || '';
  const msg = (candidate.message || candidate.rawError?.message || '').trim();
  const lowerMsg = msg.toLowerCase();

  if (
    candidate.status === 401 &&
    (rawName.includes('InvalidCredentials') ||
      lowerMsg.includes('invalid credentials') ||
      lowerMsg.includes('invalid password'))
  ) {
    return 'Неверный текущий пароль или учётные данные';
  }

  if (rawName.includes('InvalidAppointmentStatusTransition') || lowerMsg.includes('transition')) {
    return 'Недопустимый переход статуса записи по правилам клиники';
  }

  if (rawName.includes('FollowUpNotAllowed') || lowerMsg.includes('follow-up')) {
    return 'Повторный приём можно назначить только для подтверждённого или завершённого визита и позже его окончания';
  }

  if (rawName.includes('VeterinarianNotPermittedForSpecies')) {
    return 'У выбранного врача нет допуска для этого вида животного';
  }

  if (rawName.includes('ServiceNotAvailableForSpecies')) {
    return 'Выбранная услуга недоступна для этого вида животного';
  }

  if (rawName.includes('AppointmentSlotUnavailable')) {
    return 'Выбранный слот недоступен в расписании врача или пересекается с другой записью';
  }

  if (rawName.includes('PetArchived')) {
    return 'Операция недоступна для архивного питомца';
  }

  if (rawName.includes('AppointmentPetMismatch')) {
    return 'Указанная запись относится к другому питомцу';
  }

  if (rawName.includes('ServiceInactive')) {
    return 'Выбранная услуга в данный момент отключена';
  }

  if (rawName.includes('VeterinarianInactive')) {
    return 'Профиль выбранного ветеринара деактивирован';
  }

  if (rawName.includes('UserRoleMismatch')) {
    return 'Роль пользователя не соответствует требуемой для этого действия';
  }

  if (
    candidate.status === 403 &&
    (!msg || lowerMsg === 'access denied' || lowerMsg === 'forbidden')
  ) {
    return 'Недостаточно прав для выполнения операции';
  }

  return msg || fallback;
}
