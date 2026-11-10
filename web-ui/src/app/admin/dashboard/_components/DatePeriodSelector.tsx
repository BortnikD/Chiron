'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DOW_SHORT, formatIsoDateDisplay, getMoscowTodayIso } from '@/shared/lib';
import { DP_MONS } from './constants';
import type { DatePeriodSelectorProps } from './types';

interface CalendarPopoverProps {
  selectedDate: string;
  viewMonth: string;
  onViewMonthChange: (nextMonth: string) => void;
  onSelectDate: (iso: string) => void;
  onClose: () => void;
}

function CalendarPopover({
  selectedDate,
  viewMonth,
  onViewMonthChange,
  onSelectDate,
  onClose,
}: CalendarPopoverProps) {
  const todayIso = getMoscowTodayIso();

  const calendarCells = useMemo(() => {
    const [y, m] = viewMonth.split('-').map(Number);
    const firstDay = new Date(Date.UTC(y, m - 1, 1));
    const shift = (firstDay.getUTCDay() + 6) % 7;
    const cells = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(Date.UTC(y, m - 1, 1 - shift + i));
      const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const isOut = d.getUTCMonth() + 1 !== m;
      const isWeekend = (d.getUTCDay() + 6) % 7 >= 5;
      const isSelected = iso === selectedDate;
      const isToday = iso === todayIso;

      cells.push({
        n: d.getUTCDate(),
        iso,
        cls: [
          isOut ? 'out' : '',
          isWeekend ? 'we' : '',
          isToday ? 'today' : '',
          isSelected ? 'on' : '',
        ]
          .filter(Boolean)
          .join(' '),
      });
    }
    return cells;
  }, [viewMonth, selectedDate, todayIso]);

  return (
    <div className="popover dp-pop shadow-xl" onClick={(e) => e.stopPropagation()}>
      <div className="dp-head">
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Предыдущий месяц"
          onClick={() => {
            const [y, m] = viewMonth.split('-').map(Number);
            const prev = new Date(Date.UTC(y, m - 2, 1));
            onViewMonthChange(`${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`);
          }}
        >
          <ChevronLeft className="ic w-4 h-4" />
        </button>
        <span className="dp-title">
          {DP_MONS[+viewMonth.slice(5, 7) - 1]} {viewMonth.slice(0, 4)}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Следующий месяц"
          onClick={() => {
            const [y, m] = viewMonth.split('-').map(Number);
            const next = new Date(Date.UTC(y, m, 1));
            onViewMonthChange(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
          }}
        >
          <ChevronRight className="ic w-4 h-4" />
        </button>
      </div>
      <div className="dp-dows">
        {DOW_SHORT.map((d, i) => (
          <span key={d} className={i >= 5 ? 'we' : ''}>
            {d}
          </span>
        ))}
      </div>
      <div className="dp-grid">
        {calendarCells.map((c) => (
          <button
            key={c.iso}
            type="button"
            className={`dp-cell ${c.cls}`}
            onClick={() => {
              onSelectDate(c.iso);
              onClose();
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
            onSelectDate(getMoscowTodayIso());
            onClose();
          }}
        >
          Сегодня
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm text-xs"
          onClick={() => {
            onSelectDate('');
            onClose();
          }}
        >
          Очистить
        </button>
      </div>
    </div>
  );
}

export function DatePeriodSelector({
  period,
  onSelectPeriod,
  stFrom,
  stTo,
  onFromChange,
  onToChange,
}: DatePeriodSelectorProps) {
  const [dpOpen, setDpOpen] = useState<'from' | 'to' | null>(null);
  const [dpViewMonth, setDpViewMonth] = useState<string>(() =>
    (stFrom || getMoscowTodayIso()).slice(0, 7)
  );
  const dpFromRef = useRef<HTMLDivElement>(null);
  const dpToRef = useRef<HTMLDivElement>(null);

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
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`input dp-btn ${!stFrom ? 'dp-empty' : ''}`}
              id="st-from"
              style={stFrom ? { paddingRight: '30px' } : undefined}
              onClick={() => {
                setDpViewMonth((stFrom || getMoscowTodayIso()).slice(0, 7));
                setDpOpen(dpOpen === 'from' ? null : 'from');
              }}
            >
              <Calendar className="ic w-4 h-4" />
              <span className="dp-val">{stFrom ? formatIsoDateDisplay(stFrom) : 'дд.мм.гггг'}</span>
            </button>
            {stFrom && (
              <button
                type="button"
                className="dp-clear"
                aria-label="Очистить дату начала"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 0,
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  onFromChange('');
                  onSelectPeriod('custom');
                }}
              >
                <X className="ic w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {dpOpen === 'from' && (
            <CalendarPopover
              selectedDate={stFrom}
              viewMonth={dpViewMonth}
              onViewMonthChange={setDpViewMonth}
              onSelectDate={(iso) => {
                onFromChange(iso);
                onSelectPeriod('custom');
              }}
              onClose={() => setDpOpen(null)}
            />
          )}
        </div>
      </div>

      {/* Date Picker: По (включительно) */}
      <div className="field" style={{ width: '150px' }}>
        <label className="field-label" htmlFor="st-to">
          По (включительно)
        </label>
        <div className="dp" ref={dpToRef}>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`input dp-btn ${!stTo ? 'dp-empty' : ''}`}
              id="st-to"
              style={stTo ? { paddingRight: '30px' } : undefined}
              onClick={() => {
                setDpViewMonth((stTo || getMoscowTodayIso()).slice(0, 7));
                setDpOpen(dpOpen === 'to' ? null : 'to');
              }}
            >
              <Calendar className="ic w-4 h-4" />
              <span className="dp-val">{stTo ? formatIsoDateDisplay(stTo) : 'дд.мм.гггг'}</span>
            </button>
            {stTo && (
              <button
                type="button"
                className="dp-clear"
                aria-label="Очистить дату окончания"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 0,
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  onToChange('');
                  onSelectPeriod('custom');
                }}
              >
                <X className="ic w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {dpOpen === 'to' && (
            <CalendarPopover
              selectedDate={stTo}
              viewMonth={dpViewMonth}
              onViewMonthChange={setDpViewMonth}
              onSelectDate={(iso) => {
                onToChange(iso);
                onSelectPeriod('custom');
              }}
              onClose={() => setDpOpen(null)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
