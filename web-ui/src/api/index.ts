/**
 * Единый фасад API для системы ветеринарной клиники Chiron.
 * Реэкспортирует доменные API-модули для обратной совместимости.
 */

export * from '../shared/api';
export * from '../modules/clinic/api';
export * from '../modules/client/api';
export * from '../modules/vet/api';
export * from '../modules/admin/api';
