import type { Gender } from '@/shared/types';
import {
  formatIsoDateDisplay,
  getMoscowDateKey,
  getMoscowTodayIso,
  pluralRu,
} from '@/shared/lib';

export type ArchiveFilter = 'ACTIVE' | 'ARCHIVED' | 'ALL';

export type DetailTab = 'OVERVIEW' | 'APPTS' | 'VACC';

export interface PetFormData {
  name: string;
  speciesId: string;
  gender: Gender;
  birthDate?: string | null;
  weightKg?: number | null;
  notes?: string | null;
  isArchived?: boolean;
  photoFile?: File | null;
}

export function getPetVacDueInfo(dateStr?: string | null): {
  text: string;
  cls: string;
  label: string;
} {
  if (!dateStr) return { text: 'не задана', cls: 'due-none', label: '—' };
  const dueIso = getMoscowDateKey(dateStr);
  if (!dueIso) return { text: 'не задана', cls: 'due-none', label: '—' };

  const todayIso = getMoscowTodayIso();
  const label = formatIsoDateDisplay(dueIso);
  const [by, bm, bd] = todayIso.split('-').map(Number);
  const [ty, tm, td] = dueIso.split('-').map(Number);
  const diffDays = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(by, bm - 1, bd)) / 86400000);

  if (diffDays < 0) return { text: 'просрочена', cls: 'due-over', label };
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
