import type { GenderFilter, StatusFilter, CreatePetFormData } from './types';

export const DEFAULT_CREATE_FORM: CreatePetFormData = {
  name: '',
  ownerId: '',
  speciesId: '',
  gender: 'MALE',
  birthDate: '',
  weightKg: '',
  notes: '',
};

export const GENDER_OPTIONS: Array<{ label: string; value: GenderFilter }> = [
  { label: 'Все', value: 'ALL' },
  { label: 'Самец', value: 'MALE' },
  { label: 'Самка', value: 'FEMALE' },
];

export const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Все', value: 'ALL' },
  { label: 'Активен', value: 'ACTIVE' },
  { label: 'Архив', value: 'ARCHIVED' },
];
