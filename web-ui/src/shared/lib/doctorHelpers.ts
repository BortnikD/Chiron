/**
 * Вспомогательные функции для отображения информации о ветеринарных врачах в интерфейсе Chiron.
 * Динамически формируют ФИО, инициалы, компактное имя и специализацию из данных API.
 */

export interface DoctorDisplayInfo {
  name: string;
  fullName: string;
  initials: string;
  specName: string;
  specNames: string[];
  title: string;
}

export const SPECIALIZATION_NAMES_RU: Record<string, string> = {
  Therapy: 'Терапия',
  Surgery: 'Хирургия',
  Dentistry: 'Стоматология',
  Dermatology: 'Дерматология',
  Ophthalmology: 'Офтальмология',
  Preventive: 'Профилактика',
};

export function getDoctorDisplay(
  vet?: {
    id?: string;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    title?: string | null;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      middleName?: string | null;
      fullName?: string | null;
    } | null;
    specialization?: { name?: string | null } | null;
    specializationId?: string | null;
    specializationIds?: string[] | null;
  } | null,
  specializationsMap?: Record<string, string>
): DoctorDisplayInfo {
  if (!vet) {
    return {
      name: 'Ветеринарный врач',
      fullName: 'Ветеринарный врач',
      initials: 'ВР',
      specName: 'Терапия',
      specNames: ['Терапия'],
      title: 'Ветеринарный врач',
    };
  }

  const fName = vet.user?.firstName || vet.firstName || null;
  const mName = vet.user?.middleName ?? vet.middleName ?? null;
  const lName = vet.user?.lastName || vet.lastName || null;
  const rawFull = vet.user?.fullName || vet.fullName || null;

  // Полное ФИО врача (для детального острова, модальных окон и медкарт)
  const fullName =
    (fName && lName
      ? [fName, mName, lName].filter(Boolean).join(' ')
      : rawFull) || 'Ветеринарный врач';

  // Компактное имя для карточек ("Имя Фамилия")
  let name =
    (fName && lName ? `${fName} ${lName}`.trim() : rawFull) || fullName;

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
    } else {
      initials = parts[0]?.slice(0, 2).toUpperCase() || 'ВР';
    }
  } else {
    initials = 'ВР';
  }

  const rawSpec =
    vet.specialization?.name ||
    (vet.specializationId && specializationsMap?.[vet.specializationId]) ||
    (vet.specializationIds?.[0] && specializationsMap?.[vet.specializationIds[0]]) ||
    'Терапия';

  const specName = SPECIALIZATION_NAMES_RU[rawSpec] || rawSpec;

  const specNames: string[] =
    vet.specializationIds && vet.specializationIds.length > 0
      ? vet.specializationIds
          .map((id) => {
            const raw = specializationsMap?.[id] || id;
            return SPECIALIZATION_NAMES_RU[raw] || raw;
          })
          .filter(Boolean)
      : [specName];

  const title = vet.title || `Врач-${specName.toLowerCase()}`;

  return {
    name,
    fullName,
    initials,
    specName,
    specNames,
    title,
  };
}
