import { formatIsoDateDisplay, getMoscowDateKey, getMoscowTodayIso } from '@/shared/lib';

function diffMoscowDays(dueIso: string, todayIso: string): number {
  const [ty, tm, td] = todayIso.split('-').map(Number);
  const [dy, dm, dd] = dueIso.split('-').map(Number);
  return Math.round((Date.UTC(dy, dm - 1, dd) - Date.UTC(ty, tm - 1, td)) / 86400000);
}

export function isVaccinationDueSoonOrOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const dueIso = getMoscowDateKey(dateStr);
  if (!dueIso) return false;
  return dueIso <= getMoscowTodayIso(30);
}

export function getDueInfo(dateStr?: string | null): { text: string; cls: string; label: string } {
  if (!dateStr) return { text: 'не задана', cls: '', label: '—' };
  const dueIso = getMoscowDateKey(dateStr);
  if (!dueIso) return { text: 'не задана', cls: '', label: '—' };

  const todayIso = getMoscowTodayIso();
  const soonLimitIso = getMoscowTodayIso(30);
  const label = formatIsoDateDisplay(dueIso);

  if (dueIso < todayIso) {
    return { text: 'просрочена', cls: 'due-over', label };
  }

  const diffDays = diffMoscowDays(dueIso, todayIso);
  if (dueIso <= soonLimitIso) {
    return {
      text: diffDays === 0 ? 'сегодня' : `через ${diffDays} дн.`,
      cls: 'due-soon',
      label,
    };
  }

  const months = Math.max(1, Math.round(diffDays / 30));
  return { text: `через ${months} мес.`, cls: 'due-later', label };
}
