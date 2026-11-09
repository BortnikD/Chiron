/**
 * Определение тона/вида животного для иконки и цветного акцента карточки.
 */
export function getSpeciesTone(
  speciesId?: string,
  speciesMap?: Record<string, string>
): 'dog' | 'rab' | 'par' | 'cat' {
  const spName = (speciesId && speciesMap ? speciesMap[speciesId] : '') || speciesId || '';
  const norm = spName.toLowerCase();
  if (norm.includes('соб') || norm.includes('dog')) return 'dog';
  if (norm.includes('крол')) return 'rab';
  if (norm.includes('попуг') || norm.includes('птиц')) return 'par';
  return 'cat';
}

/**
 * Расчёт текстового возраста питомца на основе даты рождения.
 */
export function getPetAge(birthDate?: string | null): string {
  if (!birthDate) return 'возраст не указан';
  const years = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 86400000));
  if (years <= 0) return 'до года';
  if (years === 1) return '1 год';
  if (years < 5) return `${years} года`;
  return `${years} лет`;
}
