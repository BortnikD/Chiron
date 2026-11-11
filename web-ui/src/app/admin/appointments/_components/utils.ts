import type { AdminUpdateAppointmentRequest } from '@/modules/admin/types';
import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import type { AppointmentStatus, User } from '@/shared/types';
import { APPOINTMENT_STATUS_META, formatIsoDateDisplay } from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export const CANCEL_REASONS = [
  'По просьбе клиента',
  'Врач не может принять',
  'Питомец выздоровел',
  'Ошибка при записи',
  'Клиент не выходит на связь',
];

export const PAGE_SIZES = [10, 25, 50] as const;

export interface ActiveFilterChip {
  key: string;
  label: string;
  clear: () => void;
}

export function nextMoscowDayIso(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0)).toISOString().slice(0, 10);
}

export function formatAppointmentCrumb(
  appt: Appointment | null,
  pets: Pet[],
  services: Service[]
): string | undefined {
  if (!appt) return undefined;
  const petName = pets.find((p) => p.id === appt.petId)?.name || 'Питомец';
  const svcName = services.find((s) => s.id === appt.serviceId)?.name || 'Приём';
  return `${petName} — ${svcName}`;
}

export function computeAppointmentEditRange(
  appointment: Appointment,
  services: Service[],
  date: string,
  start: string
): { startAt: string; endAt: string } {
  const selectedSvc = services.find((s) => s.id === appointment.serviceId);
  const origDurMin = Math.round(
    (new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / 60000
  );
  const dur = origDurMin > 0 ? origDurMin : (selectedSvc?.baseDurationMin ?? 30);
  const startAt = new Date(`${date}T${start}:00+03:00`).toISOString();
  const endAt = new Date(new Date(startAt).getTime() + dur * 60000).toISOString();
  return { startAt, endAt };
}

export function buildUpdateAppointmentPayload(
  appointment: Appointment,
  services: Service[],
  form: {
    veterinarianId: string;
    date: string;
    start: string;
    status: AppointmentStatus;
    cancelReason: string;
    clientComment: string;
    vetNotes: string;
  }
): AdminUpdateAppointmentRequest {
  const range =
    form.date && form.start
      ? computeAppointmentEditRange(appointment, services, form.date, form.start)
      : { startAt: appointment.startAt, endAt: appointment.endAt };

  return {
    veterinarianId: form.veterinarianId,
    startAt: range.startAt,
    endAt: range.endAt,
    status: form.status,
    clientComment: form.clientComment.trim() || null,
    vetNotes: form.vetNotes.trim() || null,
    cancelReason:
      form.status === 'CANCELLED' ? form.cancelReason.trim() || 'Отменено администратором' : null,
  };
}

export function buildActiveFilterChips(params: {
  vetFilter: string;
  petFilter: string;
  ownerFilter: string;
  serviceFilter: string;
  statusFilters: AppointmentStatus[];
  dateFrom: string;
  dateTo: string;
  veterinarians: Veterinarian[];
  pets: Pet[];
  users: User[];
  services: Service[];
  setVetFilter: (v: string) => void;
  setPetFilter: (v: string) => void;
  setOwnerFilter: (v: string) => void;
  setServiceFilter: (v: string) => void;
  toggleStatusFilter: (s: AppointmentStatus) => void;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
}): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (params.vetFilter !== 'ALL') {
    const v = params.veterinarians.find((item) => item.id === params.vetFilter);
    chips.push({
      key: 'vet',
      label: `Врач: ${getDoctorDisplay(v).fullName}`,
      clear: () => params.setVetFilter('ALL'),
    });
  }
  if (params.petFilter !== 'ALL') {
    const p = params.pets.find((item) => item.id === params.petFilter);
    chips.push({
      key: 'pet',
      label: `Питомец: ${p?.name || 'выбран'}`,
      clear: () => params.setPetFilter('ALL'),
    });
  }
  if (params.ownerFilter !== 'ALL') {
    const u = params.users.find((item) => item.id === params.ownerFilter);
    chips.push({
      key: 'owner',
      label: `Владелец: ${u?.fullName || u?.email || 'выбран'}`,
      clear: () => params.setOwnerFilter('ALL'),
    });
  }
  if (params.serviceFilter !== 'ALL') {
    const s = params.services.find((item) => item.id === params.serviceFilter);
    chips.push({
      key: 'service',
      label: `Услуга: ${s?.name || 'выбрана'}`,
      clear: () => params.setServiceFilter('ALL'),
    });
  }
  for (const st of params.statusFilters) {
    chips.push({
      key: `st-${st}`,
      label: `Статус: ${APPOINTMENT_STATUS_META[st]?.short || st}`,
      clear: () => params.toggleStatusFilter(st),
    });
  }
  if (params.dateFrom) {
    chips.push({
      key: 'from',
      label: `С ${formatIsoDateDisplay(params.dateFrom)}`,
      clear: () => params.setDateFrom(''),
    });
  }
  if (params.dateTo) {
    chips.push({
      key: 'to',
      label: `По ${formatIsoDateDisplay(params.dateTo)}`,
      clear: () => params.setDateTo(''),
    });
  }

  return chips;
}
