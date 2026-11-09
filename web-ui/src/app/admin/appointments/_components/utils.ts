import { AppointmentStatus, Veterinarian, Service, Pet, User } from '../../../../types';

/**
 * Карта отображения статусов записей на приём: название, краткая метка, класс бейджа chiron.css.
 */
export const STATUS_MAP: Record<AppointmentStatus, { label: string; short: string; cls: string }> = {
  PENDING: { label: 'В ожидании', short: 'Ожидает', cls: 'badge-PENDING' },
  CONFIRMED: { label: 'Подтверждена', short: 'Подтверждена', cls: 'badge-CONFIRMED' },
  IN_PROGRESS: { label: 'В процессе', short: 'В процессе', cls: 'badge-CONFIRMED' },
  COMPLETED: { label: 'Завершена', short: 'Завершена', cls: 'badge-COMPLETED' },
  CANCELLED: { label: 'Отменена', short: 'Отменена', cls: 'badge-CANCELLED' },
  NO_SHOW: { label: 'Неявка', short: 'Неявка', cls: 'badge-NO_SHOW' },
};

export const ALL_STATUSES: AppointmentStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

/**
 * Возвращает полное имя врача или дефолтную строку.
 */
export function getVetName(
  vetId: string,
  veterinarians: Veterinarian[],
  users: User[] = []
): string {
  const vet = veterinarians.find((v) => v.id === vetId);
  if (!vet) return 'Врач клиники';
  if (vet.user?.fullName) return vet.user.fullName;
  const user = users.find((u) => u.id === vet.userId);
  return user?.fullName || `Врач (${vetId.slice(0, 6)})`;
}

/**
 * Возвращает название услуги.
 */
export function getServiceName(svcId: string, services: Service[]): string {
  const svc = services.find((s) => s.id === svcId);
  return svc?.name || 'Услуга клиники';
}

/**
 * Находит питомца по идентификатору.
 */
export function getPet(petId: string, pets: Pet[]): Pet | undefined {
  return pets.find((p) => p.id === petId);
}

/**
 * Возвращает имя владельца питомца.
 */
export function getOwnerName(ownerId?: string, users: User[] = []): string {
  if (!ownerId) return '—';
  const user = users.find((u) => u.id === ownerId);
  return user ? user.fullName : '—';
}

/**
 * Форматирует дату и время приёма для отображения в таблице и карточке.
 */
export function formatDateTime(iso: string): { date: string; time: string; rawDate: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return { date, time, rawDate: d.toISOString().split('T')[0] };
}

/**
 * Форматирует цену в рублях.
 */
export function formatPrice(price?: number | null): string {
  if (price == null) return '0 ₽';
  return `${price.toLocaleString('ru-RU')} ₽`;
}
