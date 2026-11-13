'use client';

import React, { useMemo } from 'react';
import { Stethoscope } from 'lucide-react';
import { formatCurrency, pluralRu } from '@/shared/lib';
import { ST_COLORS } from './constants';
import { pct } from './utils';
import type { TopVeterinariansIslandProps } from './types';

export function TopVeterinariansIsland({ vetsStats }: TopVeterinariansIslandProps) {
  const doctorRows = useMemo(() => {
    if (vetsStats.length === 0) return [];

    const maxRev = Math.max(1, ...vetsStats.map((v) => v.revenue));
    const maxAppts = Math.max(1, ...vetsStats.map((v) => v.appointments));

    return vetsStats.map((v) => {
      const total = v.appointments;
      const completed = v.completed;
      const cancelled = v.cancelled;
      const noshow = v.noShows;
      const active = Math.max(0, total - completed - cancelled - noshow);

      const trackW = total > 0 ? `${Math.max(10, (total / maxAppts) * 100).toFixed(1)}%` : '0%';
      const revW = v.revenue > 0 ? `${((v.revenue / maxRev) * 100).toFixed(1)}%` : '0%';

      const segs =
        total > 0
          ? [
              { key: 'comp', count: completed, color: ST_COLORS.COMPLETED, label: 'Завершено' },
              { key: 'act', count: active, color: ST_COLORS.CONFIRMED, label: 'Предстоящие' },
              { key: 'canc', count: cancelled, color: ST_COLORS.CANCELLED, label: 'Отменено' },
              { key: 'ns', count: noshow, color: ST_COLORS.NO_SHOW, label: 'Неявка' },
            ]
              .filter((s) => s.count > 0)
              .map((s) => ({
                w: `${((s.count / total) * 100).toFixed(1)}%`,
                color: s.color,
                num: s.count >= 2 ? String(s.count) : '',
                tip: `${s.label}: ${s.count}`,
              }))
          : [];

      return {
        id: v.veterinarianId,
        name: v.fullName,
        sub: `${total} ${pluralRu(total, 'запись', 'записи', 'записей')} · ${pct(completed, total)} завершено`,
        total,
        trackW,
        revenue: formatCurrency(v.revenue),
        revW,
        segs,
      };
    });
  }, [vetsStats]);

  return (
    <section className="island" style={{ flex: 'none' }} aria-label="Статистика по врачам">
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
        {doctorRows.length === 0 ? (
          <div className="empty" style={{ padding: '24px 12px' }}>
            <Stethoscope className="ic ic-40" />
            <span className="empty-title">Нет приёмов по врачам за выбранный период</span>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </section>
  );
}
