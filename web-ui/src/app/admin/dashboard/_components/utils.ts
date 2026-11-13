import type { OverviewStatistics } from '@/modules/admin/types';
import { APPOINTMENT_STATUS_META, formatCurrency, pluralRu } from '@/shared/lib';
import { ST_COLORS } from './constants';
import type { DashboardKpiStats } from './types';

export function pct(a: number, b: number): string {
  if (!b) return '0%';
  return `${(Math.round((a / b) * 1000) / 10).toString().replace('.', ',')}%`;
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
        color: ST_COLORS.CANCELLED,
      },
      {
        label: 'Неявки',
        value: pct(noShow, total),
        count: `${noShow} ${pluralRu(noShow, 'запись', 'записи', 'записей')}`,
        w: total ? `${((noShow / total) * 100).toFixed(1)}%` : '0%',
        color: ST_COLORS.NO_SHOW,
      },
      {
        label: 'Повторные приёмы',
        value: pct(followUps, total),
        count: `${followUps} ${pluralRu(followUps, 'запись', 'записи', 'записей')}`,
        w: total ? `${((followUps / total) * 100).toFixed(1)}%` : '0%',
        color: 'var(--primary)',
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
