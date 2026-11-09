import { Species, User } from '../../../../types';
import { getSpeciesTone } from '../../../../components/ui/SpeciesIcon';

export { getSpeciesTone };

/**
 * Расчёт текстового возраста питомца на основе даты рождения.
 */
export function calculateAge(birthDate?: string | null): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return '—';
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years > 0) return `${years} г. ${months > 0 ? `${months} м.` : ''}`.trim();
  if (months > 0) return `${months} мес.`;
  return 'Меньше месяца';
}

/**
 * Форматирование веса питомца в килограммах.
 */
export function formatPetWeight(weightKg?: number | null): string {
  if (weightKg == null) return '—';
  return `${String(weightKg).replace('.', ',')} кг`;
}

/**
 * Получение отображаемого имени владельца по его ID.
 */
export function getOwnerName(users: User[], ownerId?: string): string {
  if (!ownerId) return '—';
  const user = users.find((u) => u.id === ownerId);
  return user ? user.fullName : '—';
}

/**
 * Получение названия вида животного по его ID.
 */
export function getSpeciesName(speciesList: Species[], spId?: string): string {
  if (!spId) return '—';
  const sp = speciesList.find((s) => s.id === spId);
  return sp ? sp.name : '—';
}

/**
 * Разбор и форматирование даты и времени приёма.
 */
export function formatAppointmentDate(dateStr: string): {
  day: number;
  month: string;
  time: string;
} {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = d.toLocaleDateString('ru-RU', { month: 'short' });
  const time = d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { day, month, time };
}
