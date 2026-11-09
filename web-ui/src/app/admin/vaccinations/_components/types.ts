import { Vaccination, Pet } from '../../../../types';

export type VaccinationStatusTone = 'all' | 'overdue' | 'soon' | 'ok';

export interface VaccinationStatusInfo {
  label: string;
  cls: string;
  tone: 'overdue' | 'soon' | 'ok';
}

export interface VaccinationFormData {
  petId: string;
  name: string;
  administeredOn: string;
  nextDueOn: string;
  batchNumber: string;
  notes: string;
}

export type { Vaccination, Pet };
