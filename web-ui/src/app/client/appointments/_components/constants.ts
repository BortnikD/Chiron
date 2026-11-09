/**
 * Константы и вспомогательные типы для записей на приём клиента.
 */

export type FilterTab = 'UPCOMING' | 'COMPLETED' | 'ALL';

/**
 * Локализованные краткие названия статусов приёмов.
 */
export const STATUS_SHORT: Record<string, string> = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};
