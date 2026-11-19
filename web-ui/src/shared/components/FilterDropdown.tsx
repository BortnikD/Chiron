'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface FilterDropdownOption {
  value: string;
  label: string;
  hint?: string;
  title?: string;
  disabled?: boolean;
  avatar?: React.ReactNode;
}

export interface FilterDropdownProps {
  value: string;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Выберите',
  invalid = false,
  searchable = false,
  searchPlaceholder = 'Поиск…',
  disabled = false,
  id,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    setSearchQuery('');
    const handleMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    const timer = searchable ? window.setTimeout(() => searchRef.current?.focus(), 20) : undefined;
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [open, searchable]);

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const visibleOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!searchable || !q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.hint ? o.hint.toLowerCase().includes(q) : false)
    );
  }, [options, searchQuery, searchable]);

  return (
    <div className="dd" ref={wrapRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        className={`select dd-btn ${invalid ? 'invalid' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        <span className="row" style={{ gap: 8, alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
          {selected?.avatar}
          <span
            className={!selected ? 'muted' : undefined}
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown className="ic" style={{ flex: 'none' }} />
      </button>

      {open && (
        <div id={listboxId} className="popover menu dd-menu" role="listbox">
          {searchable && (
            <div style={{ padding: '4px 4px 6px' }}>
              <input
                ref={searchRef}
                type="text"
                className="input input-sm"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {visibleOptions.length === 0 ? (
            <div className="menu-label">Ничего не найдено</div>
          ) : (
            visibleOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  title={opt.title}
                  disabled={opt.disabled}
                  className={`menu-item ${isSelected ? 'on' : ''} ${opt.disabled ? 'disabled' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}
                  onClick={() => {
                    if (opt.disabled) return;
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.avatar && (
                    <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center' }}>
                      {opt.avatar}
                    </span>
                  )}
                  <span
                    className="mi-label"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      textAlign: 'left',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {opt.label}
                  </span>
                  {opt.hint && (
                    <span className="small muted mi-hint" style={{ flex: 'none' }}>
                      {opt.hint}
                    </span>
                  )}
                  {isSelected && (
                    <Check
                      className="ic"
                      style={{
                        marginLeft: opt.hint ? '8px' : 'auto',
                        color: 'var(--primary-text)',
                        flex: 'none',
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
