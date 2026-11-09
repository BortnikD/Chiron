'use client';

import React, { useState, useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { PROTOTYPE_SERVICES } from './constants';
import { rub } from './utils';
import { TopServicesIslandProps } from './types';

export function TopServicesIsland({
  servicesStats,
  initialMetric = 'rev',
}: TopServicesIslandProps) {
  const [svcMetric, setSvcMetric] = useState<'rev' | 'count'>(initialMetric);

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
  );
}
