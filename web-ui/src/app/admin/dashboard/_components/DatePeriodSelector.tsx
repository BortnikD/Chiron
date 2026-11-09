'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DOWS, DP_MONS } from './constants';
import { formatIsoDisplay } from './utils';
import { DatePeriodSelectorProps } from './types';

export function DatePeriodSelector({
  period,
  onSelectPeriod,
  stFrom,
  stTo,
  onFromChange,
  onToChange,
}: DatePeriodSelectorProps) {
  const [dpOpen, setDpOpen] = useState<'from' | 'to' | null>(null);
  const [dpViewMonth, setDpViewMonth] = useState<string>('2026-10'); // YYYY-MM
  const dpFromRef = useRef<HTMLDivElement>(null);
  const dpToRef = useRef<HTMLDivElement>(null);

  // Close datepicker popover on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedFrom = dpFromRef.current && dpFromRef.current.contains(target);
      const clickedTo = dpToRef.current && dpToRef.current.contains(target);
      if (!clickedFrom && !clickedTo) {
        setDpOpen(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Calendar cells for interactive datepicker
  const calendarCells = useMemo(() => {
    const [y, m] = dpViewMonth.split('-').map(Number);
    const firstDay = new Date(Date.UTC(y, m - 1, 1));
    const shift = (firstDay.getUTCDay() + 6) % 7; // Monday = 0
    const cells = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(Date.UTC(y, m - 1, 1 - shift + i));
      const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const isOut = d.getUTCMonth() + 1 !== m;
      const isWeekend = (d.getUTCDay() + 6) % 7 >= 5;
      const isSelected = dpOpen === 'from' ? iso === stFrom : iso === stTo;

      cells.push({
        n: d.getUTCDate(),
        iso,
        cls: [
          isOut ? 'out' : '',
          isWeekend ? 'we' : '',
          isSelected ? 'on' : '',
        ].filter(Boolean).join(' '),
      });
    }
    return cells;
  }, [dpViewMonth, dpOpen, stFrom, stTo]);

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
            Свой период
          </button>
        </div>
      </div>

      {/* Date Picker: С */}
      <div className="field" style={{ width: '150px' }}>
        <label className="field-label" htmlFor="st-from">
          С
        </label>
        <div className="dp" ref={dpFromRef}>
          <button
            type="button"
            className="input dp-btn"
            id="st-from"
            onClick={() => {
              setDpViewMonth(stFrom ? stFrom.slice(0, 7) : '2026-10');
              setDpOpen(dpOpen === 'from' ? null : 'from');
            }}
          >
            <Calendar className="ic w-4 h-4" />
            <span className="dp-val">{stFrom ? formatIsoDisplay(stFrom) : 'дд.мм.гггг'}</span>
            {stFrom && (
              <span
                className="dp-clear"
                role="button"
                aria-label="Очистить дату"
                onClick={(e) => {
                  e.stopPropagation();
                  onFromChange('');
                  onSelectPeriod('custom');
                }}
              >
                <X className="ic w-3.5 h-3.5" />
              </span>
            )}
          </button>

          {dpOpen === 'from' && (
            <div
              className="popover dp-pop shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dp-head">
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => {
                    const [y, m] = dpViewMonth.split('-').map(Number);
                    const prev = new Date(Date.UTC(y, m - 2, 1));
                    setDpViewMonth(`${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`);
                  }}
                >
                  <ChevronLeft className="ic w-4 h-4" />
                </button>
                <span className="dp-title">
                  {DP_MONS[+dpViewMonth.slice(5, 7) - 1]} {dpViewMonth.slice(0, 4)}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => {
                    const [y, m] = dpViewMonth.split('-').map(Number);
                    const next = new Date(Date.UTC(y, m, 1));
                    setDpViewMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
                  }}
                >
                  <ChevronRight className="ic w-4 h-4" />
                </button>
              </div>
              <div className="dp-dows">
                {DOWS.map((d, i) => (
                  <span key={d} className={i >= 5 ? 'we' : ''}>
                    {d}
                  </span>
                ))}
              </div>
              <div className="dp-grid">
                {calendarCells.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`dp-cell ${c.cls}`}
                    onClick={() => {
                      onFromChange(c.iso);
                      onSelectPeriod('custom');
                      setDpOpen(null);
                    }}
                  >
                    {c.n}
                  </button>
                ))}
              </div>
              <div className="dp-foot">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-xs"
                  onClick={() => {
                    onFromChange('2026-10-26');
                    onSelectPeriod('custom');
                    setDpOpen(null);
                  }}
                >
                  Сегодня
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-xs"
                  onClick={() => {
                    onFromChange('');
                    onSelectPeriod('custom');
                    setDpOpen(null);
                  }}
                >
                  Очистить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Picker: По (включительно) */}
      <div className="field" style={{ width: '150px' }}>
        <label className="field-label" htmlFor="st-to">
          По (включительно)
        </label>
        <div className="dp" ref={dpToRef}>
          <button
            type="button"
            className="input dp-btn"
            id="st-to"
            onClick={() => {
              setDpViewMonth(stTo ? stTo.slice(0, 7) : '2026-10');
              setDpOpen(dpOpen === 'to' ? null : 'to');
            }}
          >
            <Calendar className="ic w-4 h-4" />
            <span className="dp-val">{stTo ? formatIsoDisplay(stTo) : 'дд.мм.гггг'}</span>
            {stTo && (
              <span
                className="dp-clear"
                role="button"
                aria-label="Очистить дату"
                onClick={(e) => {
                  e.stopPropagation();
                  onToChange('');
                  onSelectPeriod('custom');
                }}
              >
                <X className="ic w-3.5 h-3.5" />
              </span>
            )}
          </button>

          {dpOpen === 'to' && (
            <div
              className="popover dp-pop shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dp-head">
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => {
                    const [y, m] = dpViewMonth.split('-').map(Number);
                    const prev = new Date(Date.UTC(y, m - 2, 1));
                    setDpViewMonth(`${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`);
                  }}
                >
                  <ChevronLeft className="ic w-4 h-4" />
                </button>
                <span className="dp-title">
                  {DP_MONS[+dpViewMonth.slice(5, 7) - 1]} {dpViewMonth.slice(0, 4)}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => {
                    const [y, m] = dpViewMonth.split('-').map(Number);
                    const next = new Date(Date.UTC(y, m, 1));
                    setDpViewMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
                  }}
                >
                  <ChevronRight className="ic w-4 h-4" />
                </button>
              </div>
              <div className="dp-dows">
                {DOWS.map((d, i) => (
                  <span key={d} className={i >= 5 ? 'we' : ''}>
                    {d}
                  </span>
                ))}
              </div>
              <div className="dp-grid">
                {calendarCells.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`dp-cell ${c.cls}`}
                    onClick={() => {
                      onToChange(c.iso);
                      onSelectPeriod('custom');
                      setDpOpen(null);
                    }}
                  >
                    {c.n}
                  </button>
                ))}
              </div>
              <div className="dp-foot">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-xs"
                  onClick={() => {
                    onToChange('2026-10-26');
                    onSelectPeriod('custom');
                    setDpOpen(null);
                  }}
                >
                  Сегодня
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-xs"
                  onClick={() => {
                    onToChange('');
                    onSelectPeriod('custom');
                    setDpOpen(null);
                  }}
                >
                  Очистить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
