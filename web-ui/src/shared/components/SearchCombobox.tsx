'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Search, HelpCircle, X } from 'lucide-react';

export interface SearchComboboxOption {
  value: string;
  label: string;
  hint?: string;
  description?: string;
  title?: string;
  disabled?: boolean;
  avatar?: React.ReactNode;
  keywords?: string[];
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
  const [activeHelp, setActiveHelp] = useState<{ id: string; text: string; right: number; y: number } | null>(null);

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
    const qClean = q.replace(/[\s\(\)\-+]/g, '');
    return options.filter((o) => {
      const kw = o.keywords ? o.keywords.join(' ').toLowerCase() : '';
      const fullText = `${o.label} ${o.hint || ''} ${o.description || ''} ${kw}`.toLowerCase();
      if (fullText.includes(q)) return true;
      if (qClean.length >= 2) {
        const fullClean = fullText.replace(/[\s\(\)\-+]/g, '');
        if (fullClean.includes(qClean)) return true;
      }
      return false;
    });
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

  const showAvatarInInput = Boolean(selected?.avatar && !open);

  return (
    <div className={`cb ${open ? 'open' : ''}`} ref={wrapRef}>
      {showAvatarInInput && (
        <span
          style={{
            position: 'absolute',
            left: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          {selected?.avatar}
        </span>
      )}
      <input
        ref={inputRef}
        id={id}
        type="text"
        className={`input cb-input ${invalid ? 'invalid' : ''}`}
        style={showAvatarInInput ? { paddingLeft: '38px' } : undefined}
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
      {value && value !== 'ALL' && value !== 'all' && !disabled ? (
        <button
          type="button"
          tabIndex={-1}
          className="btn btn-ghost btn-icon cb-clear"
          aria-label="Сбросить выбор"
          title="Сбросить"
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 22,
            height: 22,
            padding: 0,
            zIndex: 3,
          }}
          onClick={(e) => {
            e.stopPropagation();
            const resetOpt = options.find((o) => o.value === 'ALL' || o.value === 'all' || o.value === '');
            onChange(resetOpt ? resetOpt.value : '');
            setQuery('');
            setOpen(false);
          }}
        >
          <X size={14} className="ic" />
        </button>
      ) : (
        <Search className="ic cb-chev" />
      )}

      {open && activeHelp && (
        <div
          className="cb-help-popover"
          style={{
            position: 'absolute',
            right: activeHelp.right,
            top: activeHelp.y - 6,
            transform: 'translateY(-100%)',
            maxWidth: 'calc(100% - 24px)',
            zIndex: 120,
          }}
        >
          {activeHelp.text}
        </div>
      )}

      {open && (
        <div id={listboxId} className="popover menu dd-menu" role="listbox">
          {shown.length === 0 ? (
            <div className="menu-label">{emptyLabel}</div>
          ) : (
            shown.map((opt, idx) => {
              const isSelected = opt.value === value;
              const desc = opt.description || (opt.hint && opt.hint.length > 24 ? opt.hint : undefined);
              const shortHint = !desc ? opt.hint : undefined;

              return (
                <button
                  key={opt.value}
                  type="button"
                  tabIndex={-1}
                  role="option"
                  aria-selected={isSelected}
                  title={opt.title || desc}
                  disabled={opt.disabled}
                  className={`menu-item ${isSelected ? 'on' : ''} ${idx === activeIdx ? 'active' : ''} ${
                    opt.disabled ? 'disabled' : ''
                  }`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px' }}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(opt);
                    inputRef.current?.blur();
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
                      flex: '1 1 auto',
                      minWidth: 0,
                      textAlign: 'left',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                    }}
                  >
                    {opt.label}
                  </span>

                  {desc && (
                    <span
                      className="cb-help-trigger"
                      title={desc}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const wrapRect = wrapRef.current?.getBoundingClientRect() || rect;
                        const rightOffset = Math.max(8, wrapRect.right - rect.right);
                        setActiveHelp({
                          id: opt.value,
                          text: desc,
                          right: rightOffset,
                          y: rect.top - wrapRect.top,
                        });
                      }}
                      onMouseLeave={() => setActiveHelp(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <HelpCircle size={14} className="ic muted" />
                    </span>
                  )}

                  {shortHint && (
                    <span
                      className="small muted mi-hint shrink-0"
                      style={{ marginLeft: 'auto', paddingLeft: 8, whiteSpace: 'nowrap' }}
                    >
                      {shortHint}
                    </span>
                  )}

                  {isSelected && (
                    <Check
                      className="ic"
                      style={{
                        marginLeft: shortHint ? '8px' : 'auto',
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
