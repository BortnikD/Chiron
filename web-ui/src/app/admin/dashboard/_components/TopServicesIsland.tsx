'use client';

import React, { useState, useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { formatCurrency } from '@/shared/lib';
import type { TopServicesIslandProps } from './types';

export function TopServicesIsland({ servicesStats }: TopServicesIslandProps) {
  const [svcMetric, setSvcMetric] = useState<'rev' | 'count'>('rev');

  const servicesList = useMemo(() => {
    if (servicesStats.length === 0) return [];

    const sorted = [...servicesStats].sort((a, b) =>
      svcMetric === 'rev' ? b.revenue - a.revenue : b.appointments - a.appointments
    );
    const maxVal = Math.max(
      1,
      ...sorted.map((s) => (svcMetric === 'rev' ? s.revenue : s.appointments))
    );

    return sorted.map((s) => ({
      id: s.serviceId,
      name: s.name,
      spec: s.specializationName || 'Услуга клиники',
      value: svcMetric === 'rev' ? formatCurrency(s.revenue) : String(s.appointments),
      w: `${(((svcMetric === 'rev' ? s.revenue : s.appointments) / maxVal) * 100).toFixed(1)}%`,
      tip: `${s.name}: записей ${s.appointments}, завершено ${s.completed}, выручка ${formatCurrency(s.revenue)}`,
    }));
  }, [servicesStats, svcMetric]);

  return (
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
        {servicesList.length === 0 ? (
          <div className="empty" style={{ padding: '24px 12px' }}>
            <ClipboardList className="ic ic-40" />
            <span className="empty-title">Нет статистики по услугам за период</span>
          </div>
        ) : (
          <div className="col" style={{ gap: '10px' }}>
            {servicesList.map((r) => (
              <div key={r.id} className="srow" title={r.tip}>
                <div className="col" style={{ gap: 0, minWidth: 0 }}>
                  <span
                    className="cell-main"
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
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
        )}
      </div>
    </section>
  );
}
