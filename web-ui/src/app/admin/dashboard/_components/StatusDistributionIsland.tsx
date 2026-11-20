'use client';

import React, { useState, useMemo } from 'react';
import { computeDonutArcs } from './utils';
import type { StatusDistributionIslandProps } from './types';

export const StatusDistributionIsland = React.memo(function StatusDistributionIsland({ stats }: StatusDistributionIslandProps) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Рассчитываем SVG-сегменты с четкими стыками и гарантированной минимальной видимостью для малых долей (1%, 0.4%)
  const segments = useMemo(() => {
    if (!stats.total || stats.total === 0) return [];

    const activeCount = stats.byStatus.filter((s) => s.count > 0).length;
    const gap = activeCount > 1 ? 2.5 : 0;
    const arcs = computeDonutArcs(
      stats.byStatus.map((s) => s.count),
      circumference,
      15 // гарантированная дуга минимум 15px (при gap 2.5px чистый штрих = 12.5px ~ 13.3°)
    );

    let acc = 0;
    return stats.byStatus.map((item, idx) => {
      const arc = arcs[idx] || 0;
      const pctValue = (item.count / stats.total) * 100;

      if (arc <= 0 || item.count <= 0) {
        return {
          ...item,
          pctValue,
          strokeLength: 0,
          strokeOffset: 0,
        };
      }

      const strokeLength = Math.max(1, arc - gap);
      const strokeOffset = -acc;
      acc += arc;

      return {
        ...item,
        pctValue,
        strokeLength,
        strokeOffset,
      };
    });
  }, [stats, circumference]);

  const activeItem = useMemo(() => {
    if (!hoveredLabel) return null;
    return segments.find((s) => s.label === hoveredLabel) || null;
  }, [hoveredLabel, segments]);

  return (
    <section className="island" aria-label="Записи по статусам">
      <div className="island-head">
        <span className="island-title">Записи по статусам</span>
      </div>

      <div className="island-body">
        <div className="row" style={{ gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Четкий интерактивный SVG Donut Chart */}
          <div
            style={{
              position: 'relative',
              width: '148px',
              height: '148px',
              flex: 'none',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <svg
              width="148"
              height="148"
              viewBox="0 0 148 148"
              style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
            >
              {segments.length === 0 || segments.every((s) => s.strokeLength === 0) ? (
                <circle
                  cx="74"
                  cy="74"
                  r={radius}
                  fill="none"
                  stroke="var(--muted)"
                  strokeWidth="18"
                />
              ) : (
                segments.map((s) => {
                  if (s.strokeLength <= 0) return null;
                  const isHovered = hoveredLabel === s.label;
                  return (
                    <circle
                      key={s.label}
                      cx="74"
                      cy="74"
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
                        opacity: hoveredLabel && !isHovered ? 0.35 : 1,
                      }}
                      onMouseEnter={() => setHoveredLabel(s.label)}
                      onMouseLeave={() => setHoveredLabel(null)}
                    />
                  );
                })
              )}
            </svg>

            {/* Центр кольца: информативно отображает наведённый статус */}
            <div
              style={{
                position: 'absolute',
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: 'var(--card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              {activeItem ? (
                <div className="col" style={{ gap: '1px', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '22px',
                      color: activeItem.color,
                      fontWeight: 750,
                      lineHeight: 1,
                    }}
                  >
                    {activeItem.count}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 650,
                      color: 'var(--foreground)',
                      maxWidth: '80px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeItem.label}
                  </span>
                  <span className="small muted" style={{ fontSize: '10.5px' }}>
                    {activeItem.pct}
                  </span>
                </div>
              ) : (
                <div className="col" style={{ gap: 0, alignItems: 'center' }}>
                  <span className="kpi-value" style={{ fontSize: '22px' }}>
                    {stats.total}
                  </span>
                  <span className="small muted" style={{ fontSize: '11.5px' }}>записей</span>
                </div>
              )}
            </div>
          </div>

          {/* Легенда статусов справа — ничего не перекрывается */}
          <div className="col" style={{ gap: '6px', flex: 1, minWidth: '150px' }}>
            {segments.map((b) => {
              const isHovered = hoveredLabel === b.label;
              return (
                <div
                  key={b.label}
                  className="row between small"
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                    background: isHovered
                      ? 'color-mix(in srgb, var(--primary) 12%, var(--muted))'
                      : 'transparent',
                  }}
                  onMouseEnter={() => setHoveredLabel(b.label)}
                  onMouseLeave={() => setHoveredLabel(null)}
                >
                  <span className="row" style={{ gap: '8px', alignItems: 'center' }}>
                    <i
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '3px',
                        background: b.color,
                        display: 'inline-block',
                        transform: isHovered ? 'scale(1.25)' : 'none',
                        transition: 'transform 0.12s ease',
                      }}
                    />
                    <span style={{ fontWeight: isHovered ? 650 : 500 }}>{b.label}</span>
                  </span>
                  <span className="tnum cell-main" style={{ fontWeight: isHovered ? 700 : 500 }}>
                    {b.count}{' '}
                    <span className="muted" style={{ fontWeight: 400 }}>
                      {b.pct}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});
