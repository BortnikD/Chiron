import { clinicApi } from '@/modules/clinic/api';
import { vetApi } from '@/modules/vet/api';
import type { Appointment } from '@/modules/client/types';
import type { ScheduleException } from '@/modules/clinic/types';
import type { AppointmentStatus } from '@/shared/types';
import { getMoscowTodayIso } from '@/shared/lib';
import {
  moscowNextDayInstant,
  moscowStartInstant,
  shiftIsoDate,
} from '../../dashboard/_components/vetHelpers';

export type AppointmentsViewMode = 'table' | 'cal';
export type AppointmentsTab = 'upcoming' | 'history' | 'all';
export type CalendarMode = 'day' | 'week';

export function getCalendarDaysRange(calMode: CalendarMode, calOffset: number): string[] {
  const todayIso = getMoscowTodayIso();
  if (calMode === 'day') {
    return [shiftIsoDate(todayIso, calOffset)];
  }
  const [y, m, d] = todayIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dow = (dt.getUTCDay() + 6) % 7;
  const mondayIso = shiftIsoDate(todayIso, -dow + calOffset * 7);
  return Array.from({ length: 7 }, (_, i) => shiftIsoDate(mondayIso, i));
}

export async function fetchVetAppointmentsForView(params: {
  viewMode: AppointmentsViewMode;
  calDayIsos: string[];
  vetProfileId?: string;
  tab: AppointmentsTab;
  petFilter: string;
  statusFilter: AppointmentStatus[];
  dateFrom: string;
  dateTo: string;
  page: number;
  size: number;
}): Promise<{
  items: Appointment[];
  totalElements: number;
  totalPages: number;
  exceptions?: ScheduleException[];
}> {
  const {
    viewMode,
    calDayIsos,
    vetProfileId,
    tab,
    petFilter,
    statusFilter,
    dateFrom,
    dateTo,
    page,
    size,
  } = params;

  if (viewMode === 'cal') {
    const firstIso = calDayIsos[0];
    const lastIso = calDayIsos[calDayIsos.length - 1];
    const [apptsRes, excRes] = await Promise.all([
      vetApi.getAppointments({
        page: 0,
        size: 100,
        petId: petFilter || undefined,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        from: moscowStartInstant(firstIso),
        to: moscowNextDayInstant(lastIso),
      }),
      vetProfileId
        ? clinicApi.getScheduleExceptions(vetProfileId, firstIso, lastIso).catch(() => [])
        : Promise.resolve([] as ScheduleException[]),
    ]);
    const items = (apptsRes?.items ?? [])
      .slice()
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    return {
      items,
      totalElements: items.length,
      totalPages: 1,
      exceptions: Array.isArray(excRes) ? excRes : [],
    };
  }

  const nowIsoInstant = new Date().toISOString();
  let fromInstant: string | undefined = dateFrom ? moscowStartInstant(dateFrom) : undefined;
  let toInstant: string | undefined = dateTo ? moscowNextDayInstant(dateTo) : undefined;
  let effStatus: AppointmentStatus[] | undefined =
    statusFilter.length > 0 ? statusFilter : undefined;

  if (tab === 'upcoming') {
    effStatus = effStatus ?? ['PENDING', 'CONFIRMED'];
    fromInstant = fromInstant && fromInstant > nowIsoInstant ? fromInstant : nowIsoInstant;
  } else if (tab === 'history') {
    toInstant = toInstant && toInstant < nowIsoInstant ? toInstant : nowIsoInstant;
  }

  if (fromInstant && toInstant && fromInstant >= toInstant) {
    return { items: [], totalElements: 0, totalPages: 1 };
  }

  const res = await vetApi.getAppointments({
    page,
    size,
    petId: petFilter || undefined,
    status: effStatus,
    from: fromInstant,
    to: toInstant,
  });
  const items = (res?.items ?? [])
    .slice()
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return {
    items,
    totalElements: res?.totalElements ?? items.length,
    totalPages: Math.max(1, res?.totalPages ?? 1),
  };
}
