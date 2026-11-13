'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Search } from 'lucide-react';

export interface SearchComboboxOption {
  value: string;
  label: string;
  hint?: string;
  title?: string;
  disabled?: boolean;
}

export interface SearchComboboxProps {
  value: string;
  options: SearchComboboxOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  ariaLabel?: string;
}

export const SearchCombobox: React.FC<SearchComboboxProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Поиск…',
  emptyLabel = 'Ничего не найдено',
  disabled = false,
  invalid = false,
  id,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<number | null>(null);
  const listboxId = useId();

  useEffect(() => {
    return () => {
      if (blurTimerRef.current !== null) {
        window.clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.hint || ''}`.toLowerCase().includes(q));
  }, [options, query]);

  const choose = (opt: SearchComboboxOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIdx(0);
        return;
      }
      if (shown.length > 0) {
        setActiveIdx((prev) => (prev + 1 < shown.length ? prev + 1 : 0));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open && shown.length > 0) {
        setActiveIdx((prev) => (prev - 1 >= 0 ? prev - 1 : shown.length - 1));
      }
      return;
    }

    if (e.key === 'Enter' && open) {
      e.preventDefault();
      const target =
        shown[activeIdx] && !shown[activeIdx].disabled
          ? shown[activeIdx]
          : shown.find((o) => !o.disabled);
      if (target) {
        choose(target);
        inputRef.current?.blur();
      }
    }
  };

  return (
    <div className="cb" ref={wrapRef}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        className={`input cb-input ${invalid ? 'invalid' : ''}`}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-label={ariaLabel || placeholder}
        aria-expanded={open}
        placeholder={selected ? selected.label : placeholder}
        value={open ? query : selected ? selected.label : ''}
        disabled={disabled}
        onFocus={() => {
          if (disabled) return;
          if (blurTimerRef.current !== null) {
            window.clearTimeout(blurTimerRef.current);
            blurTimerRef.current = null;
          }
          setOpen(true);
          setQuery('');
          const idx = Math.max(
            0,
            options.findIndex((o) => o.value === value && !o.disabled)
          );
          setActiveIdx(idx);
        }}
        onChange={(e) => {
          setOpen(true);
          setQuery(e.target.value);
          setActiveIdx(0);
        }}
        onBlur={() => {
          blurTimerRef.current = window.setTimeout(() => {
            setOpen(false);
            setQuery('');
          }, 120);
        }}
        onKeyDown={handleKeyDown}
      />
      <Search className="ic cb-chev" />

      {open && (
        <div id={listboxId} className="popover menu dd-menu" role="listbox">
          {shown.length === 0 ? (
            <div className="menu-label">{emptyLabel}</div>
          ) : (
            shown.map((opt, idx) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  tabIndex={-1}
                  role="option"
                  aria-selected={isSelected}
                  title={opt.title}
                  disabled={opt.disabled}
                  className={`menu-item ${isSelected ? 'on' : ''} ${idx === activeIdx ? 'active' : ''} ${
                    opt.disabled ? 'disabled' : ''
                  }`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(opt);
                    inputRef.current?.blur();
                  }}
                >
                  <span className="mi-label">{opt.label}</span>
                  {opt.hint && <span className="small muted mi-hint">{opt.hint}</span>}
                  {isSelected && (
                    <Check
                      className="ic"
                      style={{
                        marginLeft: opt.hint ? '8px' : 'auto',
                        color: 'var(--primary-text)',
                      }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
