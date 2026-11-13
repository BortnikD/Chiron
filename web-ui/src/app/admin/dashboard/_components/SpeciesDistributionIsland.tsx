'use client';

import React, { useMemo } from 'react';
import { Shapes } from 'lucide-react';
import { formatCurrency, pluralRu } from '@/shared/lib';
import { pct } from './utils';
import type { SpeciesDistributionIslandProps } from './types';

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

export function SpeciesDistributionIsland({ speciesStats }: SpeciesDistributionIslandProps) {
  const speciesData = useMemo(() => {
    if (speciesStats.length === 0) {
      return { totalRev: formatCurrency(0), donut: 'var(--muted)', rows: [] };
    }

    const list = speciesStats.map((sp, idx) => ({
      id: sp.speciesId,
      name: sp.name,
      pets: sp.activePets || 0,
      total: sp.appointments,
      rev: sp.revenue,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));

    const totalRev = list.reduce((acc, sp) => acc + sp.rev, 0);
    let acc = 0;
    const segs = list.map((sp) => {
      const from = acc;
      acc += totalRev ? (sp.rev / totalRev) * 100 : 0;
      return `${sp.color} ${from.toFixed(2)}% ${acc.toFixed(2)}%`;
    });

    const spDonut = totalRev ? `conic-gradient(${segs.join(', ')})` : 'var(--muted)';

    return {
      totalRev: formatCurrency(totalRev),
      donut: spDonut,
      rows: list.map((sp) => ({
        id: sp.id,
        name: sp.name,
        color: sp.color,
        sub: `${sp.pets ? sp.pets + ' ' + pluralRu(sp.pets, 'питомец', 'питомца', 'питомцев') + ' · ' : ''}${sp.total} ${pluralRu(sp.total, 'запись', 'записи', 'записей')}`,
        revenue: formatCurrency(sp.rev),
        share: pct(sp.rev, totalRev),
      })),
    };
  }, [speciesStats]);

  return (
    <section className="island" aria-label="Статистика по видам">
      <div className="island-head">
        <span className="island-title">
          <Shapes className="ic w-4 h-4" />
          <span>По видам животных</span>
        </span>
        <span className="small muted">доля выручки</span>
      </div>
      <div className="island-body">
        {speciesData.rows.length === 0 ? (
          <div className="empty" style={{ padding: '24px 12px' }}>
            <Shapes className="ic ic-40" />
            <span className="empty-title">Нет статистики по видам за период</span>
          </div>
        ) : (
          <div className="col" style={{ gap: '18px', alignItems: 'center' }}>
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

            <div className="col" style={{ gap: '10px', width: '100%' }}>
              {speciesData.rows.map((r) => (
                <div key={r.id} className="row between" style={{ gap: '10px', alignItems: 'flex-start' }}>
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
        )}
      </div>
    </section>
  );
}
