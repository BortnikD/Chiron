'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { useAdminDashboard } from './_hooks/useAdminDashboard';
import { DatePeriodSelector } from './_components/DatePeriodSelector';
import { KpiMetricsGrid } from './_components/KpiMetricsGrid';
import { TimelineChart } from './_components/TimelineChart';
import { StatusDistributionIsland } from './_components/StatusDistributionIsland';
import { TopVeterinariansIsland } from './_components/TopVeterinariansIsland';
import { TopServicesIsland } from './_components/TopServicesIsland';
import { SpeciesDistributionIsland } from './_components/SpeciesDistributionIsland';

/**
 * Главная страница дашборда администратора клиники.
 */
export default function AdminDashboardPage() {
  useShellHeader({
    crumbGroup: 'Аналитика',
    crumb: 'Дашборд',
  });

  const {
    period,
    stFrom,
    stTo,
    metric,
    setMetric,
    gran,
    setGran,
    timeline,
    vetsStats,
    servicesStats,
    speciesStats,
    loading,
    error,
    reload,
    stats,
    handleSelectPeriod,
    handleFromChange,
    handleToChange,
  } = useAdminDashboard();

  return (
    <div className="scroll-col grow">
      {error && (
        <div className="alert alert-destructive" role="alert" style={{ alignItems: 'center' }}>
          <AlertCircle className="ic w-4 h-4" />
          <span className="grow">{error}</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={reload}>
            <RefreshCw className="ic w-3.5 h-3.5" />
            Повторить
          </button>
        </div>
      )}

      <DatePeriodSelector
        period={period}
        onSelectPeriod={handleSelectPeriod}
        stFrom={stFrom}
        stTo={stTo}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
      />

      {loading && (
        <div className="island" style={{ flex: 'none', padding: '12px 16px' }}>
          <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
            <span className="spinner" aria-hidden="true" />
            <span className="small muted">Загружаем статистику клиники...</span>
          </div>
        </div>
      )}

      <KpiMetricsGrid stats={stats} />

      <div
        className="dash-2col"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '8px' }}
      >
        <TimelineChart
          timeline={timeline}
          metric={metric}
          onMetricChange={setMetric}
          granularity={gran}
          onGranularityChange={setGran}
        />
        <StatusDistributionIsland stats={stats} />
      </div>

      <TopVeterinariansIsland vetsStats={vetsStats} />

      <div
        className="dash-2col"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--gap)' }}
      >
        <TopServicesIsland servicesStats={servicesStats} />
        <SpeciesDistributionIsland speciesStats={speciesStats} />
      </div>
    </div>
  );
}
