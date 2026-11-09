import { AvailableSlotResponse } from '../../../../types';

export interface StepItem {
  n: number;
  label: string;
}

export const DEFAULT_BOOKING_STEPS: StepItem[] = [
  { n: 1, label: 'Кого' },
  { n: 2, label: 'Услуга' },
  { n: 3, label: 'Врач и время' },
  { n: 4, label: 'Готово' },
];

export const SPEC_TONES: Record<string, string> = {
  '5eed0002-0000-0000-0000-000000000001': 'ther',
  '5eed0002-0000-0000-0000-000000000002': 'surg',
  '5eed0002-0000-0000-0000-000000000003': 'dent',
  '5eed0002-0000-0000-0000-000000000004': 'derm',
  '5eed0002-0000-0000-0000-000000000005': 'opht',
  '5eed0002-0000-0000-0000-000000000006': 'prev',
};

export const DAY_NAMES_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const MONTHS_RU = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export interface GroupedDaySlots {
  dateLabel: string;
  dow: string;
  note: string;
  slots: AvailableSlotResponse[];
}

export function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}

export function getPetSpeciesTone(speciesName?: string): 'cat' | 'dog' | 'rab' | 'par' {
  if (!speciesName) return 'cat';
  const lower = speciesName.toLowerCase();
  if (lower.includes('соб') || lower.includes('dog')) return 'dog';
  if (lower.includes('крол')) return 'rab';
  if (lower.includes('попуг') || lower.includes('птиц')) return 'par';
  return 'cat';
}
