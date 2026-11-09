'use client';

import React, { useState, useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { rub } from './utils';
import { PROTOTYPE_TIMELINE_HEIGHTS } from './constants';
import { TimelineChartProps } from './types';

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

  // 31-day Timeline Bars for the left chart
  const timelineBars = useMemo(() => {
    if (timeline.length > 0) {
      const maxC = Math.max(1, ...timeline.map((t) => t.appointments));
      const maxR = Math.max(1, ...timeline.map((t) => t.revenue));
      const step = Math.ceil(timeline.length / 10);

      return timeline.map((pt, i) => {
        const dd = pt.periodStart.slice(-2);
        return {
          label: i % step === 0 ? dd : '',
          h1: metric === 'count' ? `${((pt.appointments / maxC) * 100).toFixed(1)}%` : `${((pt.revenue / maxR) * 100).toFixed(1)}%`,
          h2: metric === 'count' ? `${((pt.completed / maxC) * 100).toFixed(1)}%` : '0%',
          tip: `${pt.periodStart}: записей ${pt.appointments}, завершено ${pt.completed}, выручка ${rub(pt.revenue)}`,
        };
      });
    }

    const heights = PROTOTYPE_TIMELINE_HEIGHTS;
    const maxH = 9;
    return heights.map(([tot, comp], i) => {
      const dayNum = String(i + 1).padStart(2, '0');
      const showLabel = [1, 5, 9, 13, 17, 21, 25, 29].includes(i + 1);

      return {
        label: showLabel ? dayNum : '',
        h1: `${((tot / maxH) * 100).toFixed(1)}%`,
        h2: `${((comp / maxH) * 100).toFixed(1)}%`,
        tip: `${dayNum}.10.2026: записей ${tot}, завершено ${comp}`,
      };
    });
  }, [timeline, metric]);

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
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
              className="muted"
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
