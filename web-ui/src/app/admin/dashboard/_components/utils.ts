import type { OverviewStatistics } from '@/modules/admin/types';
import { APPOINTMENT_STATUS_META, formatCurrency, pluralRu } from '@/shared/lib';
import { ST_COLORS } from './constants';
import type { DashboardKpiStats } from './types';

export function pct(a: number, b: number): string {
  if (!b) return '0%';
  return `${(Math.round((a / b) * 1000) / 10).toString().replace('.', ',')}%`;
}

/**
 * Расчёт длин дуг SVG Donut Chart с гарантированным минимальным размером
 * для малых ненулевых долей (чтобы 0.4% или 1% не превращались в микро-щель в 0.5px,
 * а оставались четко видимыми и кликабельными сегментами, сохраняя общую сумму в 360°).
 */
export function computeDonutArcs(
  values: number[],
  circumference: number,
  minArc = 14
): number[] {
  const n = values.length;
  const arcs = new Array(n).fill(0);
  const active = values
    .map((v, i) => ({ v: Math.max(0, v), i }))
    .filter((e) => e.v > 0);

  if (!active.length) return arcs;
  if (active.length === 1) {
    arcs[active[0].i] = circumference;
    return arcs;
  }

  // Ограничиваем minArc, чтобы сумма минимальных дуг не превышала 40% длины окружности
  const effectiveMin = Math.min(minArc, (circumference * 0.4) / active.length);
  const pool = [...active];
  let remC = circumference;
  let remVal = pool.reduce((sum, e) => sum + e.v, 0);

  // Итеративно выявляем сегменты, чья естественная доля меньше effectiveMin,
  // фиксируем их на effectiveMin и пересчитываем оставшуюся длину окружности
  while (pool.length > 0) {
    let allocated = false;
    for (let idx = pool.length - 1; idx >= 0; idx--) {
      const e = pool[idx];
      const prop = (e.v / remVal) * remC;
      if (prop < effectiveMin) {
        arcs[e.i] = effectiveMin;
        remC -= effectiveMin;
        remVal -= e.v;
        pool.splice(idx, 1);
        allocated = true;
        break;
      }
    }
    if (!allocated) break;
  }

  // Оставшуюся длину окружности пропорционально распределяем между крупными сегментами
  if (pool.length > 0 && remVal > 0) {
    for (const e of pool) {
      arcs[e.i] = (e.v / remVal) * remC;
    }
  }

  return arcs;
}

export function computeKpiStats(
  overview: OverviewStatistics | null,
  clientsTotal = 0,
  petsTotal = 0
): DashboardKpiStats {
  const total = overview?.totalAppointments ?? 0;
  const completed = overview?.appointmentsByStatus?.COMPLETED ?? 0;
  const cancelled = overview?.appointmentsByStatus?.CANCELLED ?? 0;
  const noShow = overview?.appointmentsByStatus?.NO_SHOW ?? 0;
  const pending = overview?.appointmentsByStatus?.PENDING ?? 0;
  const confirmed = overview?.appointmentsByStatus?.CONFIRMED ?? 0;

  const rev = overview?.revenue ?? 0;
  const exp = overview?.expectedRevenue ?? 0;
  const totalPossible = rev + exp;

  const recvW = totalPossible ? `${((rev / totalPossible) * 100).toFixed(1)}%` : '0%';
  const expW = totalPossible ? `${((exp / totalPossible) * 100).toFixed(1)}%` : '0%';
  const recvPct = totalPossible ? pct(rev, totalPossible) : '—';

  const avg = overview?.averageCheck;
  const followUps = overview?.followUps ?? 0;

  const newClients = overview?.newClients ?? 0;
  const newPets = overview?.newPets ?? 0;

  return {
    revenue: formatCurrency(rev),
    expected: formatCurrency(exp),
    totalPossible: formatCurrency(totalPossible),
    recvW,
    expW,
    recvPct,
    avg: avg != null ? formatCurrency(avg) : '—',
    doneLabel: `${completed} ${pluralRu(completed, 'завершённый приём', 'завершённых приёма', 'завершённых приёмов')}`,
    total,
    completed,
    totalSub: `${pluralRu(total, 'запись', 'записи', 'записей')} · ${completed} завершено`,
    rates: [
      {
        label: 'Отмены',
        value: pct(cancelled, total),
        count: `${cancelled} ${pluralRu(cancelled, 'запись', 'записи', 'записей')}`,
        w: total ? `${((cancelled / total) * 100).toFixed(1)}%` : '0%',
        color: 'oklch(0.68 0.16 32)', // Мягкий терракотовый
        countNum: cancelled,
      },
      {
        label: 'Неявки',
        value: pct(noShow, total),
        count: `${noShow} ${pluralRu(noShow, 'запись', 'записи', 'записей')}`,
        w: total ? `${((noShow / total) * 100).toFixed(1)}%` : '0%',
        color: 'oklch(0.74 0.14 58)', // Тёплый персиковый
        countNum: noShow,
      },
      {
        label: 'Повторные приёмы',
        value: pct(followUps, total),
        count: `${followUps} ${pluralRu(followUps, 'запись', 'записи', 'записей')}`,
        w: total ? `${((followUps / total) * 100).toFixed(1)}%` : '0%',
        color: 'var(--primary)',
        countNum: followUps,
      },
    ],
    newClients,
    newPets,
    clientsTotal,
    petsTotal,
    byStatus: [
      { label: APPOINTMENT_STATUS_META.PENDING.short, count: pending, pct: pct(pending, total), color: ST_COLORS.PENDING },
      { label: APPOINTMENT_STATUS_META.CONFIRMED.short, count: confirmed, pct: pct(confirmed, total), color: ST_COLORS.CONFIRMED },
      { label: APPOINTMENT_STATUS_META.COMPLETED.short, count: completed, pct: pct(completed, total), color: ST_COLORS.COMPLETED },
      { label: APPOINTMENT_STATUS_META.CANCELLED.short, count: cancelled, pct: pct(cancelled, total), color: ST_COLORS.CANCELLED },
      { label: APPOINTMENT_STATUS_META.NO_SHOW.short, count: noShow, pct: pct(noShow, total), color: ST_COLORS.NO_SHOW },
    ],
  };
}
