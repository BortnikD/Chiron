import type { AvailableSlotResponse, Veterinarian } from '@/modules/clinic/types';
import { formatApiError } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export function resolveDoctorDisplayName(
  isAnyVet: boolean,
  selectedVet: Veterinarian | null,
  selectedSlot: AvailableSlotResponse | null,
  selectedSlotVetId: string | null,
  veterinarians: Veterinarian[],
  specsMap: Record<string, string>
): string {
  if (!isAnyVet && selectedVet) {
    return getDoctorDisplay(selectedVet, specsMap).name;
  }
  if (selectedSlotVetId) {
    const picked = veterinarians.find((v) => v.id === selectedSlotVetId);
    return picked ? getDoctorDisplay(picked, specsMap).name : 'Дежурный врач';
  }
  if (selectedSlot && selectedSlot.veterinarianIds.length > 1) {
    return 'Выберите врача в шаге 4';
  }
  if (selectedSlot && selectedSlot.veterinarianIds.length === 1) {
    const match = veterinarians.find((v) => v.id === selectedSlot.veterinarianIds[0]);
    return match ? getDoctorDisplay(match, specsMap).name : 'Дежурный врач';
  }
  return 'Любой';
}

export function isSlotConflictError(err: unknown): boolean {
  const e = err as {
    status?: number;
    message?: string;
    rawError?: { message?: string; exception?: string; name?: string } | null;
  } | null;
  if (e?.status === 409 || e?.status === 422) return true;
  const rawName = (e?.rawError?.exception || e?.rawError?.name || '').toLowerCase();
  const msg = `${e?.message || ''} ${e?.rawError?.message || ''}`.toLowerCase();
  return (
    rawName.includes('appointmentslotunavailable') ||
    msg.includes('overlap') ||
    msg.includes('duration') ||
    msg.includes('absent') ||
    msg.includes('working hours') ||
    msg.includes('does not work') ||
    msg.includes('must be in the future')
  );
}

export function parseBookingError(err: unknown): string {
  const e = err as {
    message?: string;
    violations?: Array<{ field?: string; message?: string }>;
    rawError?: { message?: string; exception?: string; name?: string } | null;
  } | null;
  const rawName = (e?.rawError?.exception || e?.rawError?.name || '').toLowerCase();
  const violationText = Array.isArray(e?.violations)
    ? e.violations.map((v) => `${v.field ?? ''} ${v.message ?? ''}`).join(' ')
    : '';
  const msg = `${e?.message || ''} ${e?.rawError?.message || ''} ${violationText}`.toLowerCase();

  if (msg.includes('must be in the future') || msg.includes('past')) {
    return 'Нельзя записаться на прошедшее время. Выберите более позднее окно.';
  }
  if (rawName.includes('petarchived') || msg.includes('archived')) {
    return 'Профиль питомца находится в архиве. Запись невозможна.';
  }
  if (
    rawName.includes('veterinariannotpermittedforspecies') ||
    (msg.includes('not permitted') && msg.includes('species'))
  ) {
    return 'Выбранный врач не принимает животных данного вида.';
  }
  if (
    rawName.includes('servicenotavailableforspecies') ||
    msg.includes('not available for species') ||
    (msg.includes('species') && msg.includes('service'))
  ) {
    return 'Выбранная услуга недоступна для вида этого питомца.';
  }
  if (rawName.includes('veterinarianinactive') || rawName.includes('serviceinactive')) {
    return 'Выбранная услуга или врач сейчас недоступны для записи.';
  }
  if (msg.includes('match the service duration') || msg.includes('duration')) {
    return 'Длительность окна изменилась. Список окон обновлён — выберите время заново.';
  }
  if (
    msg.includes('does not work') ||
    msg.includes('sunday') ||
    msg.includes('monday') ||
    msg.includes('tuesday') ||
    msg.includes('wednesday') ||
    msg.includes('thursday') ||
    msg.includes('friday') ||
    msg.includes('saturday')
  ) {
    return 'Врач не ведёт приём в этот день недели.';
  }
  if (msg.includes('overlaps the break')) {
    return 'Выбранное время пересекается с перерывом врача.';
  }
  if (msg.includes('overlaps') || rawName.includes('appointmentslotunavailable')) {
    return 'Выбранное время только что заняли. Выберите другое окно.';
  }
  if (msg.includes('outside custom working hours') || msg.includes('outside working hours')) {
    return 'Выбранное время выходит за рамки рабочего графика врача.';
  }
  if (msg.includes('absent')) {
    return 'Врач отсутствует в этот день (отпуск или больничный).';
  }
  return formatApiError(err, 'Не удалось оформить запись. Попробуйте выбрать другое время.');
}
