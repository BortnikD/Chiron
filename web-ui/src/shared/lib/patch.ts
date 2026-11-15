/**
 * Утилита для вычисления диффа частичного обновления (PATCH).
 *
 * Семантика Chiron API:
 * - В результат включаются только поля, значения которых изменились относительно `initial`.
 * - Если строковое поле было непустым и стало `""` (или `null`), в результат явно записывается `null`
 *   (сигнал бэкенду для очистки nullable-поля).
 * - Если поле не менялось — оно не включается в возвращаемый объект.
 */
export function buildPatchPayload<T extends Record<string, unknown>>(
  initial: T,
  current: T
): Partial<T> {
  const patch: Record<string, unknown> = {};

  const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)]) as Set<keyof T>;

  for (const key of allKeys) {
    const initVal = initial[key];
    const currVal = current[key];

    // Если значения строго равны — изменений нет
    if (initVal === currVal) {
      continue;
    }

    // Если строковое поле было непустым и стало "" или null
    const wasNonEmptyString = typeof initVal === 'string' && initVal.trim().length > 0;
    const isNowEmpty = currVal === '' || currVal === null;

    if (wasNonEmptyString && isNowEmpty) {
      patch[key as string] = null;
      continue;
    }

    // Если оба значения эквивалентны "пустому" (null/undefined/""), считаем, что изменений нет
    const isInitBlank = initVal === null || initVal === undefined || initVal === '';
    const isCurrBlank = currVal === null || currVal === undefined || currVal === '';
    if (isInitBlank && isCurrBlank) {
      continue;
    }

    // Если поле было пустым/null и стало "", не включаем его
    if (currVal === '' && (initVal === null || initVal === undefined)) {
      continue;
    }

    // Если текущее значение пустая строка, заменяем на null для бэкенда
    if (currVal === '') {
      patch[key as string] = null;
      continue;
    }

    // Иначе записываем изменившееся значение
    patch[key as string] = currVal;
  }

  return patch as Partial<T>;
}
