import type { StatisticsGranularity } from '@/shared/types';
import type {
  TimelinePoint,
  VeterinarianStatistics,
  ServiceStatistics,
  SpeciesStatistics,
} from '@/modules/admin/types';

export type DashboardPeriod = 'week' | 'month' | 'quarter' | 'custom';

export interface DashboardKpiRate {
  label: string;
  value: string;
  count: string;
  w: string;
  color: string;
}

export interface DashboardStatusBreakdown {
  label: string;
  count: number;
  pct: string;
  color: string;
}

export interface DashboardKpiStats {
  revenue: string;
  expected: string;
  recvW: string;
  expW: string;
  recvPct: string;
  avg: string;
  doneLabel: string;
  total: number;
  completed: number;
  totalSub: string;
  rates: DashboardKpiRate[];
  newClients: number;
  newPets: number;
  clientsTotal: number;
  petsTotal: number;
  byStatus: DashboardStatusBreakdown[];
}

export interface DatePeriodSelectorProps {
  period: DashboardPeriod;
  onSelectPeriod: (p: DashboardPeriod) => void;
  stFrom: string;
  stTo: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
}

export interface KpiMetricsGridProps {
  stats: DashboardKpiStats;
}

export interface TimelineChartProps {
  timeline: TimelinePoint[];
  metric?: 'count' | 'rev';
  onMetricChange?: (metric: 'count' | 'rev') => void;
  granularity: StatisticsGranularity;
  onGranularityChange: (g: StatisticsGranularity) => void;
}

export interface StatusDistributionIslandProps {
  stats: DashboardKpiStats;
}

export interface TopVeterinariansIslandProps {
  vetsStats: VeterinarianStatistics[];
}

export interface TopServicesIslandProps {
  servicesStats: ServiceStatistics[];
}

export interface SpeciesDistributionIslandProps {
  speciesStats: SpeciesStatistics[];
}
