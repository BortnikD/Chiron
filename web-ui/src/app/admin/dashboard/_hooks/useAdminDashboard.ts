'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { adminApi } from '@/modules/admin/api';
import type {
  OverviewStatistics,
  TimelinePoint,
  VeterinarianStatistics,
  ServiceStatistics,
  SpeciesStatistics,
} from '@/modules/admin/types';
import { formatApiError, getMoscowTodayIso } from '@/shared/lib';
import type { StatisticsGranularity } from '@/shared/types';
import type { DashboardPeriod } from '../_components/types';
import { computeKpiStats } from '../_components/utils';

function getPeriodRange(p: 'week' | 'month' | 'quarter'): { from: string; to: string } {
  const todayIso = getMoscowTodayIso();
  const [y, m, d] = todayIso.split('-').map(Number);

  if (p === 'week') {
    const todayUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayIdx = (todayUtc.getUTCDay() + 6) % 7; // Mon = 0 .. Sun = 6
    const mon = new Date(Date.UTC(y, m - 1, d - dayIdx, 12, 0, 0));
    const sun = new Date(Date.UTC(y, m - 1, d - dayIdx + 6, 12, 0, 0));
    return {
      from: mon.toISOString().slice(0, 10),
      to: sun.toISOString().slice(0, 10),
    };
  }

  if (p === 'quarter') {
    const qStartMonth = Math.floor((m - 1) / 3) * 3 + 1;
    const qEndMonth = qStartMonth + 2;
    const qLastDay = new Date(Date.UTC(y, qEndMonth, 0)).getUTCDate();
    return {
      from: `${y}-${String(qStartMonth).padStart(2, '0')}-01`,
      to: `${y}-${String(qEndMonth).padStart(2, '0')}-${String(qLastDay).padStart(2, '0')}`,
    };
  }

  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    from: `${y}-${String(m).padStart(2, '0')}-01`,
    to: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function useAdminDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const [stFrom, setStFrom] = useState<string>(() => getPeriodRange('month').from);
  const [stTo, setStTo] = useState<string>(() => getPeriodRange('month').to);
  const [metric, setMetric] = useState<'count' | 'rev'>('count');
  const [gran, setGran] = useState<StatisticsGranularity>('DAY');

  const [overview, setOverview] = useState<OverviewStatistics | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [vetsStats, setVetsStats] = useState<VeterinarianStatistics[]>([]);
  const [servicesStats, setServicesStats] = useState<ServiceStatistics[]>([]);
  const [speciesStats, setSpeciesStats] = useState<SpeciesStatistics[]>([]);
  const [clientsTotal, setClientsTotal] = useState<number>(0);
  const [petsTotal, setPetsTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const loadData = useCallback(async (from: string, to: string, g: StatisticsGranularity) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const fromParam = from || undefined;
    const toParam = to || undefined;

    try {
      const [ovRes, timeRes, vetsRes, svcRes, spRes, clientsRes, petsRes] = await Promise.all([
        adminApi.getStatisticsOverview(fromParam, toParam),
        adminApi.getStatisticsTimeline(g, fromParam, toParam),
        adminApi.getStatisticsVeterinarians(fromParam, toParam),
        adminApi.getStatisticsServices(fromParam, toParam),
        adminApi.getStatisticsSpecies(fromParam, toParam),
        adminApi.getUsers(0, 1, 'CLIENT'),
        adminApi.getPets(0, 1),
      ]);

      if (reqId !== requestIdRef.current) return;

      setOverview(ovRes);
      setTimeline(Array.isArray(timeRes) ? timeRes : []);
      setVetsStats(Array.isArray(vetsRes) ? vetsRes : []);
      setServicesStats(Array.isArray(svcRes) ? svcRes : []);
      setSpeciesStats(Array.isArray(spRes) ? spRes : []);
      setClientsTotal(clientsRes?.totalElements ?? 0);
      setPetsTotal(petsRes?.totalElements ?? 0);
    } catch (err: unknown) {
      if (reqId !== requestIdRef.current) return;
      setError(formatApiError(err, 'Не удалось загрузить данные статистики с сервера.'));
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(stFrom, stTo, gran);
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadData, stFrom, stTo, gran]);

  const reload = useCallback(() => {
    loadData(stFrom, stTo, gran);
  }, [loadData, stFrom, stTo, gran]);

  const handleSelectPeriod = useCallback((p: DashboardPeriod) => {
    setPeriod(p);
    if (p === 'week') {
      const range = getPeriodRange('week');
      setStFrom(range.from);
      setStTo(range.to);
      setGran('DAY');
    } else if (p === 'month') {
      const range = getPeriodRange('month');
      setStFrom(range.from);
      setStTo(range.to);
      setGran('DAY');
    } else if (p === 'quarter') {
      const range = getPeriodRange('quarter');
      setStFrom(range.from);
      setStTo(range.to);
      setGran('WEEK');
    }
  }, []);

  const handleFromChange = useCallback((val: string) => {
    setStFrom(val);
    setPeriod('custom');
  }, []);

  const handleToChange = useCallback((val: string) => {
    setStTo(val);
    setPeriod('custom');
  }, []);

  const stats = useMemo(
    () => computeKpiStats(overview, clientsTotal, petsTotal),
    [overview, clientsTotal, petsTotal]
  );

  return {
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
  };
}
