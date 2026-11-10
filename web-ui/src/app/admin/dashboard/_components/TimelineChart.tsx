'use client';

import React, { useState, useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import {
  formatCurrency,
  formatDateRu,
  formatIsoDateDisplay,
  getMoscowDateKey,
} from '@/shared/lib';
import type { StatisticsGranularity } from '@/shared/types';
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

export function TimelineChart({
  timeline,
  metric: propMetric,
  onMetricChange,
  granularity,
  onGranularityChange,
}: TimelineChartProps) {
  const [internalMetric, setInternalMetric] = useState<'count' | 'rev'>('count');
  const metric = propMetric ?? internalMetric;

  const handleMetricChange = (m: 'count' | 'rev') => {
    setInternalMetric(m);
    onMetricChange?.(m);
  };

  const timelineBars = useMemo(() => {
    if (timeline.length === 0) return [];

    const maxC = Math.max(1, ...timeline.map((t) => t.appointments));
    const maxR = Math.max(1, ...timeline.map((t) => t.revenue));
    const step = Math.max(1, Math.ceil(timeline.length / 10));
    const months = new Set(timeline.map((t) => getMoscowDateKey(t.periodStart).slice(0, 7)));
    const multiMonthDay = months.size > 1;

    return timeline.map((pt, i) => {
      const key = getMoscowDateKey(pt.periodStart) || pt.periodStart;
      const tick = formatPeriodTick(pt.periodStart, granularity, multiMonthDay);
      const isLast = i === timeline.length - 1;
      const showLabel = i % step === 0 || (isLast && timeline.length <= 12);

      return {
        label: showLabel ? tick : '',
        h1:
          metric === 'count'
            ? `${((pt.appointments / maxC) * 100).toFixed(1)}%`
            : `${((pt.revenue / maxR) * 100).toFixed(1)}%`,
        h2: metric === 'count' ? `${((pt.completed / maxC) * 100).toFixed(1)}%` : '0%',
        tip: `${formatIsoDateDisplay(key)}: записей ${pt.appointments}, завершено ${pt.completed}, выручка ${formatCurrency(pt.revenue)}`,
      };
    });
  }, [timeline, metric, granularity]);

  return (
    <section className="island" style={{ minHeight: '320px' }} aria-label="Динамика">
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
              Записи
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
          <>
            <div className="legend" style={{ marginBottom: '10px' }}>
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
            <div
              className="row"
              style={{
                alignItems: 'flex-end',
                gap: '3px',
                height: '200px',
                borderBottom: '1px solid var(--border)',
                padding: '0 2px',
              }}
            >
              {timelineBars.map((b, i) => (
                <div
                  key={i}
                  className="col"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '100%',
                    justifyContent: 'flex-end',
                    gap: 0,
                  }}
                  title={b.tip}
                >
                  <div className="row" style={{ alignItems: 'flex-end', gap: '1px', height: '100%' }}>
                    <div
                      style={{
                        flex: 1,
                        height: b.h1,
                        background: metric === 'count' ? 'var(--chart-2)' : 'var(--chart-1)',
                        borderRadius: '3px 3px 0 0',
                      }}
                    />
                    {metric === 'count' && (
                      <div
                        style={{
                          flex: 1,
                          height: b.h2,
                          background: 'var(--chart-1)',
                          borderRadius: '3px 3px 0 0',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="row" style={{ gap: '3px', padding: '4px 2px 0' }}>
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
          </>
        )}
      </div>
    </section>
  );
}
