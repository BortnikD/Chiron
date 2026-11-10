import type { Pet, Vaccination } from '@/modules/client/types';
import { getMoscowTodayIso } from '@/shared/lib';
import type { VaccinationStatusInfo, VaccinationStatusTone } from './types';

/**
 * Расчет статуса вакцинации и цветовой индикации по дате следующей дозы (в Europe/Moscow).
 */
export const calculateVaccinationStatus = (nextDueStr?: string | null): VaccinationStatusInfo => {
  if (!nextDueStr) return { label: 'Выполнено', cls: 'badge-accent', tone: 'ok' };

  const todayIso = getMoscowTodayIso();
  const dueIso = nextDueStr.slice(0, 10);
  const todayMs = Date.parse(`${todayIso}T00:00:00Z`);
  const dueMs = Date.parse(`${dueIso}T00:00:00Z`);

  if (Number.isNaN(dueMs)) {
    return { label: 'Выполнено', cls: 'badge-accent', tone: 'ok' };
  }

  const diffDays = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'Просрочена', cls: 'badge-danger', tone: 'overdue' };
  }
  if (diffDays <= 30) {
    return {
      label: diffDays === 0 ? 'Сегодня' : `Через ${diffDays} дн.`,
      cls: 'badge-warn',
      tone: 'soon',
    };
  }
  const months = Math.round(diffDays / 30);
  return {
    label: `Через ${months} мес.`,
    cls: 'badge-accent',
    tone: 'ok',
  };
};

/**
 * Фильтрация записей вакцинации по поисковому запросу (название вакцины или имя питомца),
 * статусу ревакцинации и идентификатору выбранного питомца.
 */
export const filterVaccinations = (
  vaccinations: Vaccination[],
  petMap: Map<string, Pet>,
  search: string,
  statusFilter: VaccinationStatusTone,
  petFilter = 'all'
): Vaccination[] => {
  const query = search.trim().toLowerCase();

  return vaccinations.filter((v) => {
    if (petFilter !== 'all' && v.petId !== petFilter) {
      return false;
    }

    const pet = petMap.get(v.petId);
    const petName = (pet?.name || '').toLowerCase();
    const vaxName = (v.name || v.vaccineName || '').toLowerCase();

    if (query) {
      const matchesSearch = petName.includes(query) || vaxName.includes(query);
      if (!matchesSearch) return false;
    }

    if (statusFilter !== 'all') {
      const status = calculateVaccinationStatus(v.nextDueOn || v.validUntil);
      if (status.tone !== statusFilter) return false;
    }

    return true;
  });
};

/**
 * Подсчет просроченных и предстоящих ревакцинаций для аналитических карточек.
 */
export const countVaccinationTones = (vaccinations: Vaccination[]) => {
  let overdue = 0;
  let soon = 0;

  for (const v of vaccinations) {
    const tone = calculateVaccinationStatus(v.nextDueOn || v.validUntil).tone;
    if (tone === 'overdue') overdue++;
    else if (tone === 'soon') soon++;
  }

  return { overdue, soon, total: vaccinations.length };
};
