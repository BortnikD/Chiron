import type { Gender } from '@/shared/types';
import { getVaccinationDueInfo } from '@/shared/lib';

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
  return getVaccinationDueInfo(dateStr);
}
