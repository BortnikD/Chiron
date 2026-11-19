import type { Appointment, AppointmentServiceResponse, PageResponse } from '@/shared/types';

/**
 * Нормализатор записи на приём для полной совместимости со схемой нескольких услуг (PR #17 / #39).
 * Обеспечивает наличие как современных полей (services, estimatedTotal, actualTotal),
 * так и обратную совместимость (serviceId, priceSnapshot, price, serviceName).
 */
export function normalizeAppointment<T extends Record<string, any>>(raw: T): T & Appointment {
  if (!raw || typeof raw !== 'object') return raw as any;

  const services: AppointmentServiceResponse[] = Array.isArray(raw.services) ? raw.services : [];
  const primaryService = services[0];
  const serviceId = raw.serviceId || primaryService?.serviceId || '';

  const price =
    raw.actualTotal ??
    raw.estimatedTotal ??
    raw.priceSnapshot ??
    raw.price ??
    primaryService?.priceSnapshot ??
    0;

  const serviceName =
    raw.serviceName ||
    (services.length > 1
      ? `${primaryService?.nameSnapshot || 'Услуга'} (+${services.length - 1})`
      : primaryService?.nameSnapshot);

  return {
    ...raw,
    serviceId,
    serviceName: serviceName || raw.serviceName,
    priceSnapshot: raw.priceSnapshot ?? price,
    price,
    services,
    estimatedTotal: raw.estimatedTotal ?? price,
    actualTotal: raw.actualTotal ?? null,
    durationMin: raw.durationMin ?? primaryService?.durationMinSnapshot ?? null,
    bufferAfterMin: raw.bufferAfterMin ?? primaryService?.bufferAfterMinSnapshot ?? null,
  } as T & Appointment;
}

export function normalizeAppointmentPage<T extends PageResponse<any>>(page: T): T {
  if (!page || !Array.isArray(page.items)) return page;
  return {
    ...page,
    items: page.items.map(normalizeAppointment),
  };
}
