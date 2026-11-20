'use client';

import dynamic from 'next/dynamic';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { useAdminDashboard } from './_hooks/useAdminDashboard';
import { DatePeriodSelector } from './_components/DatePeriodSelector';
import { DashboardSkeleton } from './_components/DashboardSkeleton';
import { KpiMetricsGrid } from './_components/KpiMetricsGrid';

const TimelineChart = dynamic(
  () => import('./_components/TimelineChart').then((m) => m.TimelineChart),
  { ssr: false, loading: () => <div className="island chart-island-minh" /> }
);
const StatusDistributionIsland = dynamic(
  () => import('./_components/StatusDistributionIsland').then((m) => m.StatusDistributionIsland),
  { ssr: false, loading: () => <div className="island empty-minh-220" /> }
);
const TopVeterinariansIsland = dynamic(
  () => import('./_components/TopVeterinariansIsland').then((m) => m.TopVeterinariansIsland),
  { ssr: false, loading: () => <div className="island empty-minh-220" /> }
);
const TopServicesIsland = dynamic(
  () => import('./_components/TopServicesIsland').then((m) => m.TopServicesIsland),
  { ssr: false, loading: () => <div className="island empty-minh-220" /> }
);
const SpeciesDistributionIsland = dynamic(
  () => import('./_components/SpeciesDistributionIsland').then((m) => m.SpeciesDistributionIsland),
  { ssr: false, loading: () => <div className="island empty-minh-220" /> }
);

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
    overview,
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
        loading={loading}
      />

      {loading && !overview ? (
        <DashboardSkeleton />
      ) : (
        <div
          className="col"
          style={{
            gap: 'var(--gap)',
            opacity: loading ? 0.65 : 1,
            pointerEvents: loading ? 'none' : 'auto',
            transition: 'opacity 0.15s ease',
          }}
        >
          <KpiMetricsGrid stats={stats} />

          <div className="dash-2col">
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

          <div className="dash-2col">
            <TopServicesIsland servicesStats={servicesStats} />
            <SpeciesDistributionIsland speciesStats={speciesStats} />
          </div>
        </div>
      )}
    </div>
  );
}
