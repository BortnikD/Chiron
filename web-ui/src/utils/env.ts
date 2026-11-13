/**
 * Утилита для определения режима окружения (Development vs Production).
 * 
 * В Development режиме отображаются:
 * - Кнопки быстрого заполнения демо-аккаунтов на экране входа
 * - Индикатор доступности сервера / статус healthcheck в сайдбаре и футере
 * - Подсказки с тестовыми логинами
 * 
 * В Production режиме данные элементы скрываются.
 */
export function isDevMode(): boolean {
  // Явный флаг из переменной окружения NEXT_PUBLIC_DEV_MODE
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') return true;
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'false') return false;

  // В production сборке дев-элементы отключены
  if (process.env.NODE_ENV === 'production') return false;

  // Next.js режим разработки (next dev)
  if (process.env.NODE_ENV === 'development') return true;

  // Локальный хост при клиентском рендере
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  }

  return false;
}
