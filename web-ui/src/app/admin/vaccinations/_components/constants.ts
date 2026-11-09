import { VaccinationStatusTone, VaccinationFormData } from './types';

export const STATUS_FILTERS: Array<{ value: VaccinationStatusTone; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'overdue', label: 'Просрочено' },
  { value: 'soon', label: 'Скоро' },
  { value: 'ok', label: 'В норме' },
];

export const VACCINATIONS_TABLE_COLS = '1.4fr 1.6fr 1fr 1fr 1fr 80px';

export const createEmptyVaccinationForm = (defaultPetId = ''): VaccinationFormData => ({
  petId: defaultPetId,
  name: '',
  administeredOn: new Date().toISOString().split('T')[0],
  nextDueOn: '',
  batchNumber: '',
  notes: '',
});
