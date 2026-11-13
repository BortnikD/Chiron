'use client';

import React, { useMemo } from 'react';
import { DatePicker } from '@/shared/components';
import { formatIsoDateDisplay } from '@/shared/lib';
import type { DatePeriodSelectorProps } from './types';

export function DatePeriodSelector({
  period,
  onSelectPeriod,
  stFrom,
  stTo,
  onFromChange,
  onToChange,
}: DatePeriodSelectorProps) {
  const rangeLabel = useMemo(() => {
    if (stFrom && stTo) {
      return `${formatIsoDateDisplay(stFrom)} — ${formatIsoDateDisplay(stTo)}`;
    }
    if (stFrom) return `с ${formatIsoDateDisplay(stFrom)}`;
    if (stTo) return `по ${formatIsoDateDisplay(stTo)}`;
    return 'За всё время';
  }, [stFrom, stTo]);

  return (
    <section className="island filters" style={{ flex: 'none' }} aria-label="Период">
      <div className="field" style={{ width: 'auto' }}>
        <span className="field-label">Период</span>
        <div className="seg">
          <button
            type="button"
            className={`seg-item ${period === 'week' ? 'on' : ''}`}
            onClick={() => onSelectPeriod('week')}
          >
            Неделя
          </button>
          <button
            type="button"
            className={`seg-item ${period === 'month' ? 'on' : ''}`}
            onClick={() => onSelectPeriod('month')}
          >
            Месяц
          </button>
          <button
            type="button"
            className={`seg-item ${period === 'quarter' ? 'on' : ''}`}
            onClick={() => onSelectPeriod('quarter')}
          >
            Квартал
          </button>
          <button
            type="button"
            className={`seg-item ${period === 'custom' ? 'on' : ''}`}
            onClick={() => onSelectPeriod('custom')}
          >
            Произвольно
          </button>
        </div>
      </div>

      <div className="field" style={{ width: '150px' }}>
        <label className="field-label" htmlFor="st-from">
          С
        </label>
        <DatePicker
          id="st-from"
          value={stFrom}
          max={stTo || undefined}
          onChange={onFromChange}
          ariaLabel="Дата начала периода"
        />
      </div>

      <div className="field" style={{ width: '150px' }}>
        <label className="field-label" htmlFor="st-to">
          По (включительно)
        </label>
        <DatePicker
          id="st-to"
          value={stTo}
          min={stFrom || undefined}
          onChange={onToChange}
          ariaLabel="Дата окончания периода"
        />
      </div>

      <div className="spacer" />
      <span className="small muted" style={{ paddingBottom: '8px' }}>
        {rangeLabel}
      </span>
    </section>
  );
}
