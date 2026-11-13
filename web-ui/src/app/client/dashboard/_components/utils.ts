import {
  formatDateRu,
  formatIsoDateDisplay,
  getMoscowDateKey,
  getMoscowTodayIso,
  pluralRu,
} from '@/shared/lib';

function diffMoscowDays(targetIso: string, baseIso: string): number {
  const [by, bm, bd] = baseIso.split('-').map(Number);
  const [ty, tm, td] = targetIso.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

export function isVaccinationDueSoonOrOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const dueIso = getMoscowDateKey(dateStr);
  if (!dueIso) return false;
  return dueIso <= getMoscowTodayIso(30);
}

export function getDueInfo(dateStr?: string | null): { text: string; cls: string; label: string } {
  if (!dateStr) return { text: 'не задана', cls: 'due-none', label: '—' };
  const dueIso = getMoscowDateKey(dateStr);
  if (!dueIso) return { text: 'не задана', cls: 'due-none', label: '—' };

  const todayIso = getMoscowTodayIso();
  const label = formatIsoDateDisplay(dueIso);
  const diffDays = diffMoscowDays(dueIso, todayIso);

  if (diffDays < 0) {
    return { text: 'просрочена', cls: 'due-over', label };
  }

  if (diffDays <= 7) {
    return {
      text:
        diffDays === 0
          ? 'сегодня'
          : `через ${diffDays} ${pluralRu(diffDays, 'день', 'дня', 'дней')}`,
      cls: 'due-soon',
      label,
    };
  }

  if (diffDays <= 30) {
    return {
      text: `через ${diffDays} ${pluralRu(diffDays, 'день', 'дня', 'дней')}`,
      cls: 'badge-accent',
      label,
    };
  }

  const months = Math.max(1, Math.round(diffDays / 30));
  return { text: `через ${months} мес.`, cls: 'due-later', label };
}

export function formatMoscowDayHeading(isoStr: string): string {
  const key = getMoscowDateKey(isoStr);
  const todayIso = getMoscowTodayIso(0);
  const tomorrowIso = getMoscowTodayIso(1);

  const datePart = formatDateRu(isoStr, { day: 'numeric', month: 'short' }).replace(/\.$/, '');
  if (key === todayIso) return `Сегодня, ${datePart}`;
  if (key === tomorrowIso) return `Завтра, ${datePart}`;

  const weekday = formatDateRu(isoStr, { weekday: 'long' });
  const capWeekday = weekday ? weekday.charAt(0).toUpperCase() + weekday.slice(1) : '';
  return `${capWeekday}, ${datePart}`;
}

export function formatMoscowShortDayLabel(isoStr: string): string {
  const key = getMoscowDateKey(isoStr);
  if (key === getMoscowTodayIso(0)) return 'сегодня';
  if (key === getMoscowTodayIso(1)) return 'завтра';
  return formatDateRu(isoStr, { day: 'numeric', month: 'short' }).replace(/\.$/, '');
}

export function formatAppointmentCountdown(isoStr: string, nowMs: number = Date.now()): string {
  const targetMs = new Date(isoStr).getTime();
  if (Number.isNaN(targetMs)) return '';

  const targetKey = getMoscowDateKey(isoStr);
  const todayKey = getMoscowDateKey(new Date(nowMs));
  const diffDays = targetKey && todayKey ? diffMoscowDays(targetKey, todayKey) : 0;

  if (diffDays <= 0) {
    const mins = Math.round((targetMs - nowMs) / 60000);
    if (mins <= 0) return mins >= -120 ? 'идёт приём' : 'завершён';
    if (mins < 60) return `через ${mins} мин`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `через ${hours} ч ${remMins} мин` : `через ${hours} ч`;
  }

  return `через ${diffDays} ${pluralRu(diffDays, 'день', 'дня', 'дней')}`;
}
