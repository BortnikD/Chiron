'use client';

import React, { useState, useMemo } from 'react';
import { Shapes } from 'lucide-react';
import { formatCurrency, pluralRu } from '@/shared/lib';
import { pct, computeDonutArcs } from './utils';
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
    const activeCount = list.filter((sp) => sp.rev > 0).length;
    const gap = activeCount > 1 ? 2.5 : 0;
    const arcs = computeDonutArcs(
      list.map((sp) => sp.rev),
      circumference,
      17 // радиус 62, circumference 389.56 => гарантированная дуга 17px, штрих 14.5px ~ 13.4°
    );

    let acc = 0;
    const segments = list.map((sp, idx) => {
      const sharePct = totalRevNum > 0 ? (sp.rev / totalRevNum) * 100 : 0;
      const arc = arcs[idx] || 0;

      if (arc <= 0 || sp.rev <= 0) {
        return {
          ...sp,
          sharePct,
          strokeLength: 0,
          strokeOffset: 0,
        };
      }

      const strokeLength = Math.max(1, arc - gap);
      const strokeOffset = -acc;
      acc += arc;

      return {
        ...sp,
        sharePct,
        strokeLength,
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
          <div className="empty p-lg">
            <Shapes className="ic ic-40" />
            <span className="empty-title">Нет статистики по видам за период</span>
          </div>
        ) : (
          <div className="col gap-lg items-center">
            {/* Четкий SVG Donut */}
            <div className="donut-wrapper">
              <svg
                width="168"
                height="168"
                viewBox="0 0 168 168"
                className="donut-svg"
              >
                {speciesData.segments.length === 0 || speciesData.segments.every((s) => s.strokeLength === 0) ? (
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
                    if (s.strokeLength <= 0) return null;
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
              <div className="donut-center">
                {activeItem ? (
                  <div className="col gap-2xs items-center">
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
                    <span className="text-xs font-bold text-fg">
                      {activeItem.revenue}
                    </span>
                    <span className="small muted text-2xs">
                      {activeItem.share}
                    </span>
                  </div>
                ) : (
                  <div className="col gap-0 items-center">
                    <span className="kpi-value text-lg">
                      {speciesData.totalRev}
                    </span>
                    <span className="small muted text-xs">выручка</span>
                  </div>
                )}
              </div>
            </div>

            {/* Список видов — чистый и без наложения */}
            <div className="col gap-xs w-full">
              {speciesData.rows.map((r) => {
                const isHovered = hoveredId === r.id;
                return (
                  <div
                    key={r.id}
                    className="donut-row"
                    style={{
                      background: isHovered
                        ? 'color-mix(in srgb, var(--primary) 12%, var(--muted))'
                        : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredId(r.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="row gap-sm items-center min-w-0">
                      <i
                        className="donut-color-dot"
                        style={{
                          background: r.color,
                          transform: isHovered ? 'scale(1.25)' : 'none',
                        }}
                      />
                      <div className="col gap-0">
                        <span className={`cell-main ${isHovered ? 'font-bold' : 'font-medium'}`}>
                          {r.name}
                        </span>
                        <span className="cell-sub">{r.sub}</span>
                      </div>
                    </div>
                    <div className="col gap-0 items-end shrink-0">
                      <span className={`tnum cell-main ${isHovered ? 'font-bold' : 'font-medium'}`}>
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
