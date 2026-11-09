import { Pet, Gender } from '../../../../types';

export type ArchiveFilter = 'ACTIVE' | 'ARCHIVED' | 'ALL';

export type DetailTab = 'OVERVIEW' | 'APPTS' | 'VACC';

export interface PetFormData {
  name: string;
  speciesId: string;
  gender: Gender;
  birthDate?: string;
  weightKg?: number;
  notes?: string;
}
