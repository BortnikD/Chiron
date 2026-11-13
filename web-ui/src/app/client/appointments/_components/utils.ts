import type { Appointment, Pet } from '@/modules/client/types';
import type { Service, Veterinarian } from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import {
  APPOINTMENT_STATUS_META,
  formatDateShort,
  formatIsoDateDisplay,
  formatSlotTime,
} from '@/shared/lib';
import { getDoctorDisplay } from '@/utils/doctorHelpers';

export type AppointmentsFilterTab = 'UPCOMING' | 'HISTORY' | 'ALL';

export interface ActiveAppointmentFilterTag {
  key: string;
  label: string;
  onClear: () => void;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0)).toISOString().slice(0, 10);
}

export function toMoscowDayStartIso(isoDate: string): string {
  return `${isoDate}T00:00:00+03:00`;
}

export function toMoscowDayEndExclusiveIso(isoDate: string): string {
  return `${addDaysIso(isoDate, 1)}T00:00:00+03:00`;
}

export function resolveVetName(
  appointment: Appointment,
  vetsMap: Record<string, Veterinarian>
): string {
  const vet = vetsMap[appointment.veterinarianId] || appointment.veterinarian;
  if (vet) return getDoctorDisplay(vet).name;
  return appointment.veterinarianName || 'Врач клиники';
}

export function resolveCancelledByLabel(
  cancelledBy: string | null | undefined,
  currentUserId: string | undefined,
  vetsMap: Record<string, Veterinarian>
): string {
  if (!cancelledBy) return '—';
  if (currentUserId && cancelledBy === currentUserId) return 'Вы';
  const matchedVet = Object.values(vetsMap).find((v) => v.userId === cancelledBy);
  if (matchedVet) return `Врач · ${getDoctorDisplay(matchedVet).name}`;
  return 'Сотрудник клиники';
}

export function formatFollowUpParentLabel(
  parentAppt: Appointment | null | undefined,
  servicesMap: Record<string, Service>
): string {
  if (!parentAppt) return 'Открыть исходный приём';
  const svcName =
    servicesMap[parentAppt.serviceId]?.name || parentAppt.serviceName || parentAppt.service?.name || 'Приём';
  return `${formatDateShort(parentAppt.startAt)}, ${formatSlotTime(parentAppt.startAt)} · ${svcName}`;
}

export function computeDurationMinutes(startAt?: string, endAt?: string): number | null {
  if (!startAt || !endAt) return null;
  const diffMin = Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000);
  return diffMin > 0 ? diffMin : null;
}

export function buildActiveFilterTags(params: {
  selectedPetId: string;
  petsMap: Record<string, Pet>;
  statusChips: AppointmentStatus[];
  fromDate: string;
  toDate: string;
  onClearPet: () => void;
  onToggleStatus: (st: AppointmentStatus) => void;
  onClearFrom: () => void;
  onClearTo: () => void;
}): ActiveAppointmentFilterTag[] {
  const tags: ActiveAppointmentFilterTag[] = [];
  if (params.selectedPetId !== 'ALL') {
    const petName = params.petsMap[params.selectedPetId]?.name || 'Питомец';
    tags.push({
      key: `pet:${params.selectedPetId}`,
      label: `Питомец: ${petName}`,
      onClear: params.onClearPet,
    });
  }
  for (const st of params.statusChips) {
    tags.push({
      key: `st:${st}`,
      label: APPOINTMENT_STATUS_META[st]?.short || st,
      onClear: () => params.onToggleStatus(st),
    });
  }
  if (params.fromDate) {
    tags.push({
      key: `from:${params.fromDate}`,
      label: `С ${formatIsoDateDisplay(params.fromDate)}`,
      onClear: params.onClearFrom,
    });
  }
  if (params.toDate) {
    tags.push({
      key: `to:${params.toDate}`,
      label: `По ${formatIsoDateDisplay(params.toDate)}`,
      onClear: params.onClearTo,
    });
  }
  return tags;
}

export function buildPageNumbers(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const pages = new Set<number>([0, totalPages - 1, currentPage]);
  if (currentPage - 1 >= 0) pages.add(currentPage - 1);
  if (currentPage + 1 < totalPages) pages.add(currentPage + 1);
  return Array.from(pages).sort((a, b) => a - b);
}
