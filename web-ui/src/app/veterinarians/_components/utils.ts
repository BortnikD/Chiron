import { Veterinarian } from '../../../types';
import { getDoctorDisplay, KNOWN_DOCTORS } from '../../../utils/doctorHelpers';
import { SPEC_TONES } from './constants';

export function getSpecTone(specId?: string | null): string {
  if (!specId) return 'ther';
  return SPEC_TONES[specId] || 'ther';
}

export function getSpeciesTone(name: string): 'cat' | 'dog' | 'rab' | 'par' {
  const lower = name.toLowerCase();
  if (lower.includes('соб') || lower.includes('dog')) return 'dog';
  if (lower.includes('крол') || lower.includes('rab')) return 'rab';
  if (lower.includes('попуг') || lower.includes('птиц') || lower.includes('bird')) return 'par';
  return 'cat';
}

export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

export function toIdNameMap(items: Array<{ id: string; name: string }>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of items) {
    map[item.id] = item.name;
  }
  return map;
}

/**
 * Возвращает компактное имя доктора («Имя Фамилия») для вывода в карточке.
 * Исключает отчество и перенос на вторую строку при сжатии карточки.
 */
export function getDoctorCardName(vet: Veterinarian, specsMap?: Record<string, string>): string {
  const known = KNOWN_DOCTORS[vet.id];
  if (known?.shortName) {
    return known.shortName;
  }
  const display = getDoctorDisplay(vet, specsMap);
  let name = display.name;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    const isMiddle = (p: string) => /(?:ович|евич|ич|овна|евна|ична|ыч)$/i.test(p);
    const nonMiddle = parts.filter((p) => !isMiddle(p));
    if (nonMiddle.length === 2) {
      name = `${nonMiddle[0]} ${nonMiddle[1]}`;
    } else {
      name = `${parts[0]} ${parts[parts.length - 1]}`;
    }
  }
  return name;
}

/**
 * Возвращает полное ФИО врача с отчеством для детального острова.
 */
export function getDoctorFullName(vet: Veterinarian, specsMap?: Record<string, string>): string {
  const known = KNOWN_DOCTORS[vet.id];
  if (known?.fullName) {
    return known.fullName;
  }
  const display = getDoctorDisplay(vet, specsMap);
  return display.fullName || display.name;
}

/**
 * Фильтрует врачей по специализации, виду животных и поисковой строке.
 */
export function filterVeterinarians(
  vets: Veterinarian[],
  selectedSpec: string,
  selectedSpecies: string,
  searchQuery: string,
  vetPermissions: Record<string, string[]>,
  specsMap: Record<string, string>
): Veterinarian[] {
  const q = searchQuery.trim().toLowerCase();
  return vets.filter((v) => {
    if (selectedSpec !== 'ALL' && v.specializationId !== selectedSpec) return false;
    if (selectedSpecies !== 'ALL' && (!vetPermissions[v.id] || !vetPermissions[v.id].includes(selectedSpecies))) {
      return false;
    }
    if (!q) return true;
    const { name, fullName, specName } = getDoctorDisplay(v, specsMap);
    return (
      name.toLowerCase().includes(q) ||
      fullName.toLowerCase().includes(q) ||
      specName.toLowerCase().includes(q) ||
      Boolean(v.bio && v.bio.toLowerCase().includes(q))
    );
  });
}
