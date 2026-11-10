export const SERVICE_NAV_TABS = [
  { key: 'SERVICES', label: 'Услуги', href: '/admin/services', crumb: 'Услуги' },
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

export interface SaveServiceInput {
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
