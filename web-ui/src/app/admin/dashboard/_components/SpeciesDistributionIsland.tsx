'use client';

import React, { useState, useMemo } from 'react';
import { Shapes } from 'lucide-react';
import { formatCurrency, pluralRu } from '@/shared/lib';
import { pct } from './utils';
import type { SpeciesDistributionIslandProps } from './types';

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5, #eab308)'];

export const SpeciesDistributionIsland = React.memo(function SpeciesDistributionIsland({ speciesStats }: SpeciesDistributionIslandProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const radius = 62;
  const circumference = 2 * Math.PI * radius;

  const speciesData = useMemo(() => {
    if (speciesStats.length === 0) {
      return { totalRevNum: 0, totalRev: formatCurrency(0), segments: [], rows: [] };
    }

    const list = speciesStats.map((sp, idx) => ({
      id: sp.speciesId,
      name: sp.name,
      pets: sp.activePets || 0,
      total: sp.appointments,
      rev: sp.revenue,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));

    const totalRevNum = list.reduce((acc, sp) => acc + sp.rev, 0);
    const gap = list.length > 1 ? 2 : 0;

    let acc = 0;
    const segments = list.map((sp) => {
      const sharePct = totalRevNum > 0 ? (sp.rev / totalRevNum) * 100 : 0;
      const strokeLength = (sharePct / 100) * circumference;
      const strokeOffset = -(acc / 100) * circumference;
      acc += sharePct;

      return {
        ...sp,
        sharePct,
        strokeLength: Math.max(0.5, strokeLength - gap),
        strokeOffset,
      };
    });

    const rows = segments.map((sp) => ({
      ...sp,
      sub: `${sp.pets ? sp.pets + ' ' + pluralRu(sp.pets, 'питомец', 'питомца', 'питомцев') + ' · ' : ''}${sp.total} ${pluralRu(sp.total, 'запись', 'записи', 'записей')}`,
      revenue: formatCurrency(sp.rev),
      share: pct(sp.rev, totalRevNum),
    }));

    return {
      totalRevNum,
      totalRev: formatCurrency(totalRevNum),
      segments,
      rows,
    };
  }, [speciesStats, circumference]);

  const activeItem = useMemo(() => {
    if (!hoveredId) return null;
    return speciesData.rows.find((s) => s.id === hoveredId) || null;
  }, [hoveredId, speciesData.rows]);

  return (
    <section className="island" aria-label="Статистика по видам">
      <div className="island-head">
        <span className="island-title">
          <Shapes className="ic w-4 h-4 text-primary" />
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
            {/* Четкий SVG Donut */}
            <div
              style={{
                position: 'relative',
                width: '168px',
                height: '168px',
                flex: 'none',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <svg
                width="168"
                height="168"
                viewBox="0 0 168 168"
                style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
              >
                {speciesData.segments.length === 0 ? (
                  <circle
                    cx="84"
                    cy="84"
                    r={radius}
                    fill="none"
                    stroke="var(--muted)"
                    strokeWidth="18"
                  />
                ) : (
                  speciesData.segments.map((s) => {
                    const isHovered = hoveredId === s.id;
                    return (
                      <circle
                        key={s.id}
                        cx="84"
                        cy="84"
                        r={radius}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={isHovered ? 24 : 18}
                        strokeDasharray={`${s.strokeLength} ${circumference}`}
                        strokeDashoffset={s.strokeOffset}
                        strokeLinecap="butt"
                        style={{
                          cursor: 'pointer',
                          transition: 'stroke-width 0.15s ease, opacity 0.15s ease',
                          opacity: hoveredId && !isHovered ? 0.35 : 1,
                        }}
                        onMouseEnter={() => setHoveredId(s.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      />
                    );
                  })
                )}
              </svg>

              {/* Центр кольца: детальная информация без перекрытия списка */}
              <div
                style={{
                  position: 'absolute',
                  width: '104px',
                  height: '104px',
                  borderRadius: '50%',
                  background: 'var(--card)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  padding: '4px',
                }}
              >
                {activeItem ? (
                  <div className="col" style={{ gap: '1px', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 750,
                        color: activeItem.color,
                        lineHeight: 1.15,
                        maxWidth: '92px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {activeItem.name}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)' }}>
                      {activeItem.revenue}
                    </span>
                    <span className="small muted" style={{ fontSize: '10.5px' }}>
                      {activeItem.share}
                    </span>
                  </div>
                ) : (
                  <div className="col" style={{ gap: 0, alignItems: 'center' }}>
                    <span className="kpi-value" style={{ fontSize: '17px' }}>
                      {speciesData.totalRev}
                    </span>
                    <span className="small muted" style={{ fontSize: '11px' }}>выручка</span>
                  </div>
                )}
              </div>
            </div>

            {/* Список видов — чистый и без наложения */}
            <div className="col" style={{ gap: '6px', width: '100%' }}>
              {speciesData.rows.map((r) => {
                const isHovered = hoveredId === r.id;
                return (
                  <div
                    key={r.id}
                    className="row between"
                    style={{
                      gap: '10px',
                      alignItems: 'center',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                      background: isHovered
                        ? 'color-mix(in srgb, var(--primary) 12%, var(--muted))'
                        : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredId(r.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="row" style={{ gap: '10px', alignItems: 'center', minWidth: 0 }}>
                      <i
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '3px',
                          background: r.color,
                          display: 'inline-block',
                          flex: 'none',
                          transform: isHovered ? 'scale(1.25)' : 'none',
                          transition: 'transform 0.12s ease',
                        }}
                      />
                      <div className="col" style={{ gap: 0 }}>
                        <span className="cell-main" style={{ fontWeight: isHovered ? 700 : 500 }}>
                          {r.name}
                        </span>
                        <span className="cell-sub">{r.sub}</span>
                      </div>
                    </div>
                    <div className="col" style={{ gap: 0, alignItems: 'flex-end', flexShrink: 0 }}>
                      <span className="tnum cell-main" style={{ fontWeight: isHovered ? 700 : 500 }}>
                        {r.revenue}
                      </span>
                      <span className="cell-sub tnum">{r.share}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
});
