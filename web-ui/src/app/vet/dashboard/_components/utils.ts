import { Appointment, Pet } from '../../../../types';

export const STATUS_SHORT: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  IN_PROGRESS: 'Идёт приём',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};

/**
 * Форматирует время слота (ЧЧ:ММ) по московскому времени
 */
export const formatSlotTime = (iso: string): string => {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
};

/**
 * Форматирует дату слота в читаемый формат на русском языке
 */
export const formatDateRu = (iso: string, options?: Intl.DateTimeFormatOptions): string => {
  return new Date(iso).toLocaleDateString(
    'ru-RU',
    options || {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
};

/**
 * Получить имя питомца из записи или карты питомцев
 */
export const getPetName = (appt: Appointment, petsMap?: Record<string, Pet>): string => {
  if (appt.pet?.name) return appt.pet.name;
  if (appt.petName) return appt.petName;
  if (petsMap && appt.petId && petsMap[appt.petId]) return petsMap[appt.petId].name;
  return 'Пациент';
};

/**
 * Получить имя владельца или кличку питомца
 */
export const getOwnerDisplay = (appt: Appointment, petsMap?: Record<string, Pet>): string => {
  if (appt.pet?.ownerId) return `Владелец (${appt.pet.ownerId.slice(0, 6)})`;
  if (petsMap && appt.petId && petsMap[appt.petId]?.ownerId) {
    return `Владелец (${petsMap[appt.petId].ownerId.slice(0, 6)})`;
  }
  return 'Владелец';
};
