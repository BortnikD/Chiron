/**
 * Вспомогательные функции для отображения информации о ветеринарных врачах в интерфейсе Chiron.
 * Предоставляют имена, специализации и инициалы для сидовых врачей клиники,
 * чьи профили пользователей могут не объединяться в базовых ответах API.
 */

export interface DoctorDisplayInfo {
  name: string;
  initials: string;
  specName: string;
  title: string;
}

export const KNOWN_DOCTORS: Record<
  string,
  { fullName: string; initials: string; title: string; specName: string }
> = {
  '5eed0006-0000-0000-0000-000000000001': {
    fullName: 'Анна Сергеевна Иванова',
    initials: 'АИ',
    title: 'Ведущий терапевт',
    specName: 'Терапия',
  },
  '5eed0006-0000-0000-0000-000000000002': {
    fullName: 'Павел Петров',
    initials: 'ПП',
    title: 'Ветеринарный врач-терапевт',
    specName: 'Терапия',
  },
  '5eed0006-0000-0000-0000-000000000003': {
    fullName: 'Елена Викторовна Смирнова',
    initials: 'ЕС',
    title: 'Ведущий хирург',
    specName: 'Хирургия',
  },
  '5eed0006-0000-0000-0000-000000000004': {
    fullName: 'Олег Кузнецов',
    initials: 'ОК',
    title: 'Ветеринарный стоматолог',
    specName: 'Стоматология',
  },
};

export const SPECIALIZATION_NAMES_RU: Record<string, string> = {
  Therapy: 'Терапия',
  Surgery: 'Хирургия',
  Dentistry: 'Стоматология',
  '5eed0002-0000-0000-0000-000000000001': 'Терапия',
  '5eed0002-0000-0000-0000-000000000002': 'Хирургия',
  '5eed0002-0000-0000-0000-000000000003': 'Стоматология',
};

export function getDoctorDisplay(
  vet?: {
    id?: string;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      middleName?: string | null;
      fullName?: string | null;
    } | null;
    specialization?: { name?: string | null } | null;
    specializationId?: string | null;
  } | null,
  specializationsMap?: Record<string, string>
): DoctorDisplayInfo {
  if (!vet) {
    return {
      name: 'Ветеринарный врач',
      initials: 'ВР',
      specName: 'Терапия',
      title: 'Ветеринарный врач',
    };
  }

  const known = vet.id ? KNOWN_DOCTORS[vet.id] : undefined;

  let name =
    vet.user?.fullName ||
    [vet.user?.firstName, vet.user?.lastName].filter(Boolean).join(' ').trim();

  if (!name && known) {
    name = known.fullName;
  }
  if (!name) {
    name = 'Ветеринарный врач';
  }

  let initials = '';
  if (vet.user?.firstName && vet.user?.lastName) {
    initials = `${vet.user.firstName.charAt(0)}${vet.user.lastName.charAt(0)}`.toUpperCase();
  } else if (known) {
    initials = known.initials;
  } else {
    initials = 'ВР';
  }

  let rawSpec =
    vet.specialization?.name ||
    (vet.specializationId && specializationsMap?.[vet.specializationId]) ||
    (vet.specializationId && SPECIALIZATION_NAMES_RU[vet.specializationId]) ||
    known?.specName ||
    'Терапия';

  const specName = SPECIALIZATION_NAMES_RU[rawSpec] || rawSpec;
  const title = known?.title || `Врач-${specName.toLowerCase()}`;

  return {
    name,
    initials,
    specName,
    title,
  };
}
