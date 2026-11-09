'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { adminApi } from '../../../api';
import {
  OverviewStatistics,
  TimelinePoint,
  VeterinarianStatistics,
  ServiceStatistics,
  SpeciesStatistics,
  StatisticsGranularity,
} from '../../../types';
import { AppShell } from '../../../components/layout/AppShell';
import { AlertCircle } from 'lucide-react';
import {
  DashboardPeriod,
  computeKpiStats,
  DatePeriodSelector,
  KpiMetricsGrid,
  TimelineChart,
  StatusDistributionIsland,
  TopVeterinariansIsland,
  TopServicesIsland,
  SpeciesDistributionIsland,
} from './_components';

/**
 * Главная страница дашборда администратора клиники.
 * Компактный оркестратор: управление фильтрами периода, загрузка аналитики и координация виджетов.
 */
export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const [stFrom, setStFrom] = useState<string>('2026-10-01');
  const [stTo, setStTo] = useState<string>('2026-10-31');
  const [metric, setMetric] = useState<'count' | 'rev'>('count');
  const [gran, setGran] = useState<StatisticsGranularity>('DAY');

  const [overview, setOverview] = useState<OverviewStatistics | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [vetsStats, setVetsStats] = useState<VeterinarianStatistics[]>([]);
  const [servicesStats, setServicesStats] = useState<ServiceStatistics[]>([]);
  const [speciesStats, setSpeciesStats] = useState<SpeciesStatistics[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load stats from backend with graceful fallback
  const loadData = useCallback(async (from: string, to: string, g: StatisticsGranularity) => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, timeRes, vetsRes, svcRes, spRes] = await Promise.all([
        adminApi.getStatisticsOverview(from, to).catch(() => null),
        adminApi.getStatisticsTimeline(g, from, to).catch(() => []),
        adminApi.getStatisticsVeterinarians(from, to).catch(() => []),
        adminApi.getStatisticsServices(from, to).catch(() => []),
        adminApi.getStatisticsSpecies(from, to).catch(() => []),
      ]);

      if (ovRes && (ovRes.totalAppointments > 0 || ovRes.revenue > 0)) {
        setOverview(ovRes);
      } else {
        setOverview(null);
      }

      setTimeline(Array.isArray(timeRes) && timeRes.length > 0 ? timeRes : []);
      setVetsStats(Array.isArray(vetsRes) && vetsRes.length > 0 ? vetsRes : []);
      setServicesStats(Array.isArray(svcRes) && svcRes.length > 0 ? svcRes : []);
      setSpeciesStats(Array.isArray(spRes) && spRes.length > 0 ? spRes : []);
    } catch (e) {
      console.error('Ошибка загрузки статистики дашборда:', e);
      setError('Не удалось загрузить данные статистики с сервера.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(stFrom, stTo, gran);
  }, [loadData, stFrom, stTo, gran]);

  // Handle period segmented buttons
  const handleSelectPeriod = (p: DashboardPeriod) => {
    setPeriod(p);
    if (p === 'week') {
      setStFrom('2026-10-26');
      setStTo('2026-11-01');
      setGran('DAY');
    } else if (p === 'month') {
      setStFrom('2026-10-01');
      setStTo('2026-10-31');
      setGran('DAY');
    } else if (p === 'quarter') {
      setStFrom('2026-10-01');
      setStTo('2026-12-31');
      setGran('WEEK');
    }
  };

  // KPI calculations with fallback to prototype design
  const stats = useMemo(() => computeKpiStats(overview), [overview]);

  return (
    <AppShell title="Дашборд" currentSection="Дашборд">
      <div className="scroll-col grow">
        {error && (
          <div className="alert alert-danger" role="alert" style={{ margin: '8px 12px 0' }}>
            <AlertCircle className="ic w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Селектор периода дат */}
        <DatePeriodSelector
          period={period}
          onSelectPeriod={handleSelectPeriod}
          stFrom={stFrom}
          stTo={stTo}
          onFromChange={(val) => {
            setStFrom(val);
            setPeriod('custom');
          }}
          onToChange={(val) => {
            setStTo(val);
            setPeriod('custom');
          }}
        />

        {/* 2. Сетка KPI-метрик (Финансы, Записи, Рост базы) */}
        <KpiMetricsGrid stats={stats} />

        {/* 3. Средний ряд: График динамики и Распределение по статусам */}
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

        {/* 4. Остров эффективности врачей */}
        <TopVeterinariansIsland vetsStats={vetsStats} />

        {/* 5. Нижний ряд: Популярные услуги и Распределение по видам */}
        <div
          className="dash-2col"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 'var(--gap)' }}
        >
          <TopServicesIsland servicesStats={servicesStats} />
          <SpeciesDistributionIsland speciesStats={speciesStats} />
        </div>
      </div>
    </AppShell>
  );
}
