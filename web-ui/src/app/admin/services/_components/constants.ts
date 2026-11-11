import type { Service, ServiceSpecies } from '@/modules/clinic/types';

export const SERVICE_NAV_TABS = [
  { key: 'SERVICES', label: 'Услуги', href: '/admin/services?tab=services', crumb: 'Услуги' },
  {
    key: 'SPECIES',
    label: 'Виды животных',
    href: '/admin/services?tab=species',
    crumb: 'Виды животных',
  },
  {
    key: 'SPECIALIZATIONS',
    label: 'Специализации',
    href: '/admin/services?tab=specs',
    crumb: 'Специализации',
  },
] as const;

export type ServicesMainTab = (typeof SERVICE_NAV_TABS)[number]['key'];
export type ServiceActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

export const SERVICE_ACTIVE_OPTIONS: ReadonlyArray<{ value: ServiceActiveFilter; label: string }> = [
  { value: 'ALL', label: 'Все' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'INACTIVE', label: 'Отключённые' },
];

export interface SaveServiceInput {
  name: string;
  specializationId: string;
  description: string;
  basePrice: number;
  baseDurationMin: number;
  bufferAfterMin: number;
  isActive: boolean;
}

export interface ServiceEditFormState {
  name: string;
  specializationId: string;
  description: string;
  basePrice: number;
  baseDurationMin: number;
  bufferAfterMin: number;
  isActive: boolean;
}

export function resolveServicesTab(tabParam: string | null): ServicesMainTab {
  if (tabParam === 'specs' || tabParam === 'specializations') return 'SPECIALIZATIONS';
  if (tabParam === 'species') return 'SPECIES';
  return 'SERVICES';
}

export function filterAdminServices(params: {
  services: Service[];
  filterSpec: string;
  filterSpecies: string;
  filterActive: ServiceActiveFilter;
  search: string;
  serviceSpeciesMap: Record<string, ServiceSpecies[]>;
  specsMap: Record<string, string>;
}): Service[] {
  const q = params.search.trim().toLowerCase();
  return [...params.services]
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    .filter((s) => {
      if (params.filterSpec !== 'ALL' && s.specializationId !== params.filterSpec) return false;
      if (params.filterActive === 'ACTIVE' && !s.isActive) return false;
      if (params.filterActive === 'INACTIVE' && s.isActive) return false;
      if (
        params.filterSpecies !== 'ALL' &&
        !(params.serviceSpeciesMap[s.id] || []).some((l) => l.speciesId === params.filterSpecies)
      ) {
        return false;
      }
      if (q) {
        const specName = (params.specsMap[s.specializationId] || '').toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !specName.includes(q)) return false;
      }
      return true;
    });
}
