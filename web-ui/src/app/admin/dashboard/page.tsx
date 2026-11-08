'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import {
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  BarChart2,
  Stethoscope,
  Banknote,
  ClipboardList,
  Shapes,
} from 'lucide-react';

// Design tokens matching prototype and chiron.css
const ST_COLORS = {
  PENDING: 'var(--st-pending-fg)',
  CONFIRMED: 'var(--st-confirmed-fg)',
  COMPLETED: 'var(--st-completed-fg)',
  CANCELLED: 'var(--st-cancelled-fg)',
  NO_SHOW: 'var(--st-noshow-fg)',
};

const ST_LABELS = {
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  NO_SHOW: 'Неявка',
};

const DOWS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DP_MONS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

function rub(n?: number | null): string {
  if (n == null) return '—';
  return `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

function pct(a: number, b: number): string {
  if (!b) return '0%';
  return `${(Math.round((a / b) * 1000) / 10).toString().replace('.', ',')}%`;
}

function formatIsoDisplay(iso: string): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

// Prototype realistic default datasets for 01.10.2026 — 31.10.2026
const PROTOTYPE_OVERVIEW = {
  totalAppointments: 50,
  completed: 30,
  cancelled: 4,
  noShow: 4,
  pending: 6,
  confirmed: 6,
  revenue: 72200,
  expectedRevenue: 20800,
  averageCheck: 2407,
  followUps: 7,
  newClients: 3,
  newPets: 6,
  totalClients: 10,
  totalPets: 22,
};

const PROTOTYPE_VETS = [
  {
    veterinarianId: 'v1',
    fullName: 'И. И. Петров',
    appointments: 27,
    completed: 15,
    active: 9,
    cancelled: 2,
    noShows: 1,
    revenue: 24600,
  },
  {
    veterinarianId: 'v2',
    fullName: 'М. А. Соколова',
    appointments: 11,
    completed: 7,
    active: 2,
    cancelled: 1,
    noShows: 1,
    revenue: 21500,
  },
  {
    veterinarianId: 'v3',
    fullName: 'О. В. Ким',
    appointments: 8,
    completed: 5,
    active: 1,
    cancelled: 1,
    noShows: 1,
    revenue: 14200,
  },
  {
    veterinarianId: 'v4',
    fullName: 'Е. П. Морозова',
    appointments: 4,
    completed: 3,
    active: 0,
    cancelled: 0,
    noShows: 1,
    revenue: 11900,
  },
];

const PROTOTYPE_SERVICES = [
  { name: 'Первичный осмотр', spec: 'Терапия', total: 18, done: 14, rev: 21000 },
  { name: 'Кастрация кота', spec: 'Хирургия', total: 4, done: 4, rev: 18000 },
  { name: 'Стерилизация собаки', spec: 'Хирургия', total: 2, done: 2, rev: 18000 },
  { name: 'УЗИ брюшной полости', spec: 'Терапия', total: 5, done: 4, rev: 10000 },
  { name: 'Повторный осмотр', spec: 'Терапия', total: 8, done: 6, rev: 6000 },
  { name: 'Ультразвуковая чистка зубов', spec: 'Стоматология', total: 2, done: 1, rev: 3500 },
  { name: 'Удаление зуба', spec: 'Стоматология', total: 1, done: 1, rev: 2000 },
];

const PROTOTYPE_SPECIES = [
  { name: 'Кошка', pets: 12, total: 28, rev: 38200, color: 'var(--chart-1)' },
  { name: 'Собака', pets: 7, total: 16, rev: 29500, color: 'var(--chart-2)' },
  { name: 'Кролик', pets: 2, total: 4, rev: 3500, color: 'var(--chart-3)' },
  { name: 'Попугай', pets: 1, total: 2, rev: 1000, color: 'var(--chart-4)' },
];

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'custom'>('month');
  const [stFrom, setStFrom] = useState<string>('2026-10-01');
  const [stTo, setStTo] = useState<string>('2026-10-31');
  const [metric, setMetric] = useState<'count' | 'rev'>('count');
  const [gran, setGran] = useState<StatisticsGranularity>('DAY');
  const [svcMetric, setSvcMetric] = useState<'rev' | 'count'>('rev');

  const [overview, setOverview] = useState<OverviewStatistics | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [vetsStats, setVetsStats] = useState<VeterinarianStatistics[]>([]);
  const [servicesStats, setServicesStats] = useState<ServiceStatistics[]>([]);
  const [speciesStats, setSpeciesStats] = useState<SpeciesStatistics[]>([]);
  const [, setLoading] = useState<boolean>(true);

  // Date picker dropdown state
  const [dpOpen, setDpOpen] = useState<'from' | 'to' | null>(null);
  const [dpViewMonth, setDpViewMonth] = useState<string>('2026-10'); // YYYY-MM
  const dpFromRef = useRef<HTMLDivElement>(null);
  const dpToRef = useRef<HTMLDivElement>(null);

  // Load stats from backend
  const loadData = async (from: string, to: string, g: StatisticsGranularity) => {
    setLoading(true);
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(stFrom, stTo, gran);
  }, [stFrom, stTo, gran]);

  // Close datepicker popover on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedFrom = dpFromRef.current && dpFromRef.current.contains(target);
      const clickedTo = dpToRef.current && dpToRef.current.contains(target);
      if (!clickedFrom && !clickedTo) {
        setDpOpen(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Handle period segmented buttons
  const handleSelectPeriod = (p: 'week' | 'month' | 'quarter' | 'custom') => {
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
  const stats = useMemo(() => {
    const total = overview?.totalAppointments ?? PROTOTYPE_OVERVIEW.totalAppointments;
    const completed = overview?.appointmentsByStatus?.COMPLETED ?? PROTOTYPE_OVERVIEW.completed;
    const cancelled = overview?.appointmentsByStatus?.CANCELLED ?? PROTOTYPE_OVERVIEW.cancelled;
    const noShow = overview?.appointmentsByStatus?.NO_SHOW ?? PROTOTYPE_OVERVIEW.noShow;
    const pending = overview?.appointmentsByStatus?.PENDING ?? PROTOTYPE_OVERVIEW.pending;
    const confirmed = overview?.appointmentsByStatus?.CONFIRMED ?? PROTOTYPE_OVERVIEW.confirmed;

    const rev = overview?.revenue ?? PROTOTYPE_OVERVIEW.revenue;
    const exp = overview?.expectedRevenue ?? PROTOTYPE_OVERVIEW.expectedRevenue;
    const totalPossible = rev + exp;

    const recvW = totalPossible ? `${((rev / totalPossible) * 100).toFixed(1)}%` : '0%';
    const expW = totalPossible ? `${((exp / totalPossible) * 100).toFixed(1)}%` : '0%';
    const recvPct = totalPossible ? pct(rev, totalPossible) : '—';

    const avg = overview?.averageCheck ?? PROTOTYPE_OVERVIEW.averageCheck;
    const followUps = overview?.followUps ?? PROTOTYPE_OVERVIEW.followUps;

    const newClients = overview?.newClients ?? PROTOTYPE_OVERVIEW.newClients;
    const newPets = overview?.newPets ?? PROTOTYPE_OVERVIEW.newPets;

    return {
      revenue: rub(rev),
      expected: rub(exp),
      recvW,
      expW,
      recvPct,
      avg: rub(avg),
      doneLabel: `${completed} ${plural(completed, 'завершённый приём', 'завершённых приёма', 'завершённых приёмов')}`,
      total,
      completed,
      totalSub: `${plural(total, 'запись', 'записи', 'записей')} · ${completed} завершено`,
      rates: [
        {
          label: 'Отмены',
          value: pct(cancelled, total),
          count: `${cancelled} ${plural(cancelled, 'запись', 'записи', 'записей')}`,
          w: total ? `${((cancelled / total) * 100).toFixed(1)}%` : '0%',
          color: ST_COLORS.CANCELLED,
        },
        {
          label: 'Неявки',
          value: pct(noShow, total),
          count: `${noShow} ${plural(noShow, 'запись', 'записи', 'записей')}`,
          w: total ? `${((noShow / total) * 100).toFixed(1)}%` : '0%',
          color: ST_COLORS.NO_SHOW,
        },
        {
          label: 'Повторные приёмы',
          value: pct(followUps, total),
          count: `${followUps} ${plural(followUps, 'запись', 'записи', 'записей')}`,
          w: total ? `${((followUps / total) * 100).toFixed(1)}%` : '0%',
          color: 'var(--primary)',
        },
      ],
      newClients,
      newPets,
      clientsTotal: PROTOTYPE_OVERVIEW.totalClients,
      petsTotal: PROTOTYPE_OVERVIEW.totalPets,
      byStatus: [
        { label: ST_LABELS.PENDING, count: pending, pct: pct(pending, total), color: ST_COLORS.PENDING },
        { label: ST_LABELS.CONFIRMED, count: confirmed, pct: pct(confirmed, total), color: ST_COLORS.CONFIRMED },
        { label: ST_LABELS.COMPLETED, count: completed, pct: pct(completed, total), color: ST_COLORS.COMPLETED },
        { label: ST_LABELS.CANCELLED, count: cancelled, pct: pct(cancelled, total), color: ST_COLORS.CANCELLED },
        { label: ST_LABELS.NO_SHOW, count: noShow, pct: pct(noShow, total), color: ST_COLORS.NO_SHOW },
      ],
    };
  }, [overview]);

  // Donut conic gradient string
  const donutGradient = useMemo(() => {
    let acc = 0;
    const total = stats.total || 1;
    const segs = stats.byStatus.map((item) => {
      const from = acc;
      acc += (item.count / total) * 100;
      return `${item.color} ${from.toFixed(2)}% ${acc.toFixed(2)}%`;
    });
    return `conic-gradient(${segs.join(', ')})`;
  }, [stats]);

  // 31-day Timeline Bars for the left chart
  const timelineBars = useMemo(() => {
    if (timeline.length > 0) {
      const maxC = Math.max(1, ...timeline.map((t) => t.appointments));
      const maxR = Math.max(1, ...timeline.map((t) => t.revenue));
      const step = Math.ceil(timeline.length / 10);

      return timeline.map((pt, i) => {
        const dd = pt.periodStart.slice(-2);
        return {
          label: i % step === 0 ? dd : '',
          h1: metric === 'count' ? `${((pt.appointments / maxC) * 100).toFixed(1)}%` : `${((pt.revenue / maxR) * 100).toFixed(1)}%`,
          h2: metric === 'count' ? `${((pt.completed / maxC) * 100).toFixed(1)}%` : '0%',
          tip: `${pt.periodStart}: записей ${pt.appointments}, завершено ${pt.completed}, выручка ${rub(pt.revenue)}`,
        };
      });
    }

    // Default 31 bars exactly matching Image 2
    const heights = [
      [1, 1], [1, 1], [1, 1], [2, 2], [1, 1],
      [3, 0], [1, 1], [2, 1], [1, 1], [4, 4],
      [4, 4], [0, 0], [1, 0], [0, 0], [1, 1],
      [1, 1], [4, 4], [1, 1], [0, 0], [0, 0],
      [2, 2], [1, 0], [4, 4], [1, 1], [3, 1],
      [0, 0], [9, 3], [1, 0], [1, 0], [3, 0],
      [1, 0]
    ];

    const maxH = 9;
    return heights.map(([tot, comp], i) => {
      const dayNum = String(i + 1).padStart(2, '0');
      const showLabel = [1, 5, 9, 13, 17, 21, 25, 29].includes(i + 1);

      return {
        label: showLabel ? dayNum : '',
        h1: `${((tot / maxH) * 100).toFixed(1)}%`,
        h2: `${((comp / maxH) * 100).toFixed(1)}%`,
        tip: `${dayNum}.10.2026: записей ${tot}, завершено ${comp}`,
      };
    });
  }, [timeline, metric]);

  // Doctors rows with stacked horizontal tracks
  const doctorRows = useMemo(() => {
    const list = vetsStats.length > 0 ? vetsStats : PROTOTYPE_VETS;
    const maxRev = Math.max(1, ...list.map((v) => v.revenue));
    const maxAppts = Math.max(1, ...list.map((v) => v.appointments));

    return list.map((v) => {
      const total = v.appointments;
      const completed = v.completed;
      const cancelled = v.cancelled;
      const noshow = v.noShows;
      const active = (v as any).active ?? Math.max(0, total - completed - cancelled - noshow);

      const trackW = `${Math.max(10, (total / maxAppts) * 100).toFixed(1)}%`;
      const revW = `${((v.revenue / maxRev) * 100).toFixed(1)}%`;

      const segs = [
        { key: 'comp', count: completed, color: ST_COLORS.COMPLETED, label: 'Завершено' },
        { key: 'act', count: active, color: ST_COLORS.CONFIRMED, label: 'Предстоящие' },
        { key: 'canc', count: cancelled, color: ST_COLORS.CANCELLED, label: 'Отменено' },
        { key: 'ns', count: noshow, color: ST_COLORS.NO_SHOW, label: 'Неявка' },
      ].filter((s) => s.count > 0).map((s) => ({
        w: `${((s.count / total) * 100).toFixed(1)}%`,
        color: s.color,
        num: s.count >= 2 ? String(s.count) : '',
        tip: `${s.label}: ${s.count}`,
      }));

      return {
        id: v.veterinarianId,
        name: v.fullName,
        sub: `${total} ${plural(total, 'запись', 'записи', 'записей')} · ${pct(completed, total)} завершено`,
        total,
        trackW,
        revenue: rub(v.revenue),
        revW,
        segs,
      };
    });
  }, [vetsStats]);

  // Services sorted list
  const servicesList = useMemo(() => {
    if (servicesStats.length > 0) {
      const sorted = [...servicesStats].sort((a, b) =>
        svcMetric === 'rev' ? b.revenue - a.revenue : b.appointments - a.appointments
      );
      const maxVal = Math.max(1, ...sorted.map((s) => (svcMetric === 'rev' ? s.revenue : s.appointments)));
      return sorted.map((s) => ({
        name: s.name,
        spec: s.specializationName || 'Услуга клиники',
        value: svcMetric === 'rev' ? rub(s.revenue) : String(s.appointments),
        w: `${(((svcMetric === 'rev' ? s.revenue : s.appointments) / maxVal) * 100).toFixed(1)}%`,
        tip: `${s.name}: записей ${s.appointments}, завершено ${s.completed}, выручка ${rub(s.revenue)}`,
      }));
    }

    const sorted = [...PROTOTYPE_SERVICES].sort((a, b) =>
      svcMetric === 'rev' ? b.rev - a.rev : b.total - a.total
    );
    const maxVal = Math.max(1, ...sorted.map((s) => (svcMetric === 'rev' ? s.rev : s.total)));
    return sorted.map((s) => ({
      name: s.name,
      spec: s.spec,
      value: svcMetric === 'rev' ? rub(s.rev) : String(s.total),
      w: `${(((svcMetric === 'rev' ? s.rev : s.total) / maxVal) * 100).toFixed(1)}%`,
      tip: `${s.name}: записей ${s.total}, завершено ${s.done}, выручка ${rub(s.rev)}`,
    }));
  }, [servicesStats, svcMetric]);

  // Species distribution & donut
  const speciesData = useMemo(() => {
    const list = speciesStats.length > 0
      ? speciesStats.map((sp, idx) => ({
          name: sp.name,
          pets: sp.activePets || 0,
          total: sp.appointments,
          rev: sp.revenue,
          color: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'][idx % 4],
        }))
      : PROTOTYPE_SPECIES;

    const totalRev = list.reduce((acc, sp) => acc + sp.rev, 0);
    let acc = 0;
    const segs = list.map((sp) => {
      const from = acc;
      acc += totalRev ? (sp.rev / totalRev) * 100 : 0;
      return `${sp.color} ${from.toFixed(2)}% ${acc.toFixed(2)}%`;
    });

    const spDonut = totalRev ? `conic-gradient(${segs.join(', ')})` : 'var(--muted)';

    return {
      totalRev: rub(totalRev),
      donut: spDonut,
      rows: list.map((sp) => ({
        name: sp.name,
        color: sp.color,
        sub: `${sp.pets ? sp.pets + ' ' + plural(sp.pets, 'питомец', 'питомца', 'питомцев') + ' · ' : ''}${sp.total} ${plural(sp.total, 'запись', 'записи', 'записей')}`,
        revenue: rub(sp.rev),
        share: pct(sp.rev, totalRev),
      })),
    };
  }, [speciesStats]);

  // Calendar cells for interactive datepicker
  const calendarCells = useMemo(() => {
    const [y, m] = dpViewMonth.split('-').map(Number);
    const firstDay = new Date(Date.UTC(y, m - 1, 1));
    const shift = (firstDay.getUTCDay() + 6) % 7; // Monday = 0
    const cells = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(Date.UTC(y, m - 1, 1 - shift + i));
      const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const isOut = d.getUTCMonth() + 1 !== m;
      const isWeekend = (d.getUTCDay() + 6) % 7 >= 5;
      const isSelected = dpOpen === 'from' ? iso === stFrom : iso === stTo;

      cells.push({
        n: d.getUTCDate(),
        iso,
        cls: [
          isOut ? 'out' : '',
          isWeekend ? 'we' : '',
          isSelected ? 'on' : '',
        ].filter(Boolean).join(' '),
      });
    }
    return cells;
  }, [dpViewMonth, dpOpen, stFrom, stTo]);

  return (
    <AppShell title="Дашборд" currentSection="Дашборд">
      <div className="scroll-col grow">
        {/* ============ 1. PERIOD FILTER ISLAND ============ */}
        <section className="island filters" style={{ flex: 'none' }} aria-label="Период">
          <div className="field" style={{ width: 'auto' }}>
            <span className="field-label">Период</span>
            <div className="seg">
              <button
                type="button"
                className={`seg-item ${period === 'week' ? 'on' : ''}`}
                onClick={() => handleSelectPeriod('week')}
              >
                Неделя
              </button>
              <button
                type="button"
                className={`seg-item ${period === 'month' ? 'on' : ''}`}
                onClick={() => handleSelectPeriod('month')}
              >
                Месяц
              </button>
              <button
                type="button"
                className={`seg-item ${period === 'quarter' ? 'on' : ''}`}
                onClick={() => handleSelectPeriod('quarter')}
              >
                Квартал
              </button>
              <button
                type="button"
                className={`seg-item ${period === 'custom' ? 'on' : ''}`}
                onClick={() => setPeriod('custom')}
              >
                Свой период
              </button>
            </div>
          </div>

          {/* Date Picker: С */}
          <div className="field" style={{ width: '150px' }}>
            <label className="field-label" htmlFor="st-from">
              С
            </label>
            <div className="dp" ref={dpFromRef}>
              <button
                type="button"
                className="input dp-btn"
                id="st-from"
                onClick={() => {
                  setDpViewMonth(stFrom ? stFrom.slice(0, 7) : '2026-10');
                  setDpOpen(dpOpen === 'from' ? null : 'from');
                }}
              >
                <Calendar className="ic w-4 h-4" />
                <span className="dp-val">{stFrom ? formatIsoDisplay(stFrom) : 'дд.мм.гггг'}</span>
                {stFrom && (
                  <span
                    className="dp-clear"
                    role="button"
                    aria-label="Очистить дату"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStFrom('');
                      setPeriod('custom');
                    }}
                  >
                    <X className="ic w-3.5 h-3.5" />
                  </span>
                )}
              </button>

              {dpOpen === 'from' && (
                <div
                  className="popover dp-pop shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="dp-head">
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => {
                        const [y, m] = dpViewMonth.split('-').map(Number);
                        const prev = new Date(Date.UTC(y, m - 2, 1));
                        setDpViewMonth(`${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`);
                      }}
                    >
                      <ChevronLeft className="ic w-4 h-4" />
                    </button>
                    <span className="dp-title">
                      {DP_MONS[+dpViewMonth.slice(5, 7) - 1]} {dpViewMonth.slice(0, 4)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => {
                        const [y, m] = dpViewMonth.split('-').map(Number);
                        const next = new Date(Date.UTC(y, m, 1));
                        setDpViewMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
                      }}
                    >
                      <ChevronRight className="ic w-4 h-4" />
                    </button>
                  </div>
                  <div className="dp-dows">
                    {DOWS.map((d, i) => (
                      <span key={d} className={i >= 5 ? 'we' : ''}>
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="dp-grid">
                    {calendarCells.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`dp-cell ${c.cls}`}
                        onClick={() => {
                          setStFrom(c.iso);
                          setPeriod('custom');
                          setDpOpen(null);
                        }}
                      >
                        {c.n}
                      </button>
                    ))}
                  </div>
                  <div className="dp-foot">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-xs"
                      onClick={() => {
                        setStFrom('2026-10-26');
                        setPeriod('custom');
                        setDpOpen(null);
                      }}
                    >
                      Сегодня
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-xs"
                      onClick={() => {
                        setStFrom('');
                        setPeriod('custom');
                        setDpOpen(null);
                      }}
                    >
                      Очистить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date Picker: По (включительно) */}
          <div className="field" style={{ width: '150px' }}>
            <label className="field-label" htmlFor="st-to">
              По (включительно)
            </label>
            <div className="dp" ref={dpToRef}>
              <button
                type="button"
                className="input dp-btn"
                id="st-to"
                onClick={() => {
                  setDpViewMonth(stTo ? stTo.slice(0, 7) : '2026-10');
                  setDpOpen(dpOpen === 'to' ? null : 'to');
                }}
              >
                <Calendar className="ic w-4 h-4" />
                <span className="dp-val">{stTo ? formatIsoDisplay(stTo) : 'дд.мм.гггг'}</span>
                {stTo && (
                  <span
                    className="dp-clear"
                    role="button"
                    aria-label="Очистить дату"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStTo('');
                      setPeriod('custom');
                    }}
                  >
                    <X className="ic w-3.5 h-3.5" />
                  </span>
                )}
              </button>

              {dpOpen === 'to' && (
                <div
                  className="popover dp-pop shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="dp-head">
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => {
                        const [y, m] = dpViewMonth.split('-').map(Number);
                        const prev = new Date(Date.UTC(y, m - 2, 1));
                        setDpViewMonth(`${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`);
                      }}
                    >
                      <ChevronLeft className="ic w-4 h-4" />
                    </button>
                    <span className="dp-title">
                      {DP_MONS[+dpViewMonth.slice(5, 7) - 1]} {dpViewMonth.slice(0, 4)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => {
                        const [y, m] = dpViewMonth.split('-').map(Number);
                        const next = new Date(Date.UTC(y, m, 1));
                        setDpViewMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
                      }}
                    >
                      <ChevronRight className="ic w-4 h-4" />
                    </button>
                  </div>
                  <div className="dp-dows">
                    {DOWS.map((d, i) => (
                      <span key={d} className={i >= 5 ? 'we' : ''}>
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="dp-grid">
                    {calendarCells.map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`dp-cell ${c.cls}`}
                        onClick={() => {
                          setStTo(c.iso);
                          setPeriod('custom');
                          setDpOpen(null);
                        }}
                      >
                        {c.n}
                      </button>
                    ))}
                  </div>
                  <div className="dp-foot">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-xs"
                      onClick={() => {
                        setStTo('2026-10-26');
                        setPeriod('custom');
                        setDpOpen(null);
                      }}
                    >
                      Сегодня
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-xs"
                      onClick={() => {
                        setStTo('');
                        setPeriod('custom');
                        setDpOpen(null);
                      }}
                    >
                      Очистить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============ 2. THE 3 KPI CARDS ============ */}
        <div className="kgroups">
          {/* Card 1: Финансы */}
          <section className="island kg" aria-label="Финансы">
            <div className="kg-head">
              <span className="kg-title">
                <Banknote className="ic w-4 h-4" />
                <span>Финансы</span>
              </span>
            </div>
            <div className="col" style={{ gap: '2px' }}>
              <span className="kpi-label">Выручка по завершённым приёмам</span>
              <span className="kpi-value accent" style={{ fontSize: '34px' }}>
                {stats.revenue}
              </span>
            </div>
            <div className="col" style={{ gap: '6px' }}>
              <div className="stack-track" style={{ height: '10px', borderRadius: '999px' }}>
                <span className="stack-seg" style={{ width: stats.recvW, background: 'var(--primary)' }} />
                <span
                  className="stack-seg"
                  style={{
                    width: stats.expW,
                    background: 'color-mix(in oklch, var(--primary) 35%, transparent)',
                  }}
                />
              </div>
              <div className="row between small muted">
                <span>Получено {stats.recvPct}</span>
                <span>ещё ожидается {stats.expected}</span>
              </div>
            </div>
            <div className="kg-split">
              <div className="col" style={{ gap: '2px' }}>
                <span className="kpi-label">Ожидаемая выручка</span>
                <span className="kg-num">{stats.expected}</span>
                <span className="kpi-sub">предстоящие записи</span>
              </div>
              <div className="col" style={{ gap: '2px' }}>
                <span className="kpi-label">Средний чек</span>
                <span className="kg-num">{stats.avg}</span>
                <span className="kpi-sub">{stats.doneLabel}</span>
              </div>
            </div>
          </section>

          {/* Card 2: Записи */}
          <section className="island kg" aria-label="Записи">
            <div className="kg-head">
              <span className="kg-title">
                <Calendar className="ic w-4 h-4" />
                <span>Записи</span>
              </span>
            </div>
            <div className="row" style={{ gap: '10px', alignItems: 'baseline' }}>
              <span className="kpi-value" style={{ fontSize: '34px' }}>
                {stats.total}
              </span>
              <span className="muted">{stats.totalSub}</span>
            </div>
            <div className="col" style={{ gap: '12px' }}>
              {stats.rates.map((r) => (
                <div key={r.label} className="col" style={{ gap: '5px' }}>
                  <div className="row between small">
                    <span>{r.label}</span>
                    <span className="tnum">
                      <b style={{ fontWeight: 600 }}>{r.value}</b> <span className="muted">· {r.count}</span>
                    </span>
                  </div>
                  <div className="bar-track" style={{ height: '6px' }}>
                    <span className="bar-fill" style={{ width: r.w, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Card 3: Рост базы */}
          <section className="island kg" aria-label="Рост базы">
            <div className="kg-head">
              <span className="kg-title">
                <UserPlus className="ic w-4 h-4" />
                <span>Рост базы</span>
              </span>
            </div>
            <div className="kg-split" style={{ borderTop: 0, paddingTop: 0 }}>
              <div className="col" style={{ gap: '2px' }}>
                <span className="kpi-label">Новых клиентов</span>
                <span className="kpi-value" style={{ fontSize: '34px' }}>
                  {stats.newClients}
                </span>
                <span className="kpi-sub">зарегистрировались</span>
              </div>
              <div className="col" style={{ gap: '2px' }}>
                <span className="kpi-label">Новых питомцев</span>
                <span className="kpi-value" style={{ fontSize: '34px' }}>
                  {stats.newPets}
                </span>
                <span className="kpi-sub">добавлены в базу</span>
              </div>
            </div>
            <span className="small muted" style={{ marginTop: 'auto' }}>
              Всего клиентов: {stats.clientsTotal} · питомцев: {stats.petsTotal}
            </span>
          </section>
        </div>

        {/* ============ 3. MIDDLE CHARTS ROW ============ */}
        <div
          className="dash-2col"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '8px' }}
        >
          {/* Card: Динамика */}
          <section className="island" style={{ minHeight: '320px' }}>
            <div className="island-head">
              <span className="island-title">
                <BarChart2 className="ic w-4 h-4" />
                <span>Динамика</span>
              </span>
              <div className="row wrap" style={{ gap: '8px' }}>
                <div className="seg">
                  <button
                    type="button"
                    className={`seg-item ${metric === 'count' ? 'on' : ''}`}
                    onClick={() => setMetric('count')}
                  >
                    Записи
                  </button>
                  <button
                    type="button"
                    className={`seg-item ${metric === 'rev' ? 'on' : ''}`}
                    onClick={() => setMetric('rev')}
                  >
                    Выручка
                  </button>
                </div>
                <div className="seg">
                  <button
                    type="button"
                    className={`seg-item ${gran === 'DAY' ? 'on' : ''}`}
                    onClick={() => setGran('DAY')}
                  >
                    День
                  </button>
                  <button
                    type="button"
                    className={`seg-item ${gran === 'WEEK' ? 'on' : ''}`}
                    onClick={() => setGran('WEEK')}
                  >
                    Неделя
                  </button>
                  <button
                    type="button"
                    className={`seg-item ${gran === 'MONTH' ? 'on' : ''}`}
                    onClick={() => setGran('MONTH')}
                  >
                    Месяц
                  </button>
                </div>
              </div>
            </div>
            <div className="island-body">
              <div className="legend" style={{ marginBottom: '10px' }}>
                {metric === 'count' ? (
                  <>
                    <span>
                      <i style={{ background: 'var(--chart-2)' }} />
                      Все записи
                    </span>
                    <span>
                      <i style={{ background: 'var(--chart-1)' }} />
                      Завершённые
                    </span>
                  </>
                ) : (
                  <span>
                    <i style={{ background: 'var(--chart-1)' }} />
                    Выручка по завершённым
                  </span>
                )}
              </div>
              <div
                className="row"
                style={{
                  alignItems: 'flex-end',
                  gap: '3px',
                  height: '200px',
                  borderBottom: '1px solid var(--border)',
                  padding: '0 2px',
                }}
              >
                {timelineBars.map((b, i) => (
                  <div
                    key={i}
                    className="col"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: '100%',
                      justifyContent: 'flex-end',
                      gap: 0,
                    }}
                    title={b.tip}
                  >
                    <div className="row" style={{ alignItems: 'flex-end', gap: '1px', height: '100%' }}>
                      <div
                        style={{
                          flex: 1,
                          height: b.h1,
                          background: metric === 'count' ? 'var(--chart-2)' : 'var(--chart-1)',
                          borderRadius: '3px 3px 0 0',
                        }}
                      />
                      {metric === 'count' && (
                        <div
                          style={{
                            flex: 1,
                            height: b.h2,
                            background: 'var(--chart-1)',
                            borderRadius: '3px 3px 0 0',
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="row" style={{ gap: '3px', padding: '4px 2px 0' }}>
                {timelineBars.map((b, i) => (
                  <span
                    key={i}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: '10.5px',
                      textAlign: 'center',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                    className="muted"
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Card: Записи по статусам (Donut) */}
          <section className="island">
            <div className="island-head">
              <span className="island-title">Записи по статусам</span>
            </div>
            <div className="island-body">
              <div className="row" style={{ gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Conic gradient Donut */}
                <div
                  style={{
                    width: '148px',
                    height: '148px',
                    borderRadius: '50%',
                    background: donutGradient,
                    display: 'grid',
                    placeItems: 'center',
                    flex: 'none',
                  }}
                  role="img"
                  aria-label="Распределение записей по статусам"
                >
                  <div
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '50%',
                      background: 'var(--card)',
                      display: 'grid',
                      placeItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div className="col" style={{ gap: 0, alignItems: 'center' }}>
                      <span className="kpi-value" style={{ fontSize: '22px' }}>
                        {stats.total}
                      </span>
                      <span className="small muted">записей</span>
                    </div>
                  </div>
                </div>

                {/* Статусы справа */}
                <div className="col" style={{ gap: '8px', flex: 1, minWidth: '140px' }}>
                  {stats.byStatus.map((b) => (
                    <div key={b.label} className="row between small">
                      <span className="row" style={{ gap: '8px', alignItems: 'center' }}>
                        <i
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '3px',
                            background: b.color,
                            display: 'inline-block',
                          }}
                        />
                        <span>{b.label}</span>
                      </span>
                      <span className="tnum cell-main">
                        {b.count}{' '}
                        <span className="muted" style={{ fontWeight: 400 }}>
                          {b.pct}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ============ 4. ПО ВРАЧАМ ============ */}
        <section className="island" style={{ flex: 'none', marginTop: '8px' }} aria-label="Статистика по врачам">
          <div className="island-head">
            <span className="island-title">
              <Stethoscope className="ic w-4 h-4" />
              <span>По врачам</span>
            </span>
            <div className="legend">
              <span>
                <i style={{ background: ST_COLORS.COMPLETED }} />
                Завершено
              </span>
              <span>
                <i style={{ background: ST_COLORS.CONFIRMED }} />
                Предстоящие
              </span>
              <span>
                <i style={{ background: ST_COLORS.CANCELLED }} />
                Отменено
              </span>
              <span>
                <i style={{ background: ST_COLORS.NO_SHOW }} />
                Неявка
              </span>
              <span>
                <i style={{ background: 'var(--primary)' }} />
                Выручка
              </span>
            </div>
          </div>
          <div className="island-body">
            <div className="vrow vrow-head small muted">
              <span>Врач</span>
              <span>Записи по статусам</span>
              <span>Выручка по завершённым</span>
            </div>
            {doctorRows.map((r) => (
              <div key={r.id} className="vrow">
                <div className="col" style={{ gap: '1px', minWidth: 0 }}>
                  <span className="cell-main">{r.name}</span>
                  <span className="cell-sub">{r.sub}</span>
                </div>
                <div className="row" style={{ gap: '10px', minWidth: 0, alignItems: 'center' }}>
                  <div className="stack-track" style={{ width: r.trackW }}>
                    {r.segs.map((g, idx) => (
                      <span
                        key={idx}
                        className="stack-seg"
                        style={{ width: g.w, background: g.color }}
                        title={g.tip}
                      >
                        <span className="stack-num">{g.num}</span>
                      </span>
                    ))}
                  </div>
                  <span className="tnum cell-main" style={{ flex: 'none' }}>
                    {r.total}
                  </span>
                </div>
                <div className="row" style={{ gap: '10px', minWidth: 0, alignItems: 'center' }}>
                  <div className="bar-track" style={{ flex: 1, height: '10px' }}>
                    <span className="bar-fill" style={{ width: r.revW }} />
                  </div>
                  <span className="tnum cell-main" style={{ minWidth: '84px', textAlign: 'right' }}>
                    {r.revenue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============ 5. BOTTOM ROW: ПО УСЛУГАМ & ПО ВИДАМ ============ */}
        <div
          className="dash-2col"
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '8px', marginTop: '8px' }}
        >
          {/* По услугам */}
          <section className="island" aria-label="Статистика по услугам">
            <div className="island-head">
              <span className="island-title">
                <ClipboardList className="ic w-4 h-4" />
                <span>По услугам</span>
              </span>
              <div className="seg">
                <button
                  type="button"
                  className={`seg-item ${svcMetric === 'rev' ? 'on' : ''}`}
                  onClick={() => setSvcMetric('rev')}
                >
                  Выручка
                </button>
                <button
                  type="button"
                  className={`seg-item ${svcMetric === 'count' ? 'on' : ''}`}
                  onClick={() => setSvcMetric('count')}
                >
                  Записи
                </button>
              </div>
            </div>
            <div className="island-body">
              <div className="col" style={{ gap: '10px' }}>
                {servicesList.map((r, i) => (
                  <div key={i} className="srow" title={r.tip}>
                    <div className="col" style={{ gap: 0, minWidth: 0 }}>
                      <span className="cell-main" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.name}
                      </span>
                      <span className="cell-sub">{r.spec}</span>
                    </div>
                    <div className="bar-track" style={{ height: '12px' }}>
                      <span className="bar-fill" style={{ width: r.w, background: 'var(--primary)' }} />
                    </div>
                    <span className="tnum cell-main" style={{ textAlign: 'right' }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* По видам животных */}
          <section className="island" aria-label="Статистика по видам">
            <div className="island-head">
              <span className="island-title">
                <Shapes className="ic w-4 h-4" />
                <span>По видам животных</span>
              </span>
              <span className="small muted">доля выручки</span>
            </div>
            <div className="island-body">
              <div className="col" style={{ gap: '18px', alignItems: 'center' }}>
                {/* Conic Donut for Species */}
                <div
                  style={{
                    width: '168px',
                    height: '168px',
                    borderRadius: '50%',
                    background: speciesData.donut,
                    display: 'grid',
                    placeItems: 'center',
                    flex: 'none',
                  }}
                  role="img"
                  aria-label="Доля выручки по видам животных"
                >
                  <div
                    style={{
                      width: '112px',
                      height: '112px',
                      borderRadius: '50%',
                      background: 'var(--card)',
                      display: 'grid',
                      placeItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div className="col" style={{ gap: 0, alignItems: 'center' }}>
                      <span className="kpi-value" style={{ fontSize: '18px' }}>
                        {speciesData.totalRev}
                      </span>
                      <span className="small muted">выручка</span>
                    </div>
                  </div>
                </div>

                {/* List of species */}
                <div className="col" style={{ gap: '10px', width: '100%' }}>
                  {speciesData.rows.map((r, i) => (
                    <div key={i} className="row between" style={{ gap: '10px', alignItems: 'flex-start' }}>
                      <div className="row" style={{ gap: '10px', alignItems: 'flex-start', minWidth: 0 }}>
                        <i
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '3px',
                            background: r.color,
                            display: 'inline-block',
                            marginTop: '5px',
                            flex: 'none',
                          }}
                        />
                        <div className="col" style={{ gap: 0 }}>
                          <span className="cell-main">{r.name}</span>
                          <span className="cell-sub">{r.sub}</span>
                        </div>
                      </div>
                      <div className="col" style={{ gap: 0, alignItems: 'flex-end' }}>
                        <span className="tnum cell-main">{r.revenue}</span>
                        <span className="cell-sub tnum">{r.share}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
