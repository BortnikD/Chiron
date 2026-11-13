import type { Appointment, Pet } from '@/modules/client/types';

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
 * Получить отображение владельца из записи или карты питомцев
 */
export const getOwnerDisplay = (appt: Appointment, petsMap?: Record<string, Pet>): string => {
  const mappedPet = petsMap && appt.petId ? petsMap[appt.petId] : undefined;
  if (appt.pet?.ownerName) return appt.pet.ownerName;
  if (mappedPet?.ownerName) return mappedPet.ownerName;
  if (appt.pet?.ownerId) return `Владелец (${appt.pet.ownerId.slice(0, 6)})`;
  if (mappedPet?.ownerId) return `Владелец (${mappedPet.ownerId.slice(0, 6)})`;
  return 'Владелец';
};
