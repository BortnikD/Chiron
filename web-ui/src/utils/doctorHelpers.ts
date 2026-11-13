/**
 * Вспомогательные функции для отображения информации о ветеринарных врачах в интерфейсе Chiron.
 * Предоставляют имена, специализации и инициалы для сидовых врачей клиники,
 * чьи профили пользователей могут не объединяться в базовых ответах API.
 */

export interface DoctorDisplayInfo {
  name: string;
  fullName: string;
  initials: string;
  specName: string;
  title: string;
}

export const KNOWN_DOCTORS: Record<
  string,
  { fullName: string; shortName: string; initials: string; title: string; specName: string }
> = {
  '5eed0006-0000-0000-0000-000000000001': {
    fullName: 'Анна Сергеевна Иванова',
    shortName: 'Анна Иванова',
    initials: 'АИ',
    title: 'Ведущий терапевт',
    specName: 'Терапия',
  },
  '5eed0006-0000-0000-0000-000000000002': {
    fullName: 'Павел Петров',
    shortName: 'Павел Петров',
    initials: 'ПП',
    title: 'Ветеринарный врач-терапевт',
    specName: 'Терапия',
  },
  '5eed0006-0000-0000-0000-000000000003': {
    fullName: 'Елена Викторовна Смирнова',
    shortName: 'Елена Смирнова',
    initials: 'ЕС',
    title: 'Ведущий хирург',
    specName: 'Хирургия',
  },
  '5eed0006-0000-0000-0000-000000000004': {
    fullName: 'Олег Кузнецов',
    shortName: 'Олег Кузнецов',
    initials: 'ОК',
    title: 'Ветеринарный стоматолог',
    specName: 'Стоматология',
  },
};

export const SPECIALIZATION_NAMES_RU: Record<string, string> = {
  Therapy: 'Терапия',
  Surgery: 'Хирургия',
  Dentistry: 'Стоматология',
  Dermatology: 'Дерматология',
  Ophthalmology: 'Офтальмология',
  Preventive: 'Профилактика',
  '5eed0002-0000-0000-0000-000000000001': 'Терапия',
  '5eed0002-0000-0000-0000-000000000002': 'Хирургия',
  '5eed0002-0000-0000-0000-000000000003': 'Стоматология',
  '5eed0002-0000-0000-0000-000000000004': 'Дерматология',
  '5eed0002-0000-0000-0000-000000000005': 'Офтальмология',
  '5eed0002-0000-0000-0000-000000000006': 'Профилактика',
};

export function getDoctorDisplay(
  vet?: {
    id?: string;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
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
      fullName: 'Ветеринарный врач',
      initials: 'ВР',
      specName: 'Терапия',
      title: 'Ветеринарный врач',
    };
  }

  const known = vet.id ? KNOWN_DOCTORS[vet.id] : undefined;
  const fName = vet.user?.firstName || vet.firstName || null;
  const mName = vet.user?.middleName ?? vet.middleName ?? null;
  const lName = vet.user?.lastName || vet.lastName || null;
  const rawFull = vet.user?.fullName || vet.fullName || null;

  // Полное ФИО врача (для детального острова, модальных окон и медкарт)
  const fullName =
    (fName && lName
      ? [fName, mName, lName].filter(Boolean).join(' ')
      : rawFull) ||
    known?.fullName ||
    'Ветеринарный врач';

  // Компактное имя для карточек ("Имя Фамилия", 12-14 символов)
  // Исключает перенос отчества вниз на 2-ю строку при сжатии карточки (открытие бокового острова)
  let name =
    (fName && lName
      ? `${fName} ${lName}`.trim()
      : known?.shortName) ||
    fullName;

  // Если имя из API содержит отчество (3 слова), сокращаем для карточки до "Имя Фамилия"
  const nameParts = name.split(/\s+/).filter(Boolean);
  if (nameParts.length >= 3) {
    name = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
  }

  let initials = '';
  if (fName && lName) {
    initials = `${fName.charAt(0)}${lName.charAt(0)}`.toUpperCase();
  } else if (rawFull) {
    const parts = rawFull.replace(/\./g, '').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      initials = `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    } else if (known) {
      initials = known.initials;
    } else {
      initials = 'ВР';
    }
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
    fullName,
    initials,
    specName,
    title,
  };
}
