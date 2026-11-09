import { OverviewStatistics } from '../../../../types';
import { PROTOTYPE_OVERVIEW, ST_COLORS, ST_LABELS } from './constants';
import { DashboardKpiStats } from './types';

export function rub(n?: number | null): string {
  if (n == null) return '—';
  return `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

export function pct(a: number, b: number): string {
  if (!b) return '0%';
  return `${(Math.round((a / b) * 1000) / 10).toString().replace('.', ',')}%`;
}

export function formatIsoDisplay(iso: string): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

export function computeKpiStats(overview: OverviewStatistics | null): DashboardKpiStats {
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
}
