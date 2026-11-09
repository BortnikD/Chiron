'use client';

import React, { useMemo } from 'react';
import { Shapes } from 'lucide-react';
import { PROTOTYPE_SPECIES } from './constants';
import { rub, plural, pct } from './utils';
import { SpeciesDistributionIslandProps } from './types';

export function SpeciesDistributionIsland({ speciesStats }: SpeciesDistributionIslandProps) {
  // Species distribution & donut
  const speciesData = useMemo(() => {
    const list =
      speciesStats.length > 0
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
  );
}
