'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getMoscowTodayIso } from '@/shared/lib';
import {
  buildDayCells,
  buildMonthCells,
  buildYearCells,
  formatIsoLabel,
  getPickerTitle,
  normalizeIso,
  p2,
  shiftMonthIso,
  type PickerMode,
} from './datePickerUtils';

export interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  ariaLabel?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = 'дд.мм.гггг',
  invalid = false,
  disabled = false,
  clearable = true,
  ariaLabel,
}) => {
  const cleanValue = normalizeIso(value);
  const todayIso = getMoscowTodayIso();

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>('days');
  const [viewYm, setViewYm] = useState(() => todayIso.slice(0, 7));
  const [posStyle, setPosStyle] = useState<{ left: number; top: number }>({ left: 8, top: 8 });

  const minIso = normalizeIso(min || '');
  const maxIso = normalizeIso(max || '');

  const okDay = useCallback(
    (iso: string) => (!minIso || iso >= minIso) && (!maxIso || iso <= maxIso),
    [minIso, maxIso]
  );

  const computePosition = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const W = 288;
    const H = 344;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.max(8, Math.min(r.left, vw - W - 8));
    const top =
      r.bottom + 4 + H > vh && r.top - 4 - H > 0
        ? r.top - 4 - H
        : Math.min(r.bottom + 4, Math.max(8, vh - H - 8));
    setPosStyle({ left, top });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setMode('days');
  }, []);

  const openPicker = useCallback(() => {
    if (disabled) return;
    const base =
      cleanValue || (maxIso && maxIso < todayIso ? maxIso : minIso && minIso > todayIso ? minIso : todayIso);
    setViewYm(base.slice(0, 7));
    setMode('days');
    computePosition();
    setOpen(true);
  }, [cleanValue, computePosition, disabled, maxIso, minIso, todayIso]);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    const handleViewportChange = (e: Event) => {
      if (e.type === 'scroll' && popRef.current && popRef.current.contains(e.target as Node)) return;
      computePosition();
    };

    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, close, computePosition]);

  const vy = Number(viewYm.slice(0, 4)) || Number(todayIso.slice(0, 4));
  const vm = Number(viewYm.slice(5, 7)) || Number(todayIso.slice(5, 7));

  const days = useMemo(
    () => (mode === 'days' ? buildDayCells(vy, vm, todayIso, cleanValue, okDay) : []),
    [cleanValue, mode, okDay, todayIso, vm, vy]
  );
  const monthCells = useMemo(
    () => (mode === 'months' ? buildMonthCells(vy, todayIso, cleanValue) : []),
    [cleanValue, mode, todayIso, vy]
  );
  const yearCells = useMemo(
    () => (mode === 'years' ? buildYearCells(vy, todayIso, cleanValue) : []),
    [cleanValue, mode, todayIso, vy]
  );

  const handleClear = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    onChange('');
    close();
  };

  return (
    <div className="dp" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={`input dp-btn ${invalid ? 'invalid' : ''} ${cleanValue ? '' : 'dp-empty'}`}
        onClick={() => (open ? close() : openPicker())}
      >
        <Calendar className="ic" />
        <span className="dp-val">{cleanValue ? formatIsoLabel(cleanValue) : placeholder}</span>
        {cleanValue && clearable && !disabled && (
          <span
            className="dp-clear"
            role="button"
            tabIndex={0}
            aria-label="Очистить дату"
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClear(e);
              }
            }}
          >
            <X className="ic" />
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popRef}
          className="popover dp-pop"
          style={{ left: `${posStyle.left}px`, top: `${posStyle.top}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dp-head">
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              aria-label="Назад"
              onClick={() =>
                setViewYm(
                  mode === 'days'
                    ? shiftMonthIso(vy, vm - 1)
                    : mode === 'months'
                    ? shiftMonthIso(vy - 1, vm)
                    : shiftMonthIso(vy - 12, vm)
                )
              }
            >
              <ChevronLeft className="ic" />
            </button>
            <button
              type="button"
              className="dp-title"
              onClick={() => setMode(mode === 'days' ? 'months' : 'years')}
            >
              {getPickerTitle(mode, vy, vm)}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              aria-label="Вперёд"
              onClick={() =>
                setViewYm(
                  mode === 'days'
                    ? shiftMonthIso(vy, vm + 1)
                    : mode === 'months'
                    ? shiftMonthIso(vy + 1, vm)
                    : shiftMonthIso(vy + 12, vm)
                )
              }
            >
              <ChevronRight className="ic" />
            </button>
          </div>

          {mode === 'days' ? (
            <>
              <div className="dp-dows">
                <span>Пн</span>
                <span>Вт</span>
                <span>Ср</span>
                <span>Чт</span>
                <span>Пт</span>
                <span className="we">Сб</span>
                <span className="we">Вс</span>
              </div>
              <div className="dp-grid">
                {days.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    disabled={!d.ok}
                    className={`dp-cell ${d.cls}`}
                    onClick={() => {
                      if (!d.ok) return;
                      onChange(d.iso);
                      close();
                    }}
                  >
                    {d.n}
                  </button>
                ))}
              </div>
            </>
          ) : mode === 'months' ? (
            <div className="dp-grid3">
              {monthCells.map((c) => (
                <button
                  key={c.idx}
                  type="button"
                  className={`dp-cell ${c.cls}`}
                  onClick={() => {
                    setViewYm(`${vy}-${p2(c.idx)}`);
                    setMode('days');
                  }}
                >
                  {c.n}
                </button>
              ))}
            </div>
          ) : (
            <div className="dp-grid3">
              {yearCells.map((c) => (
                <button
                  key={c.year}
                  type="button"
                  className={`dp-cell ${c.cls}`}
                  onClick={() => {
                    setViewYm(`${c.year}-${p2(vm)}`);
                    setMode('months');
                  }}
                >
                  {c.n}
                </button>
              ))}
            </div>
          )}

          <div className="dp-foot">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (okDay(todayIso)) {
                  onChange(todayIso);
                  close();
                } else {
                  setViewYm(todayIso.slice(0, 7));
                  setMode('days');
                }
              }}
            >
              Сегодня
            </button>
            {clearable ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  onChange('');
                  close();
                }}
              >
                Очистить
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
