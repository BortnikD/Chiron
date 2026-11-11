'use client';

import React, { useMemo } from 'react';
import { StatusDistributionIslandProps } from './types';

export function StatusDistributionIsland({ stats }: StatusDistributionIslandProps) {
  // Donut conic gradient string
  const donutGradient = useMemo(() => {
    if (!stats.total) return 'var(--muted)';
    let acc = 0;
    const total = stats.total;
    const segs = stats.byStatus.map((item) => {
      const from = acc;
      acc += (item.count / total) * 100;
      return `${item.color} ${from.toFixed(2)}% ${acc.toFixed(2)}%`;
    });
    return `conic-gradient(${segs.join(', ')})`;
  }, [stats]);

  return (
    <section className="island" aria-label="Записи по статусам">
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
  );
}
