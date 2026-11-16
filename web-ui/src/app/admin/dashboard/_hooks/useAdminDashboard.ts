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
  const [period, setPeriod] = useState<DashboardPeriod>(() => {
    if (typeof window === 'undefined') return 'month';
    const p = new URLSearchParams(window.location.search).get('period');
    if (p === 'week' || p === 'month' || p === 'quarter' || p === 'custom') return p;
    return 'month';
  });

  const [stFrom, setStFrom] = useState<string>(() => {
    if (typeof window === 'undefined') return getPeriodRange('month').from;
    const sp = new URLSearchParams(window.location.search);
    const fromParam = sp.get('from');
    if (fromParam) return fromParam;
    const p = sp.get('period');
    if (p === 'week' || p === 'quarter') return getPeriodRange(p).from;
    return getPeriodRange('month').from;
  });

  const [stTo, setStTo] = useState<string>(() => {
    if (typeof window === 'undefined') return getPeriodRange('month').to;
    const sp = new URLSearchParams(window.location.search);
    const toParam = sp.get('to');
    if (toParam) return toParam;
    const p = sp.get('period');
    if (p === 'week' || p === 'quarter') return getPeriodRange(p).to;
    return getPeriodRange('month').to;
  });

  const [metric, setMetric] = useState<'count' | 'rev'>(() => {
    if (typeof window === 'undefined') return 'count';
    const m = new URLSearchParams(window.location.search).get('metric');
    return m === 'rev' ? 'rev' : 'count';
  });

  const [gran, setGran] = useState<StatisticsGranularity>(() => {
    if (typeof window === 'undefined') return 'DAY';
    const g = new URLSearchParams(window.location.search).get('gran');
    if (g === 'DAY' || g === 'WEEK' || g === 'MONTH') return g;
    return 'DAY';
  });

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

  // Sync state to URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const params = url.searchParams;

    if (period !== 'month') params.set('period', period);
    else params.delete('period');

    const defRange = getPeriodRange(period === 'week' || period === 'quarter' ? period : 'month');
    if (stFrom && stFrom !== defRange.from) params.set('from', stFrom);
    else params.delete('from');

    if (stTo && stTo !== defRange.to) params.set('to', stTo);
    else params.delete('to');

    if (metric !== 'count') params.set('metric', metric);
    else params.delete('metric');

    if (gran !== 'DAY') params.set('gran', gran);
    else params.delete('gran');

    const newSearch = params.toString() ? `?${params.toString()}` : '';
    if (newSearch !== window.location.search) {
      window.history.replaceState(null, '', `${url.pathname}${newSearch}`);
    }
  }, [period, stFrom, stTo, metric, gran]);

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
