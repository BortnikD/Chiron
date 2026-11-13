'use client';

import React, { useState, useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import {
  formatCurrency,
  formatDateRu,
  getMoscowDateKey,
} from '@/shared/lib';
import type { StatisticsGranularity } from '@/shared/types';
import type { TimelinePoint } from '@/modules/admin/types';
import type { TimelineChartProps } from './types';

function formatPeriodTick(
  periodStart: string,
  granularity: StatisticsGranularity,
  multiMonthDay: boolean
): string {
  const key = getMoscowDateKey(periodStart);
  if (!key) return periodStart;
  const parts = key.split('-');
  if (parts.length < 3) return periodStart;
  const [, m, d] = parts;

  if (granularity === 'MONTH') {
    return formatDateRu(key, { month: 'short', year: '2-digit' });
  }
  if (granularity === 'WEEK' || multiMonthDay) {
    return `${d}.${m}`;
  }
  return d;
}

function formatDetailedPeriod(periodStart: string, granularity: StatisticsGranularity): string {
  const key = getMoscowDateKey(periodStart) || periodStart;
  if (granularity === 'MONTH') {
    return formatDateRu(key, { month: 'long', year: 'numeric' });
  }
  if (granularity === 'WEEK') {
    return `Неделя с ${formatDateRu(key, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  return formatDateRu(key, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' });
}

interface YTick {
  value: number;
  label: string;
  percent: number;
}

function calculateYAxis(
  timeline: TimelinePoint[],
  metric: 'count' | 'rev'
): { niceMax: number; ticks: YTick[] } {
  if (timeline.length === 0) {
    return { niceMax: 10, ticks: [] };
  }

  const rawMax = Math.max(
    1,
    ...timeline.map((t) => (metric === 'count' ? t.appointments : t.revenue))
  );

  const count = 4;
  const roughStep = rawMax / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
  const normalized = roughStep / magnitude;

  let factor = 1;
  if (normalized > 5) factor = 10;
  else if (normalized > 2.5) factor = 5;
  else if (normalized > 1.25) factor = 2.5;
  else if (normalized > 1) factor = 2;

  let step = factor * magnitude;
  if (metric === 'count') {
    step = Math.max(1, Math.round(step));
  } else {
    step = Math.max(100, Math.round(step / 100) * 100);
  }

  const niceMax = Math.max(count * step, Math.ceil(rawMax / step) * step);

  const ticks: YTick[] = [];
  for (let i = count; i >= 0; i--) {
    const val = (niceMax / count) * i;
    const percent = (i / count) * 100;
    let label = '';
    if (metric === 'count') {
      label = Math.round(val).toLocaleString('ru-RU');
    } else {
      if (val >= 1_000_000) {
        label = `${(val / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}M ₽`;
      } else if (val >= 1_000) {
        label = `${Math.round(val / 1_000).toLocaleString('ru-RU')}k ₽`;
      } else if (val === 0) {
        label = '0 ₽';
      } else {
        label = `${Math.round(val)} ₽`;
      }
    }
    ticks.push({ value: val, label, percent });
  }

  return { niceMax, ticks };
}

export function TimelineChart({
  timeline,
  metric: propMetric,
  onMetricChange,
  granularity,
  onGranularityChange,
}: TimelineChartProps) {
  const [internalMetric, setInternalMetric] = useState<'count' | 'rev'>('count');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const metric = propMetric ?? internalMetric;

  const handleMetricChange = (m: 'count' | 'rev') => {
    setInternalMetric(m);
    onMetricChange?.(m);
  };

  const { niceMax, ticks } = useMemo(
    () => calculateYAxis(timeline, metric),
    [timeline, metric]
  );

  const timelineBars = useMemo(() => {
    if (timeline.length === 0) return [];

    const step = Math.max(1, Math.ceil(timeline.length / 10));
    const months = new Set(timeline.map((t) => getMoscowDateKey(t.periodStart).slice(0, 7)));
    const multiMonthDay = months.size > 1;

    return timeline.map((pt, i) => {
      const tick = formatPeriodTick(pt.periodStart, granularity, multiMonthDay);
      const isLast = i === timeline.length - 1;
      const showLabel = i % step === 0 || (isLast && timeline.length <= 12);
      const detailedDate = formatDetailedPeriod(pt.periodStart, granularity);

      const val1 = metric === 'count' ? pt.appointments : pt.revenue;
      const val2 = pt.completed;

      return {
        pt,
        detailedDate,
        label: showLabel ? tick : '',
        h1: val1 === 0 ? '0%' : `${Math.min(100, Math.max(2, (val1 / niceMax) * 100)).toFixed(1)}%`,
        h2: val2 === 0 ? '0%' : `${Math.min(100, Math.max(2, (val2 / niceMax) * 100)).toFixed(1)}%`,
      };
    });
  }, [timeline, metric, granularity, niceMax]);

  const activeBar = hoveredIdx !== null ? timelineBars[hoveredIdx] : null;

  return (
    <section className="island" style={{ minHeight: '340px' }} aria-label="Динамика">
      <div className="island-head">
        <span className="island-title">
          <BarChart2 className="ic w-4 h-4" />
          <span>Динамика</span>
        </span>
        <div className="row wrap" style={{ gap: '8px' }}>
          <div className="seg">
            <button
              type="button"
              className={`seg-item ${metric === 'count' ? 'on' : ''}`}
              onClick={() => handleMetricChange('count')}
            >
              Количество
            </button>
            <button
              type="button"
              className={`seg-item ${metric === 'rev' ? 'on' : ''}`}
              onClick={() => handleMetricChange('rev')}
            >
              Выручка
            </button>
          </div>
          <div className="seg">
            <button
              type="button"
              className={`seg-item ${granularity === 'DAY' ? 'on' : ''}`}
              onClick={() => onGranularityChange('DAY')}
            >
              День
            </button>
            <button
              type="button"
              className={`seg-item ${granularity === 'WEEK' ? 'on' : ''}`}
              onClick={() => onGranularityChange('WEEK')}
            >
              Неделя
            </button>
            <button
              type="button"
              className={`seg-item ${granularity === 'MONTH' ? 'on' : ''}`}
              onClick={() => onGranularityChange('MONTH')}
            >
              Месяц
            </button>
          </div>
        </div>
      </div>
      <div className="island-body">
        {timelineBars.length === 0 ? (
          <div className="empty" style={{ minHeight: '220px' }}>
            <BarChart2 className="ic ic-40" />
            <span className="empty-title">Нет данных за выбранный период</span>
            <span className="small">Попробуйте выбрать другой интервал дат.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="legend" style={{ marginBottom: '4px' }}>
              {metric === 'count' ? (
                <>
                  <span>
                    <i style={{ background: 'var(--chart-2)' }} />
                    Все записи
                  </span>
                  <span>
                    <i style={{ background: 'var(--chart-1)' }} />
                    Завершённые
                  </span>
                </>
              ) : (
                <span>
                  <i style={{ background: 'var(--chart-1)' }} />
                  Выручка по завершённым
                </span>
              )}
            </div>

            {/* График со шкалой Y и сеткой */}
            <div style={{ display: 'flex', height: '200px', position: 'relative' }}>
              {/* Шкала оси Y */}
              <div
                style={{
                  width: '56px',
                  flexShrink: 0,
                  height: '100%',
                  position: 'relative',
                  fontSize: '11px',
                  color: 'var(--muted-foreground)',
                  textAlign: 'right',
                  paddingRight: '8px',
                  userSelect: 'none',
                }}
                aria-hidden="true"
              >
                {ticks.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: `${100 - t.percent}%`,
                      transform: t.percent === 0 ? 'translateY(-100%)' : 'translateY(-50%)',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                    }}
                  >
                    {t.label}
                  </span>
                ))}
              </div>

              {/* Область столбцов и сетки */}
              <div
                style={{
                  flex: 1,
                  height: '100%',
                  position: 'relative',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: '1px solid var(--border)',
                }}
              >
                {/* Горизонтальные линии сетки */}
                {ticks.map((t, idx) => {
                  if (t.percent === 0) return null;
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${100 - t.percent}%`,
                        borderTop: '1px dashed var(--border)',
                        opacity: 0.45,
                        pointerEvents: 'none',
                      }}
                      aria-hidden="true"
                    />
                  );
                })}

                {/* Интерактивный тултип при наведении */}
                {hoveredIdx !== null && activeBar && (
                  (() => {
                    const pct = ((hoveredIdx + 0.5) / timelineBars.length) * 100;
                    let transform = 'translate(-50%, 0)';
                    let left = `${pct}%`;
                    if (pct < 18) {
                      transform = 'translate(0, 0)';
                      left = `${Math.max(1, pct - 1)}%`;
                    } else if (pct > 82) {
                      transform = 'translate(-100%, 0)';
                      left = `${Math.min(99, pct + 1)}%`;
                    }
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          left,
                          top: '8px',
                          transform,
                          background: 'var(--popover)',
                          color: 'var(--popover-foreground)',
                          border: '1px solid var(--border)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          zIndex: 30,
                          pointerEvents: 'none',
                          minWidth: '190px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                        role="tooltip"
                      >
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--foreground)',
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: '4px',
                          }}
                        >
                          {activeBar.detailedDate}
                        </div>
                        {metric === 'count' ? (
                          <>
                            <div className="row between" style={{ fontSize: '12px', gap: '12px', alignItems: 'center' }}>
                              <span className="row" style={{ gap: '6px', alignItems: 'center' }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--chart-2)' }} />
                                <span>Все записи:</span>
                              </span>
                              <strong>{activeBar.pt.appointments}</strong>
                            </div>
                            <div className="row between" style={{ fontSize: '12px', gap: '12px', alignItems: 'center' }}>
                              <span className="row" style={{ gap: '6px', alignItems: 'center' }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--chart-1)' }} />
                                <span>Завершено:</span>
                              </span>
                              <strong style={{ color: 'var(--chart-1)' }}>
                                {activeBar.pt.completed}
                                {activeBar.pt.appointments > 0
                                  ? ` (${Math.round((activeBar.pt.completed / activeBar.pt.appointments) * 100)}%)`
                                  : ''}
                              </strong>
                            </div>
                            <div
                              className="row between"
                              style={{
                                fontSize: '11.5px',
                                gap: '12px',
                                color: 'var(--muted-foreground)',
                                marginTop: '2px',
                                borderTop: '1px dashed var(--border)',
                                paddingTop: '4px',
                                alignItems: 'center',
                              }}
                            >
                              <span>Выручка:</span>
                              <span>{formatCurrency(activeBar.pt.revenue)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="row between" style={{ fontSize: '12px', gap: '12px', alignItems: 'center' }}>
                              <span className="row" style={{ gap: '6px', alignItems: 'center' }}>
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--chart-1)' }} />
                                <span>Выручка:</span>
                              </span>
                              <strong style={{ color: 'var(--chart-1)' }}>{formatCurrency(activeBar.pt.revenue)}</strong>
                            </div>
                            <div
                              className="row between"
                              style={{
                                fontSize: '11.5px',
                                gap: '12px',
                                color: 'var(--muted-foreground)',
                                marginTop: '2px',
                                borderTop: '1px dashed var(--border)',
                                paddingTop: '4px',
                                alignItems: 'center',
                              }}
                            >
                              <span>Завершено приёмов:</span>
                              <span>
                                {activeBar.pt.completed} из {activeBar.pt.appointments}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* Столбцы диаграммы */}
                <div
                  className="row"
                  style={{
                    alignItems: 'flex-end',
                    gap: '2px',
                    height: '100%',
                    position: 'relative',
                    zIndex: 10,
                    padding: '0 2px',
                  }}
                >
                  {timelineBars.map((b, i) => {
                    const isHovered = hoveredIdx === i;
                    return (
                      <div
                        key={i}
                        className="col"
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          height: '100%',
                          justifyContent: 'flex-end',
                          position: 'relative',
                          cursor: 'pointer',
                          background: isHovered ? 'color-mix(in srgb, var(--foreground) 6%, transparent)' : 'transparent',
                          borderRadius: '4px 4px 0 0',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div
                          className="row"
                          style={{
                            alignItems: 'flex-end',
                            gap: '1px',
                            height: '100%',
                            opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: b.h1,
                              background: metric === 'count' ? 'var(--chart-2)' : 'var(--chart-1)',
                              borderRadius: '3px 3px 0 0',
                              boxShadow: isHovered ? '0 0 8px rgba(59, 130, 246, 0.6)' : undefined,
                            }}
                          />
                          {metric === 'count' && (
                            <div
                              style={{
                                flex: 1,
                                height: b.h2,
                                background: 'var(--chart-1)',
                                borderRadius: '3px 3px 0 0',
                                boxShadow: isHovered ? '0 0 8px rgba(34, 197, 94, 0.6)' : undefined,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Подписи оси X */}
            <div style={{ display: 'flex', paddingLeft: '56px' }}>
              <div className="row" style={{ flex: 1, gap: '2px', padding: '4px 2px 0' }}>
                {timelineBars.map((b, i) => (
                  <span
                    key={i}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: '10.5px',
                      textAlign: 'center',
                      overflow: b.label ? 'visible' : 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                    className="muted"
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
